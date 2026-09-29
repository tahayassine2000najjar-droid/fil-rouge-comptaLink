import { jest } from '@jest/globals';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

const findOneMock = jest.fn();
const createMock = jest.fn();
const deleteOneMock = jest.fn();

jest.unstable_mockModule('../models/EntrepriseProfile.js', () => ({
  EntrepriseProfile: { findOne: findOneMock, create: createMock },
}));

jest.unstable_mockModule('../models/User.js', () => ({
  User: { deleteOne: deleteOneMock },
}));

const { createEntreprise } = await import('../controllers/entreprise.controller.js');
const { requireRole } = await import('../middleware/auth.js');

const USER = { id: 'user-1', role: 'entreprise', email: 'contact@acme.fr' };

function invoke(body, user = USER) {
  return new Promise((resolve) => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn((payload) =>
        resolve({ kind: 'response', statusCode: res.status.mock.calls[0][0], payload })
      ),
    };
    const next = (err) => resolve({ kind: 'next', err });
    createEntreprise({ body, user }, res, next);
  });
}

function runGuard(roles, req) {
  return new Promise((resolve) => {
    requireRole(...roles)(req, {}, (err) => resolve(err));
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  findOneMock.mockReset().mockResolvedValue(null);
  createMock.mockReset().mockResolvedValue({ _id: 'profile-1' });
  deleteOneMock.mockReset().mockResolvedValue({ deletedCount: 1 });
});

describe('Unitaire : createEntreprise', () => {
  it('répond 201 et crée le profil avec le bon utilisateur', async () => {
    createMock.mockResolvedValue({ _id: 'profile-1', companyName: 'ACME' });

    const result = await invoke({ companyName: 'ACME' });

    expect(result.kind).toBe('response');
    expect(result.statusCode).toBe(201);
    expect(result.payload).toEqual({
      success: true,
      data: { _id: 'profile-1', companyName: 'ACME' },
    });
    expect(findOneMock).toHaveBeenCalledWith({ user: 'user-1' });
    expect(createMock).toHaveBeenCalledTimes(1);
    expect(createMock).toHaveBeenCalledWith({ user: 'user-1', companyName: 'ACME' });
  });

  it('n’envoie que les champs fournis (champs optionnels absents)', async () => {
    const result = await invoke({ companyName: 'ACME' });

    expect(result.statusCode).toBe(201);
    expect(createMock).toHaveBeenCalledWith({ user: 'user-1', companyName: 'ACME' });
    expect(Object.keys(createMock.mock.calls[0][0])).toEqual(['user', 'companyName']);
  });

  it('transmet les champs optionnels et convertit foundedYear en nombre', async () => {
    const result = await invoke({
      companyName: 'ACME',
      legalForm: 'SAS',
      siret: '12345678901234',
      city: 'Lyon',
      foundedYear: '2001',
    });

    expect(result.statusCode).toBe(201);
    expect(createMock).toHaveBeenCalledWith({
      user: 'user-1',
      companyName: 'ACME',
      legalForm: 'SAS',
      siret: '12345678901234',
      city: 'Lyon',
      foundedYear: 2001,
    });
    expect(typeof createMock.mock.calls[0][0].foundedYear).toBe('number');
  });

  it('rejette un companyName absent', async () => {
    const result = await invoke({ legalForm: 'SAS' });

    expect(result.kind).toBe('next');
    expect(result.err).toBeInstanceOf(ZodError);
    expect(findOneMock).not.toHaveBeenCalled();
    expect(createMock).not.toHaveBeenCalled();
  });

  it('rejette un companyName trop court', async () => {
    const result = await invoke({ companyName: 'A' });

    expect(result.kind).toBe('next');
    expect(result.err).toBeInstanceOf(ZodError);
    expect(result.err.errors[0].path).toEqual(['companyName']);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('rejette un foundedYear hors des bornes', async () => {
    const result = await invoke({ companyName: 'ACME', foundedYear: 1200 });

    expect(result.kind).toBe('next');
    expect(result.err).toBeInstanceOf(ZodError);
    expect(result.err.errors[0].path).toEqual(['foundedYear']);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('rejette un foundedYear non numérique', async () => {
    const result = await invoke({ companyName: 'ACME', foundedYear: 'abc' });

    expect(result.kind).toBe('next');
    expect(result.err).toBeInstanceOf(ZodError);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('répond 409 quand un profil existe déjà', async () => {
    findOneMock.mockResolvedValue({ _id: 'existing', companyName: 'Ancienne société' });

    const result = await invoke({ companyName: 'ACME' });

    expect(result.kind).toBe('next');
    expect(result.err).toBeInstanceOf(AppError);
    expect(result.err.statusCode).toBe(409);
    expect(result.err.message).toMatch(/existe déjà/i);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('propage une erreur de base de données', async () => {
    const dbError = new Error('mongo down');
    createMock.mockRejectedValue(dbError);

    const result = await invoke({ companyName: 'ACME' });

    expect(result.kind).toBe('next');
    expect(result.err).toBe(dbError);
  });
});

describe('Unitaire : requireRole("entreprise") sur la route de création', () => {
  it('accepte un utilisateur dont le rôle est entreprise', async () => {
    const err = await runGuard(['entreprise'], { user: USER });

    expect(err).toBeUndefined();
  });

  it('refuse un utilisateur dont le rôle est cabinet (403)', async () => {
    const err = await runGuard(['entreprise'], {
      user: { id: 'user-2', role: 'cabinet', email: 'cabinet@test.com' },
    });

    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.message).toMatch(/permissions insuffisantes/);
  });

  it('refuse une requête sans utilisateur authentifié (401)', async () => {
    const err = await runGuard(['entreprise'], {});

    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(401);
  });
});
