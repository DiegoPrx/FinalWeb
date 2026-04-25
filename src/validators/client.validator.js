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
 * Esquema de validación para crear un cliente.
 */
export const createClientSchema = z.object({
  name: z
    .string({ required_error: 'El nombre del cliente es obligatorio' })
    .min(1, 'El nombre no puede estar vacío'),
  cif: z
    .string({ required_error: 'El CIF es obligatorio' })
    .min(1, 'El CIF no puede estar vacío'),
  email: z.string().email('El email no es válido').optional(),
  phone: z.string().optional(),
  address: addressSchema,
});

/**
 * Esquema de validación para actualizar un cliente.
 */
export const updateClientSchema = z.object({
  name: z.string().min(1, 'El nombre no puede estar vacío').optional(),
  cif: z.string().min(1, 'El CIF no puede estar vacío').optional(),
  email: z.string().email('El email no es válido').optional(),
  phone: z.string().optional(),
  address: addressSchema,
});
