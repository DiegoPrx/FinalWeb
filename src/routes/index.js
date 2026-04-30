import { Router } from 'express';
import userRoutes from './user.routes.js';
import clientRoutes from './client.routes.js';
import projectRoutes from './project.routes.js';
import deliveryNoteRoutes from './deliverynote.routes.js';

const router = Router();

// Módulo de usuarios
router.use('/user', userRoutes);

// Módulo de clientes
router.use('/client', clientRoutes);

// Módulo de proyectos
router.use('/project', projectRoutes);

// Módulo de albaranes
router.use('/deliverynote', deliveryNoteRoutes);

export default router;
