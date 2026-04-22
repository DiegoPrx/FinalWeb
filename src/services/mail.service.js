import nodemailer from 'nodemailer';
import config from '../config/index.js';

/**
 * Transportador de email configurado con Mailtrap.
 */
const transporter = nodemailer.createTransport({
  host: config.emailHost,
  port: config.emailPort,
  auth: {
    user: config.emailUser,
    pass: config.emailPass,
  },
});

/**
 * Envía un email de verificación con el código al usuario.
 * @param {string} to - Email del destinatario
 * @param {string} code - Código de verificación de 6 dígitos
 */
export const sendVerificationEmail = async (to, code) => {
  const mailOptions = {
    from: config.emailFrom,
    to,
    subject: 'BildyApp — Código de verificación',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Verificación de email</h2>
        <p>Tu código de verificación es:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${code}</span>
        </div>
        <p style="color: #666;">Este código expira en 15 minutos.</p>
        <p style="color: #999; font-size: 12px;">Si no solicitaste este código, ignora este email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

export default { sendVerificationEmail };
