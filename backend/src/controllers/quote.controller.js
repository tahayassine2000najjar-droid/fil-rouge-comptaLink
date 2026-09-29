import { z } from 'zod';
import { QuoteRequest } from '../models/QuoteRequest.js';
import { CabinetProfile } from '../models/CabinetProfile.js';
import { EntrepriseProfile } from '../models/EntrepriseProfile.js';
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

const updateSchema = z
  .object({
    service: z.string().min(2, 'Veuillez préciser le service souhaité (minimum 2 caractères)'),
    budget: z.string().optional(),
    timeline: z.string().optional(),
    description: z
      .string()
      .min(10, 'La description doit contenir au moins 10 caractères pour que le cabinet puisse comprendre votre besoin.'),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Aucune donnée à mettre à jour.',
  });

const respondSchema = z.object({
  status: z.enum(['accepted', 'declined']),
  price: z.coerce.number().min(0).optional(),
  duration: z.string().optional(),
  message: z.string().optional(),
});

const messageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Le message ne peut pas être vide.')
    .max(2000, 'Le message ne peut pas dépasser 2000 caractères.'),
});

const populateThread = {
  path: 'messages',
  populate: { path: 'author', select: 'fullName email' },
};

const findInvolvedQuote = async (id, userId) => {
  const quote = await QuoteRequest.findById(id)
    .populate('entreprise', 'fullName email')
    .populate('cabinet', 'fullName email')
    .populate(populateThread);
  if (!quote) throw new AppError(404, 'Demande introuvable');

  const side =
    quote.entreprise._id.toString() === userId ? 'entreprise'
      : quote.cabinet._id.toString() === userId ? 'cabinet'
        : null;
  if (!side) throw new AppError(403, 'Accès refusé');

  return { quote, side };
};

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
    .populate('cabinet', 'fullName email')
    .populate(populateThread);

  const cabinetIds = [...new Set(items.map((i) => i.cabinet?._id?.toString()).filter(Boolean))];
  const entrepriseIds = [...new Set(items.map((i) => i.entreprise?._id?.toString()).filter(Boolean))];
  const [cabinetProfiles, entrepriseProfiles] = await Promise.all([
    CabinetProfile.find({ user: { $in: cabinetIds } }).select('user firmName logo city status'),
    EntrepriseProfile.find({ user: { $in: entrepriseIds } }).select('user companyName logo city'),
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
    .populate('cabinet', 'fullName email')
    .populate(populateThread);

  if (!quote) throw new AppError(404, 'Demande introuvable');

  const isInvolved =
    quote.entreprise._id.toString() === req.user.id ||
    quote.cabinet._id.toString() === req.user.id;
  if (!isInvolved && req.user.role !== 'admin') {
    throw new AppError(403, 'Accès refusé');
  }

  const [cabinetProfile, entrepriseProfile] = await Promise.all([
    CabinetProfile.findOne({ user: quote.cabinet._id }).select('firmName logo city website phone emailContact'),
    EntrepriseProfile.findOne({ user: quote.entreprise._id }).select('companyName logo city website phone'),
  ]);

  res.json({
    success: true,
    data: { ...quote.toJSON(), cabinetProfile, entrepriseProfile },
  });
});

export const updateQuote = asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body);
  const quote = await QuoteRequest.findById(req.params.id);
  if (!quote) throw new AppError(404, 'Demande introuvable');
  if (quote.entreprise.toString() !== req.user.id) {
    throw new AppError(403, 'Seule l\'entreprise concernée peut modifier la demande');
  }
  if (quote.status !== 'pending') {
    throw new AppError(400, 'Cette demande ne peut plus être modifiée car elle a déjà été traitée');
  }

  Object.assign(quote, data);
  await quote.save();

  await notify(
    quote.cabinet.toString(),
    'quote',
    'Demande de devis modifiée',
    `La demande « ${quote.service} » a été mise à jour.`,
    { quoteId: quote._id.toString() }
  );

  res.json({ success: true, data: quote });
});

export const deleteQuote = asyncHandler(async (req, res) => {
  const quote = await QuoteRequest.findById(req.params.id);
  if (!quote) throw new AppError(404, 'Demande introuvable');
  if (quote.entreprise.toString() !== req.user.id) {
    throw new AppError(403, 'Seule l\'entreprise concernée peut supprimer la demande');
  }

  await QuoteRequest.deleteOne({ _id: quote._id });
  res.json({ success: true, message: 'Demande de devis supprimée.' });
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

  if (data.status === 'accepted' && data.message?.trim()) {
    quote.messages.push({
      author: req.user.id,
      authorRole: 'cabinet',
      body: data.message.trim(),
    });
  }

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

export const addMessage = asyncHandler(async (req, res) => {
  const data = messageSchema.parse(req.body);
  const { quote, side } = await findInvolvedQuote(req.params.id, req.user.id);

  if (quote.status !== 'accepted' && quote.status !== 'completed') {
    throw new AppError(400, 'La conversation est ouverte uniquement après acceptation de la demande');
  }

  quote.messages.push({
    author: req.user.id,
    authorRole: side,
    body: data.body,
  });
  await quote.save();

  const recipient = side === 'cabinet' ? quote.entreprise._id.toString() : quote.cabinet._id.toString();
  const authorName = side === 'cabinet' ? quote.cabinet.fullName : quote.entreprise.fullName;
  await notify(
    recipient,
    'quote',
    'Nouveau message',
    `${authorName} a envoyé un message concernant la demande « ${quote.service} ».`,
    { quoteId: quote._id.toString() }
  );

  res.status(201).json({ success: true, data: quote.messages });
});

export const acceptTerms = asyncHandler(async (req, res) => {
  const { quote, side } = await findInvolvedQuote(req.params.id, req.user.id);

  if (quote.status !== 'accepted') {
    throw new AppError(400, 'Les conditions ne peuvent être acceptées que sur une demande acceptée');
  }
  if (quote.terms[side].accepted) {
    throw new AppError(400, 'Vous avez déjà accepté les conditions de cette demande');
  }

  quote.terms[side] = { accepted: true, acceptedAt: new Date() };

  const bothAccepted = quote.terms.entreprise.accepted && quote.terms.cabinet.accepted;
  if (bothAccepted) {
    quote.terms.bothAcceptedAt = new Date();
    quote.status = 'completed';
  }

  await quote.save();

  const recipient = side === 'cabinet' ? quote.entreprise._id.toString() : quote.cabinet._id.toString();
  const authorName = side === 'cabinet' ? quote.cabinet.fullName : quote.entreprise.fullName;
  await notify(
    recipient,
    'quote',
    bothAccepted ? 'Conditions acceptées par les deux parties' : 'Conditions acceptées',
    bothAccepted
      ? `Les deux parties ont accepté les conditions de la demande « ${quote.service} ».`
      : `${authorName} a accepté les conditions de la demande « ${quote.service} ».`,
    { quoteId: quote._id.toString() }
  );

  res.json({ success: true, data: quote });
});
