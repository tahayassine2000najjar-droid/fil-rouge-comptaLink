import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { EntrepriseProfile } from '../models/EntrepriseProfile.js';
import { CabinetProfile } from '../models/CabinetProfile.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  hashToken,
  randomToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/tokens.js';
import { sendMail } from '../utils/mailer.js';
import { env } from '../config/env.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  fullName: z.string().min(2),
  role: z.enum(['entreprise', 'cabinet']),
  companyName: z.string().optional(),
  firmName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateMeSchema = z.object({
  fullName: z.string().min(2).optional(),
  password: z.string().min(8).optional(),
  profile: z.record(z.string(), z.unknown()).optional(),
});

export const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);

  const existing = await User.findOne({ email: data.email });
  if (existing) throw new AppError(409, 'Un compte existe déjà avec cet email');

  const passwordHash = await bcrypt.hash(data.password, 10);
  const verificationToken = randomToken();

  const user = await User.create({
    email: data.email,
    password: passwordHash,
    fullName: data.fullName,
    role: data.role,
    isEmailVerified: false,
    verificationToken,
    verificationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });

  if (data.role === 'entreprise') {
    const companyName = data.companyName || data.fullName;
    await EntrepriseProfile.create({ user: user._id, companyName });
  } else if (data.role === 'cabinet') {
    const firmName = data.firmName || data.fullName;
    const slug = firmName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 10000);
    await CabinetProfile.create({ user: user._id, firmName, slug });
  }

  const verifyUrl = `${env.appUrl}/verify-email?token=${verificationToken}`;
  await sendMail({
    to: user.email,
    subject: 'ComptaLink - Confirmez votre adresse email',
    html: `<p>Bonjour ${user.fullName},</p>
      <p>Bienvenue sur <strong>ComptaLink</strong> ! Cliquez sur le lien ci-dessous pour confirmer votre adresse email :</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>Ce lien expire dans 24 heures.</p>`,
  });

  res.status(201).json({
    success: true,
    message: 'Compte créé. Un email de vérification vous a été envoyé.',
    user,
  });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const token = String(req.query.token || req.body.token || '');
  if (!token) throw new AppError(400, 'Jeton de vérification manquant');

  const user = await User.findOne({ verificationToken: token });
  if (!user) throw new AppError(400, 'Jeton de vérification invalide');

  if (user.verificationTokenExpires && user.verificationTokenExpires.getTime() < Date.now()) {
    throw new AppError(400, 'Jeton de vérification expiré. Veuillez refaire une demande.');
  }

  user.isEmailVerified = true;
  user.verificationToken = null;
  user.verificationTokenExpires = null;
  await user.save();

  res.json({ success: true, message: 'Email vérifié avec succès.' });
});

export const resendVerification = asyncHandler(async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const user = await User.findOne({ email });
  if (!user) throw new AppError(404, 'Aucun compte avec cet email');

  if (user.isEmailVerified) {
    return res.json({ success: true, message: 'Cet email est déjà vérifié.' });
  }

  const token = randomToken();
  user.verificationToken = token;
  user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  await sendMail({
    to: user.email,
    subject: 'ComptaLink - Confirmez votre adresse email',
    html: `<p>Bonjour, cliquez sur ce lien pour vérifier votre email : <a href="${env.appUrl}/verify-email?token=${token}">${env.appUrl}/verify-email?token=${token}</a></p>`,
  });

  res.json({ success: true, message: 'Email de vérification renvoyé.' });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email });
  if (!user) throw new AppError(401, 'Email ou mot de passe incorrect');

  if (!user.isActive) throw new AppError(403, 'Ce compte a été désactivé');

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new AppError(401, 'Email ou mot de passe incorrect');

  const accessToken = signAccessToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);
  user.refreshTokenHashes.push(hashToken(refreshToken));
  await user.save();

  res.json({
    success: true,
    user,
    accessToken,
    refreshToken,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = z.object({ refreshToken: z.string().min(1) }).parse(req.body);

  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw new AppError(401, 'Session invalide');

  const hash = hashToken(refreshToken);
  if (!user.refreshTokenHashes.includes(hash)) {
    throw new AppError(401, 'Session invalide ou révoquée');
  }

  const newAccess = signAccessToken(user.id, user.role);
  const newRefresh = signRefreshToken(user.id);
  user.refreshTokenHashes = user.refreshTokenHashes.filter((h) => h !== hash);
  user.refreshTokenHashes.push(hashToken(newRefresh));
  await user.save();

  res.json({ success: true, accessToken: newAccess, refreshToken: newRefresh });
});

export const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = z.object({ refreshToken: z.string().min(1) }).parse(req.body);
  try {
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);
    if (user) {
      const hash = hashToken(refreshToken);
      user.refreshTokenHashes = user.refreshTokenHashes.filter((h) => h !== hash);
      await user.save();
    }
  } catch {

  }
  res.json({ success: true, message: 'Déconnexion réussie' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body);
  const user = await User.findOne({ email });
  if (!user) {
    return res.json({ success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
  }

  const token = randomToken();
  user.resetPasswordToken = token;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  await sendMail({
    to: user.email,
    subject: 'ComptaLink - Réinitialisation du mot de passe',
    html: `<p>Bonjour ${user.fullName},</p>
      <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
      <p><a href="${env.appUrl}/reset-password?token=${token}">${env.appUrl}/reset-password?token=${token}</a></p>
      <p>Ce lien expire dans 1 heure.</p>`,
  });

  res.json({ success: true, message: 'Si cet email existe, un lien de réinitialisation a été envoyé.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = z
    .object({ token: z.string().min(1), password: z.string().min(8) })
    .parse(req.body);

  const user = await User.findOne({ resetPasswordToken: token });
  if (!user || !user.resetPasswordExpires || user.resetPasswordExpires.getTime() < Date.now()) {
    throw new AppError(400, 'Jeton de réinitialisation invalide ou expiré');
  }

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.refreshTokenHashes = [];
  await user.save();

  res.json({ success: true, message: 'Mot de passe réinitialisé avec succès.' });
});

export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError(404, 'Utilisateur introuvable');

  let profile;
  if (user.role === 'entreprise') {
    profile = await EntrepriseProfile.findOne({ user: user._id });
  } else if (user.role === 'cabinet') {
    profile = await CabinetProfile.findOne({ user: user._id });
  }

  res.json({
    success: true,
    user,
    profile: profile ? profile.toJSON() : null,
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  const data = updateMeSchema.parse(req.body);
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError(404, 'Utilisateur introuvable');

  if (data.fullName) user.fullName = data.fullName;
  if (data.password) user.password = await bcrypt.hash(data.password, 10);
  await user.save();

  let profile;
  if (user.role === 'entreprise') {
    profile = await EntrepriseProfile.findOneAndUpdate(
      { user: user._id },
      { $set: data.profile || {} },
      { new: true, runValidators: true }
    );
  } else if (user.role === 'cabinet') {
    profile = await CabinetProfile.findOneAndUpdate(
      { user: user._id },
      { $set: data.profile || {} },
      { new: true, runValidators: true }
    );
  }

  res.json({ success: true, user, profile });
});
