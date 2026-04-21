/**
 * Configuración centralizada de la aplicación.
 * Lee las variables de entorno y las exporta en un objeto.
 */
const config = {
  // Servidor
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',

  // Base de datos
  dbUri: process.env.DB_URI,

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'secreto_por_defecto',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // Email (Nodemailer)
  emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
  emailPort: process.env.EMAIL_PORT || 587,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  emailFrom: process.env.EMAIL_FROM || 'noreply@bildyapp.com',

  // Cloudinary
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

  // Slack Webhook
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
};

export default config;
