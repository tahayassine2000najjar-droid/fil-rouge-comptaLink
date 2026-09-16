import { z } from 'zod';
import { CabinetProfile } from '../models/CabinetProfile.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { publicUrl } from '../utils/upload.js';

const listQuerySchema = z.object({
  search: z.string().optional(),
  city: z.string().optional(),
  service: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(['rating', 'reviews', 'newest']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(12),
});

const updateSchema = z.object({
  firmName: z.string().min(2).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  legalForm: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  emailContact: z.string().email().optional(),
  website: z.string().optional(),
  experienceYears: z.coerce.number().int().min(0).optional(),
  teamSize: z.coerce.number().int().min(1).optional(),
  services: z.array(z.string()).optional(),
  specialities: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
});

export const listCabinets = asyncHandler(async (req, res) => {
  const q = listQuerySchema.parse(req.query);

  const filter = { status: 'approved' };
  if (q.search) {
    filter.$or = [
      { firmName: { $regex: q.search, $options: 'i' } },
      { tagline: { $regex: q.search, $options: 'i' } },
      { description: { $regex: q.search, $options: 'i' } },
      { city: { $regex: q.search, $options: 'i' } },
    ];
  }
  if (q.city) filter.city = { $regex: q.city, $options: 'i' };
  if (q.service) filter.services = q.service;
  if (q.minRating) filter.ratingAvg = { $gte: q.minRating };

  const sort =
    q.sort === 'reviews'
      ? { reviewCount: -1 }
      : q.sort === 'newest'
        ? { createdAt: -1 }
        : { ratingAvg: -1, reviewCount: -1 };

  const skip = (q.page - 1) * q.limit;
  const [total, items] = await Promise.all([
    CabinetProfile.countDocuments(filter),
    CabinetProfile.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(q.limit)
      .populate('user', 'email createdAt'),
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) },
  });
});

export const getCabinet = asyncHandler(async (req, res) => {
  const cabinet = await CabinetProfile.findById(req.params.id).populate('user', 'email createdAt');
  if (!cabinet) throw new AppError(404, 'Cabinet introuvable');

  if (cabinet.status !== 'approved' && req.user?.id !== cabinet.user._id.toString()) {
    throw new AppError(403, 'Ce cabinet n\'est pas encore public');
  }

  res.json({ success: true, data: cabinet });
});

export const getMyCabinet = asyncHandler(async (req, res) => {
  const cabinet = await CabinetProfile.findOne({ user: req.user.id }).populate('user', 'email createdAt');
  if (!cabinet) throw new AppError(404, 'Profil cabinet introuvable. Contactez le support.');
  res.json({ success: true, data: cabinet });
});

export const updateMyCabinet = asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body);
  console.log('Update Cabinet req.body:', req.body, 'Parsed data:', data);

  const cabinet = await CabinetProfile.findOneAndUpdate(
    { user: req.user.id },
    { $set: data },
    { new: true, runValidators: true }
  ).populate('user', 'email createdAt');

  if (!cabinet) throw new AppError(404, 'Profil cabinet introuvable');

  res.json({ success: true, data: cabinet });
});

export const uploadDocument = asyncHandler(async (req, res) => {
  const cabinet = await CabinetProfile.findOne({ user: req.user.id });
  if (!cabinet) throw new AppError(404, 'Profil cabinet introuvable');
  if (!req.file) throw new AppError(400, 'Aucun fichier fourni');

  cabinet.documents.push({
    name: req.file.originalname,
    filePath: publicUrl(req.file.path),
    uploadedAt: new Date(),
  });

  if (cabinet.status === 'rejected') {
    cabinet.status = 'pending';
    cabinet.rejectionReason = '';
  }

  await cabinet.save();
  res.status(201).json({ success: true, data: cabinet });
});

export const removeDocument = asyncHandler(async (req, res) => {
  const cabinet = await CabinetProfile.findOne({ user: req.user.id });
  if (!cabinet) throw new AppError(404, 'Profil cabinet introuvable');

  cabinet.documents = cabinet.documents.filter((d) => d._id?.toString() !== req.params.docId);
  await cabinet.save();
  res.json({ success: true, data: cabinet });
});
