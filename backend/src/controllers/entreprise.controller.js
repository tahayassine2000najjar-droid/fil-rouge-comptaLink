import { z } from 'zod';
import { EntrepriseProfile } from '../models/EntrepriseProfile.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const createSchema = z.object({
  companyName: z.string().min(2),
  legalForm: z.string().optional(),
  siret: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  foundedYear: z.coerce.number().int().min(1800).max(2100).optional(),
});

const updateSchema = z.object({
  companyName: z.string().min(2).optional(),
  legalForm: z.string().optional(),
  siret: z.string().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  description: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  foundedYear: z.coerce.number().int().min(1800).max(2100).optional(),
});

export const createEntreprise = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);

  const existing = await EntrepriseProfile.findOne({ user: req.user.id });
  if (existing) throw new AppError(409, 'Un profil entreprise existe déjà pour ce compte');

  const profile = await EntrepriseProfile.create({ user: req.user.id, ...data });
  res.status(201).json({ success: true, data: profile });
});

export const getMyEntreprise = asyncHandler(async (req, res) => {
  const profile = await EntrepriseProfile.findOne({ user: req.user.id });
  if (!profile) throw new AppError(404, 'Profil entreprise introuvable');
  res.json({ success: true, data: profile });
});

export const updateMyEntreprise = asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body);
  const profile = await EntrepriseProfile.findOne({ user: req.user.id });
  if (!profile) throw new AppError(404, 'Profil entreprise introuvable');

  Object.assign(profile, data);
  await profile.save();
  res.json({ success: true, data: profile });
});

export const deleteMyEntreprise = asyncHandler(async (req, res) => {
  const profile = await EntrepriseProfile.findOne({ user: req.user.id });
  if (!profile) throw new AppError(404, 'Profil entreprise introuvable');

  await EntrepriseProfile.deleteOne({ _id: profile._id });
  await User.deleteOne({ _id: req.user.id });

  res.json({ success: true, message: 'Compte entreprise supprimé avec succès.' });
});
