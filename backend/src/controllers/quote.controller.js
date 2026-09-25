import { z } from 'zod';
import { QuoteRequest } from '../models/QuoteRequest.js';
import { CabinetProfile } from '../models/CabinetProfile.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notify } from '../utils/notification.js';

const createSchema = z.object({
  cabinet: z.string().min(1, 'Le cabinet est requis'),
  service: z.string().min(2, 'Veuillez préciser le service souhaité (minimum 2 caractères)'),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères pour que le cabinet puisse comprendre votre besoin.'),
  documents: z.array(z.string()).optional(),
});

const respondSchema = z.object({
  status: z.enum(['accepted', 'declined']),
  price: z.coerce.number().min(0).optional(),
  duration: z.string().optional(),
  message: z.string().optional(),
});

export const createQuote = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);

  const cabinetUser = await User.findById(data.cabinet);
  if (!cabinetUser || cabinetUser.role !== 'cabinet') {
    throw new AppError(404, 'Cabinet introuvable');
  }
  const cabinetProfile = await CabinetProfile.findOne({ user: data.cabinet });
  if (!cabinetProfile || cabinetProfile.status !== 'approved') {
    throw new AppError(403, 'Ce cabinet n\'accepte pas encore les demandes');
  }

  const quote = await QuoteRequest.create({
    entreprise: req.user.id,
    cabinet: data.cabinet,
    service: data.service,
    budget: data.budget,
    timeline: data.timeline,
    description: data.description,
    documents: data.documents || [],
  });

  await notify(
    data.cabinet,
    'quote',
    'Nouvelle demande de devis',
    `Vous avez reçu une demande de devis (${data.service}).`,
    { quoteId: quote._id.toString() }
  );

  res.status(201).json({ success: true, data: quote });
});

export const myQuotes = asyncHandler(async (req, res) => {
  const role = req.user.role;
  const filter = role === 'entreprise' ? { entreprise: req.user.id } : { cabinet: req.user.id };
  const items = await QuoteRequest.find(filter)
    .sort({ createdAt: -1 })
    .populate('entreprise', 'fullName email')
    .populate('cabinet', 'fullName email');

  const cabinetIds = [...new Set(items.map((i) => i.cabinet?._id?.toString()).filter(Boolean))];
  const entrepriseIds = [...new Set(items.map((i) => i.entreprise?._id?.toString()).filter(Boolean))];
  const [cabinetProfiles, entrepriseProfiles] = await Promise.all([
    CabinetProfile.find({ user: { $in: cabinetIds } }).select('user firmName logo city status'),
    import('../models/EntrepriseProfile.js').then((m) =>
      m.EntrepriseProfile.find({ user: { $in: entrepriseIds } }).select('user companyName logo city')
    ),
  ]);
  const cabinetByName = new Map(cabinetProfiles.map((c) => [c.user.toString(), c]));
  const entrepriseByName = new Map(entrepriseProfiles.map((c) => [c.user.toString(), c]));

  const data = items.map((i) => {
    const c = i.cabinet?._id ? cabinetByName.get(i.cabinet._id.toString()) : undefined;
    const e = i.entreprise?._id ? entrepriseByName.get(i.entreprise._id.toString()) : undefined;
    return {
      ...i.toJSON(),
      cabinetProfile: c,
      entrepriseProfile: e,
    };
  });

  res.json({ success: true, data });
});

export const getQuote = asyncHandler(async (req, res) => {
  const quote = await QuoteRequest.findById(req.params.id)
    .populate('entreprise', 'fullName email')
    .populate('cabinet', 'fullName email');
  if (!quote) throw new AppError(404, 'Demande introuvable');

  const isInvolved =
    quote.entreprise._id.toString() === req.user.id ||
    quote.cabinet._id.toString() === req.user.id;
  if (!isInvolved && req.user.role !== 'admin') {
    throw new AppError(403, 'Accès refusé');
  }
  res.json({ success: true, data: quote });
});

export const respondToQuote = asyncHandler(async (req, res) => {
  const data = respondSchema.parse(req.body);
  const quote = await QuoteRequest.findById(req.params.id).populate('entreprise', 'email fullName');
  if (!quote) throw new AppError(404, 'Demande introuvable');
  if (quote.cabinet.toString() !== req.user.id) throw new AppError(403, 'Seul le cabinet concerné peut répondre');
  if (quote.status !== 'pending') throw new AppError(400, 'Cette demande a déjà été traitée');

  quote.status = data.status;
  quote.response = {
    price: data.price || 0,
    duration: data.duration || '',
    message: data.message || '',
    respondedAt: new Date(),
  };
  await quote.save();

  const statusLabel = data.status === 'accepted' ? 'acceptée' : 'refusée';
  await notify(
    quote.entreprise._id.toString(),
    'quote',
    'Réponse à votre demande de devis',
    `Votre demande de devis a été ${statusLabel}.`,
    { quoteId: quote._id.toString() }
  );

  res.json({ success: true, data: quote });
});

export const cancelQuote = asyncHandler(async (req, res) => {
  const quote = await QuoteRequest.findById(req.params.id);
  if (!quote) throw new AppError(404, 'Demande introuvable');
  if (quote.entreprise.toString() !== req.user.id) throw new AppError(403, 'Accès refusé');
  if (quote.status !== 'pending') throw new AppError(400, 'Cette demande ne peut plus être annulée');

  quote.status = 'cancelled';
  await quote.save();
  res.json({ success: true, data: quote });
});
