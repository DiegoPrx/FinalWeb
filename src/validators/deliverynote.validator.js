import { z } from 'zod';

/**
 * Esquema de validación para un trabajador dentro de un albarán de horas.
 */
const workerSchema = z.object({
  name: z.string().min(1, 'El nombre del trabajador es obligatorio'),
  hours: z.number().positive('Las horas deben ser un número positivo'),
});

/**
 * Esquema de validación para crear un albarán.
 */
export const createDeliveryNoteSchema = z.object({
  project: z
    .string({ required_error: 'El proyecto es obligatorio' })
    .min(1, 'Debes especificar un proyecto'),
  client: z
    .string({ required_error: 'El cliente es obligatorio' })
    .min(1, 'Debes especificar un cliente'),
  format: z.enum(['material', 'hours'], {
    required_error: 'El formato es obligatorio',
    invalid_type_error: 'El formato debe ser "material" o "hours"',
  }),
  description: z.string().optional(),
  workDate: z
    .string({ required_error: 'La fecha de trabajo es obligatoria' })
    .min(1, 'La fecha de trabajo es obligatoria'),

  // Campos para formato "material"
  material: z.string().optional(),
  quantity: z.number().positive('La cantidad debe ser positiva').optional(),
  unit: z.string().optional(),

  // Campos para formato "hours"
  hours: z.number().positive('Las horas deben ser positivas').optional(),
  workers: z.array(workerSchema).optional(),
}).refine(
  (data) => {
    if (data.format === 'material') {
      return data.material && data.quantity;
    }
    return true;
  },
  {
    message: 'Para albaranes de material, debes indicar el material y la cantidad',
    path: ['material'],
  }
).refine(
  (data) => {
    if (data.format === 'hours') {
      return data.hours || (data.workers && data.workers.length > 0);
    }
    return true;
  },
  {
    message: 'Para albaranes de horas, debes indicar las horas o los trabajadores',
    path: ['hours'],
  }
);
