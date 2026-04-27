import { Router } from 'express';
import {
  createProject,
  updateProject,
  getProjects,
  getProject,
  deleteProject,
  getArchivedProjects,
  restoreProject,
} from '../controllers/project.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateBody, validateObjectId } from '../middlewares/validate.middleware.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';

const router = Router();

// Todas las rutas de proyectos requieren autenticación
router.use(authMiddleware);

// Listar proyectos archivados (antes de /:id para evitar conflicto)
router.get('/archived', getArchivedProjects);

// CRUD de proyectos
router.post('/', validateBody(createProjectSchema), createProject);
router.get('/', getProjects);
router.get('/:id', validateObjectId('id'), getProject);
router.put('/:id', validateObjectId('id'), validateBody(updateProjectSchema), updateProject);
router.delete('/:id', validateObjectId('id'), deleteProject);

// Restaurar proyecto archivado
router.patch('/:id/restore', validateObjectId('id'), restoreProject);

export default router;
