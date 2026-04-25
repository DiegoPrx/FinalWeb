import { Router } from 'express';
import userRoutes from './user.routes.js';
import clientRoutes from './client.routes.js';

const router = Router();

// Módulo de usuarios
router.use('/user', userRoutes);

// Módulo de clientes
router.use('/client', clientRoutes);

export default router;
