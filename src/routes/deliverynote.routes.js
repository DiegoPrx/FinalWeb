import { Router } from 'express';
import {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNote,
  getDeliveryNotePdf,
  signDeliveryNote,
  deleteDeliveryNote,
} from '../controllers/deliverynote.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateBody, validateObjectId } from '../middlewares/validate.middleware.js';
import { createDeliveryNoteSchema } from '../validators/deliverynote.validator.js';
import upload from '../middlewares/upload.js';

const router = Router();

// Todas las rutas de albaranes requieren autenticación
router.use(authMiddleware);

// Descargar PDF de un albarán (antes de /:id para evitar conflicto)
router.get('/pdf/:id', validateObjectId('id'), getDeliveryNotePdf);

// CRUD de albaranes
router.post('/', validateBody(createDeliveryNoteSchema), createDeliveryNote);
router.get('/', getDeliveryNotes);
router.get('/:id', validateObjectId('id'), getDeliveryNote);
router.delete('/:id', validateObjectId('id'), deleteDeliveryNote);

// Firmar albarán (con subida de imagen de firma)
router.patch('/:id/sign', validateObjectId('id'), upload.single('signature'), signDeliveryNote);

export default router;
