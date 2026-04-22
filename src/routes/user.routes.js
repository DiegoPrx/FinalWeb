import { Router } from 'express';
import {
  register,
  validateEmail,
  login,
  updateUser,
  updateCompany,
  uploadLogo,
  getUser,
  deleteUser,
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import {
  registerSchema,
  loginSchema,
  validationSchema,
  updateUserSchema,
  companySchema,
} from '../validators/user.validator.js';
import upload from '../middlewares/upload.js';

const router = Router();

// --- Rutas públicas (sin autenticación) ---

// Registro de usuario
router.post('/register', validateBody(registerSchema), register);

// Login de usuario
router.post('/login', validateBody(loginSchema), login);

// --- Rutas protegidas (requieren JWT) ---

// Validación de email
router.put('/validation', authMiddleware, validateBody(validationSchema), validateEmail);

// Actualizar datos personales
router.put('/register', authMiddleware, validateBody(updateUserSchema), updateUser);

// Crear/actualizar compañía
router.patch('/company', authMiddleware, validateBody(companySchema), updateCompany);

// Subir logo de la compañía
router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogo);

// Obtener usuario autenticado
router.get('/', authMiddleware, getUser);

// Eliminar usuario
router.delete('/', authMiddleware, deleteUser);

export default router;
