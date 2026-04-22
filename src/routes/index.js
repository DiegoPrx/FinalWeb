import { Router } from 'express';
import userRoutes from './user.routes.js';

const router = Router();

// Módulo de usuarios
router.use('/user', userRoutes);

export default router;
