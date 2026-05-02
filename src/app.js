import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';
import mongoose from 'mongoose';

const app = express();

// ============================================
// Middleware de seguridad
// ============================================

// Protección de cabeceras HTTP
app.use(helmet());

// CORS
app.use(cors());

// Limitador de peticiones (100 por ventana de 15 min)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: true,
    message: 'Demasiadas peticiones, inténtalo de nuevo más tarde',
  },
});
app.use('/api', limiter);

// Sanitización contra inyección NoSQL
app.use(mongoSanitize());

// ============================================
// Middleware globales
// ============================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/uploads', express.static('storage'));

// ============================================
// Documentación Swagger
// ============================================

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'BildyApp API - Documentación',
}));

// ============================================
// Rutas
// ============================================

// Health check con estado de MongoDB
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.json({
    status: 'ok',
    db: dbStatus[dbState] || 'unknown',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api', routes);

// ============================================
// Manejo de errores
// ============================================

app.use(notFound);
app.use(errorHandler);

export default app;
