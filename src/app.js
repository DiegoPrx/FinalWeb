import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middlewares/error.middleware.js';

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
// Rutas
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
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
