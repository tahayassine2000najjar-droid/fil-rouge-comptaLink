import { z } from 'zod';
import { Appointment } from '../models/Appointment.js';
import { User } from '../models/User.js';
import { CabinetProfile } from '../models/CabinetProfile.js';
import { EntrepriseProfile } from '../models/EntrepriseProfile.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notify } from '../utils/notification.js';

const createSchema = z.object({
  cabinet: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (AAAA-MM-JJ)'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure invalide (HH:MM)'),
  durationMin: z.coerce.number().int().min(15).max(240).default(30),
  mode: z.enum(['visio', 'phone', 'onsite']).default('visio'),
  purpose: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export const createAppointment = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);

  const cabinetUser = await User.findById(data.cabinet);
  if (!cabinetUser || cabinetUser.role !== 'cabinet') throw new AppError(404, 'Cabinet introuvable');

  const cabinetProfile = await CabinetProfile.findOne({ user: data.cabinet });
  if (!cabinetProfile || cabinetProfile.status !== 'approved') {
    throw new AppError(403, 'Ce cabinet n\'accepte pas encore les rendez-vous');
  }

  const conflict = await Appointment.findOne({
    cabinet: data.cabinet,
    date: data.date,
    time: data.time,
    status: { $in: ['pending', 'confirmed'] },
  });
  if (conflict) throw new AppError(409, 'Ce cr\u00e9neau est d\u00e9j\u00e0 r\u00e9serv\u00e9');

  const appointment = await Appointment.create({
    ...data,
    entreprise: req.user.id,
  });

  await notify(
    data.cabinet,
    'appointment',
    'Nouvelle demande de rendez-vous',
    `Vous avez re\u00e7u une demande de rendez-vous le ${data.date} \u00e0 ${data.time}.`,
    { appointmentId: appointment._id.toString() }
  );

  res.status(201).json({ success: true, data: appointment });
});

export const myAppointments = asyncHandler(async (req, res) => {
  const role = req.user.role;
  const filter = role === 'entreprise' ? { entreprise: req.user.id } : { cabinet: req.user.id };

  const items = await Appointment.find(filter).sort({ date: -1, time: -1 });

  const otherIds = items.map((i) => (role === 'entreprise' ? i.cabinet.toString() : i.entreprise.toString()));
  const [users, cabinetProfiles, entrepriseProfiles] = await Promise.all([
    User.find({ _id: { $in: otherIds } }).select('fullName email'),
    CabinetProfile.find({ user: { $in: otherIds } }).select('user firmName logo city'),
    EntrepriseProfile.find({ user: { $in: otherIds } }).select('user companyName logo city'),
  ]);
  const userMap = new Map(users.map((u) => [u.id, u]));
  const cabinetMap = new Map(cabinetProfiles.map((c) => [c.user.toString(), c]));
  const entrepriseMap = new Map(entrepriseProfiles.map((c) => [c.user.toString(), c]));

  const data = items.map((i) => {
    const otherId = role === 'entreprise' ? i.cabinet.toString() : i.entreprise.toString();
    return {
      ...i.toJSON(),
      other: userMap.get(otherId),
      cabinetProfile: cabinetMap.get(otherId),
      entrepriseProfile: entrepriseMap.get(otherId),
    };
  });

  res.json({ success: true, data });
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status } = z.object({ status: z.enum(['confirmed', 'cancelled', 'completed']) }).parse(req.body);
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw new AppError(404, 'Rendez-vous introuvable');

  const isCabinet = appointment.cabinet.toString() === req.user.id;
  const isEntreprise = appointment.entreprise.toString() === req.user.id;
  if (!isCabinet && !isEntreprise) throw new AppError(403, 'Acc\u00e8s refus\u00e9');

  if (status === 'completed' && !isCabinet) throw new AppError(403, 'Seul le cabinet peut cl\u00f4turer un rendez-vous');
  if (status === 'confirmed' && !isCabinet) throw new AppError(403, 'Seul le cabinet peut confirmer un rendez-vous');

  appointment.status = status;
  await appointment.save();

  const target = isCabinet ? appointment.entreprise : appointment.cabinet;
  await notify(
    target.toString(),
    'appointment',
    'Mise \u00e0 jour de rendez-vous',
    `Votre rendez-vous du ${appointment.date} \u00e0 ${appointment.time} est maintenant \u00ab ${status} \u00bb.`,
    { appointmentId: appointment._id.toString() }
  );

  res.json({ success: true, data: appointment });
});
