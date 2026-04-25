import { Router } from 'express';
import {
  createClient,
  updateClient,
  getClients,
  getClient,
  deleteClient,
  getArchivedClients,
  restoreClient,
} from '../controllers/client.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateBody, validateObjectId } from '../middlewares/validate.middleware.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';

const router = Router();

// Todas las rutas de clientes requieren autenticación
router.use(authMiddleware);

// Listar clientes archivados (antes de /:id para evitar conflicto)
router.get('/archived', getArchivedClients);

// CRUD de clientes
router.post('/', validateBody(createClientSchema), createClient);
router.get('/', getClients);
router.get('/:id', validateObjectId('id'), getClient);
router.put('/:id', validateObjectId('id'), validateBody(updateClientSchema), updateClient);
router.delete('/:id', validateObjectId('id'), deleteClient);

// Restaurar cliente archivado
router.patch('/:id/restore', validateObjectId('id'), restoreClient);

export default router;
