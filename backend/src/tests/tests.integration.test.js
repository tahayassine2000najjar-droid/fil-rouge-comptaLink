import request from 'supertest';
import mongoose from 'mongoose';
import { EntrepriseProfile } from '../models/EntrepriseProfile.js';
import { User } from '../models/User.js';

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/comptalink_test';

process.env.NODE_ENV = 'test';
process.env.MONGO_URI = TEST_MONGO_URI;

let app;
let entrepriseUserId;
let entrepriseToken;
let cabinetToken;

async function registerAndLogin(payload) {
  const registered = await request(app).post('/api/auth/register').send(payload);
  expect(registered.statusCode).toBe(201);

  const logged = await request(app)
    .post('/api/auth/login')
    .send({ email: payload.email, password: payload.password });
  expect(logged.statusCode).toBe(200);

  return { userId: registered.body.user._id, token: logged.body.accessToken };
}

beforeAll(async () => {
  ({ app } = await import('../server.js'));
  await mongoose.connect(TEST_MONGO_URI);
  await mongoose.connection.dropDatabase();

  const entreprise = await registerAndLogin({
    email: 'entreprise.create@test.com',
    password: 'password123',
    fullName: 'Entreprise Create',
    role: 'entreprise',
    companyName: 'Créé à l’inscription',
  });
  entrepriseUserId = entreprise.userId;
  entrepriseToken = entreprise.token;

  
  await EntrepriseProfile.deleteOne({ user: entrepriseUserId });

  const cabinet = await registerAndLogin({
    email: 'cabinet.create@test.com',
    password: 'password123',
    fullName: 'Cabinet Create',
    role: 'cabinet',
    firmName: 'Cabinet Test',
  });
  cabinetToken = cabinet.token;
}, 30000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}, 30000);

describe('Integration : POST /api/entreprise (creation d’entreprise)', () => {
  it('201 - cree le profil, le persiste et le lit via /entreprise/me', async () => {
    const res = await request(app)
      .post('/api/entreprise')
      .set('Authorization', `Bearer ${entrepriseToken}`)
      .send({
        companyName: 'ACME SARL',
        legalForm: 'SAS',
        siret: '12345678901234',
        city: 'Lyon',
        country: 'Canada',
        foundedYear: '2001',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.companyName).toBe('ACME SARL');
    expect(res.body.data.legalForm).toBe('SAS');
    expect(res.body.data.siret).toBe('12345678901234');
    expect(res.body.data.user).toBe(entrepriseUserId);
    expect(typeof res.body.data.foundedYear).toBe('number');
    expect(res.body.data.foundedYear).toBe(2001);

    const stored = await EntrepriseProfile.findOne({ user: entrepriseUserId }).lean();
    expect(stored).not.toBeNull();
    expect(stored.city).toBe('Lyon');
    expect(stored.country).toBe('Canada');
    expect(stored.foundedYear).toBe(2001);

    const read = await request(app)
      .get('/api/entreprise/me')
      .set('Authorization', `Bearer ${entrepriseToken}`);
    expect(read.statusCode).toBe(200);
    expect(read.body.data.companyName).toBe('ACME SARL');
  });

  it('201 - applique les valeurs par defaut du modele', async () => {
    const registered = await request(app).post('/api/auth/register').send({
      email: 'entreprise.defaults@test.com',
      password: 'password123',
      fullName: 'Entreprise Defaults',
      role: 'entreprise',
    });
    expect(registered.statusCode).toBe(201);
    const newUserId = registered.body.user._id;
    await EntrepriseProfile.deleteOne({ user: newUserId });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'entreprise.defaults@test.com', password: 'password123' });
    const newToken = login.body.accessToken;

    const res = await request(app)
      .post('/api/entreprise')
      .set('Authorization', `Bearer ${newToken}`)
      .send({ companyName: 'Société Sans Détails' });

    expect(res.statusCode).toBe(201);
    expect(res.body.data.country).toBe('France');
    expect(res.body.data.city).toBe('');
    expect(typeof res.body.data.foundedYear).toBe('number');

    await User.deleteOne({ _id: newUserId });
    await EntrepriseProfile.deleteOne({ user: newUserId });
  });

  it('409 - refuse la creation si un profil existe deja', async () => {
    await EntrepriseProfile.updateOne(
      { user: entrepriseUserId },
      { $setOnInsert: { companyName: 'Profil déjà présent' } },
      { upsert: true }
    );

    const res = await request(app)
      .post('/api/entreprise')
      .set('Authorization', `Bearer ${entrepriseToken}`)
      .send({ companyName: 'Doublon' });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/existe déjà/i);
  });

  it('400 - refuse un companyName trop court et un foundedYear invalide', async () => {
    const res = await request(app)
      .post('/api/entreprise')
      .set('Authorization', `Bearer ${entrepriseToken}`)
      .send({ companyName: 'A', foundedYear: 1200 });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.map((e) => e.field)).toEqual(
      expect.arrayContaining(['companyName', 'foundedYear'])
    );
  });

  it('400 - refuse un companyName manquant', async () => {
    const res = await request(app)
      .post('/api/entreprise')
      .set('Authorization', `Bearer ${entrepriseToken}`)
      .send({ legalForm: 'SAS', city: 'Paris' });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors[0].field).toBe('companyName');
  });

  it('401 - refuse l’acces sans jeton', async () => {
    const res = await request(app).post('/api/entreprise').send({ companyName: 'ACME' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Authentification requise/);
  });

  it('401 - refuse un jeton invalide', async () => {
    const res = await request(app)
      .post('/api/entreprise')
      .set('Authorization', 'Bearer jeton-absurde')
      .send({ companyName: 'ACME' });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toMatch(/Session invalide/);
  });

  it('403 - refuse un utilisateur au role cabinet', async () => {
    const res = await request(app)
      .post('/api/entreprise')
      .set('Authorization', `Bearer ${cabinetToken}`)
      .send({ companyName: 'ACME' });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/permissions insuffisantes/);
  });
});
