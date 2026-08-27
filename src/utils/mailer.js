import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (!env.smtp.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: env.smtp.user
        ? { user: env.smtp.user, pass: env.smtp.pass }
        : undefined,
    });
  }
  return transporter;
}

export async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.log('[mail:dev] ===========================================');
    console.log(`[mail:dev] To: ${to}`);
    console.log(`[mail:dev] Subject: ${subject}`);
    console.log(`[mail:dev] Body:\n${html}`);
    console.log('[mail:dev] ===========================================');
    return;
  }
  await t.sendMail({ from: env.mailFrom, to, subject, html });
}
