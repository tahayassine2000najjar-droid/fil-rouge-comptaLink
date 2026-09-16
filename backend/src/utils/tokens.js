import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(userId, role) {
  return jwt.sign({ role }, env.jwtAccessSecret, {
    subject: userId,
    expiresIn: env.accessTokenTtl,
  });
}

export function signRefreshToken(userId) {
  return jwt.sign({}, env.jwtRefreshSecret, {
    subject: userId,
    expiresIn: env.refreshTokenTtl,
  });
}

export function verifyAccessToken(token) {
  const decoded = jwt.verify(token, env.jwtAccessSecret);
  return { sub: decoded.sub, role: decoded.role };
}

export function verifyRefreshToken(token) {
  const decoded = jwt.verify(token, env.jwtRefreshSecret);
  return { sub: decoded.sub };
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}
