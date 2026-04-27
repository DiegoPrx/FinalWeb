import { z } from 'zod';

/**
 * Esquema de validación de dirección (reutilizable).
 */
const addressSchema = z.object({
  street: z.string().optional(),
  number: z.string().optional(),
  postal: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
}).optional();

/**
 * Esquema de validación para crear un proyecto.
 */
export const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'El nombre del proyecto es obligatorio' })
    .min(1, 'El nombre no puede estar vacío'),
  projectCode: z
    .string({ required_error: 'El código del proyecto es obligatorio' })
    .min(1, 'El código no puede estar vacío'),
  client: z
    .string({ required_error: 'El cliente es obligatorio' })
    .min(1, 'Debes especificar un cliente'),
  email: z.string().email('El email no es válido').optional(),
  notes: z.string().optional(),
  address: addressSchema,
});

/**
 * Esquema de validación para actualizar un proyecto.
 */
export const updateProjectSchema = z.object({
  name: z.string().min(1, 'El nombre no puede estar vacío').optional(),
  projectCode: z.string().min(1, 'El código no puede estar vacío').optional(),
  client: z.string().min(1, 'Debes especificar un cliente').optional(),
  email: z.string().email('El email no es válido').optional(),
  notes: z.string().optional(),
  active: z.boolean().optional(),
  address: addressSchema,
});
