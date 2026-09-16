import { z } from 'zod';
import { QuoteRequest } from '../models/QuoteRequest.js';
import { CabinetProfile } from '../models/CabinetProfile.js';
import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { notify } from '../utils/notification.js';
import { sendMail } from '../utils/mailer.js';
import { buildQuotePdf } from '../utils/pdf.js';
 import { env } from '../config/env.js';

const createSchema = z.object({
  cabinet: z.string().min(1),
  service: z.string().min(2),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  description: z.string().min(10),
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
    `Vous avez re\u00e7u une demande de devis (${data.service}).`,
    { quoteId: quote._id.toString() }
  );
  await sendMail({
    to: cabinetUser.email,
    subject: 'ComptaLink - Nouvelle demande de devis',
    html: `<p>Vous avez re\u00e7u une nouvelle demande de devis. Connectez-vous \u00e0 votre espace pour y r\u00e9pondre.</p>`,
  });

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
    throw new AppError(403, 'Acc\u00e8s refus\u00e9');
  }
  res.json({ success: true, data: quote });
});

export const respondToQuote = asyncHandler(async (req, res) => {
  const data = respondSchema.parse(req.body);
  const quote = await QuoteRequest.findById(req.params.id).populate('entreprise', 'email fullName');
  if (!quote) throw new AppError(404, 'Demande introuvable');
  if (quote.cabinet.toString() !== req.user.id) throw new AppError(403, 'Seul le cabinet concern\u00e9 peut r\u00e9pondre');
  if (quote.status !== 'pending') throw new AppError(400, 'Cette demande a d\u00e9j\u00e0 \u00e9t\u00e9 trait\u00e9e');

  quote.status = data.status;
  quote.response = {
    price: data.price || 0,
    duration: data.duration || '',
    message: data.message || '',
    respondedAt: new Date(),
  };
  await quote.save();

  const statusLabel = data.status === 'accepted' ? 'accept\u00e9e' : 'refus\u00e9e';
  await notify(
    quote.entreprise._id.toString(),
    'quote',
    'R\u00e9ponse \u00e0 votre demande de devis',
    `Votre demande de devis a \u00e9t\u00e9 ${statusLabel}.`,
    { quoteId: quote._id.toString() }
  );
  await sendMail({
    to: quote.entreprise.email,
    subject: 'ComptaLink - R\u00e9ponse \u00e0 votre demande de devis',
    html: `<p>Votre demande de devis a \u00e9t\u00e9 ${statusLabel}. Consultez votre espace pour plus de d\u00e9tails.</p>`,
  });

  res.json({ success: true, data: quote });
});

export const cancelQuote = asyncHandler(async (req, res) => {
  const quote = await QuoteRequest.findById(req.params.id);
  if (!quote) throw new AppError(404, 'Demande introuvable');
  if (quote.entreprise.toString() !== req.user.id) throw new AppError(403, 'Acc\u00e8s refus\u00e9');
  if (quote.status !== 'pending') throw new AppError(400, 'Cette demande ne peut plus \u00eatre annul\u00e9e');

  quote.status = 'cancelled';
  await quote.save();
  res.json({ success: true, data: quote });
});

export const exportQuotePdf = asyncHandler(async (req, res) => {
  const quote = await QuoteRequest.findById(req.params.id)
    .populate('entreprise', 'fullName')
    .populate('cabinet', 'fullName');
  if (!quote) throw new AppError(404, 'Demande introuvable');

  const isInvolved =
    quote.entreprise._id.toString() === req.user.id ||
    quote.cabinet._id.toString() === req.user.id;
  if (!isInvolved && req.user.role !== 'admin') throw new AppError(403, 'Acc\u00e8s refus\u00e9');

  const cabinetProfile = await CabinetProfile.findOne({ user: quote.cabinet._id });
  const entrepriseName = quote.entreprise.fullName || 'Entreprise';
  const cabinetName =
    cabinetProfile?.firmName ||
    quote.cabinet.fullName ||
    'Cabinet';
  const pdf = await buildQuotePdf(
    quote,
    cabinetName,
    entrepriseName,
    quote.service
  );

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="devis-${quote._id}.pdf"`);
  res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
  res.send(Buffer.from(pdf));
});
