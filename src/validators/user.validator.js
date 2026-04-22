import { z } from 'zod';

/**
 * Esquema de validación para el registro de usuario.
 */
export const registerSchema = z.object({
  email: z
    .string({ required_error: 'El email es obligatorio' })
    .email('El email no es válido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

/**
 * Esquema de validación para el login.
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El email es obligatorio' })
    .email('El email no es válido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' }),
});

/**
 * Esquema de validación del código de verificación de email.
 */
export const validationSchema = z.object({
  code: z
    .string({ required_error: 'El código de verificación es obligatorio' })
    .length(6, 'El código debe tener 6 caracteres'),
});

/**
 * Esquema de validación para actualizar datos personales del usuario.
 */
export const updateUserSchema = z.object({
  name: z.string().min(1, 'El nombre no puede estar vacío').optional(),
  surnames: z.string().optional(),
  nif: z.string().optional(),
  phone: z.string().optional(),
});

/**
 * Esquema de validación para crear/actualizar la compañía.
 */
export const companySchema = z.object({
  name: z
    .string({ required_error: 'El nombre de la compañía es obligatorio' })
    .min(1, 'El nombre no puede estar vacío'),
  cif: z
    .string({ required_error: 'El CIF es obligatorio' })
    .min(1, 'El CIF no puede estar vacío'),
  street: z.string().optional(),
  number: z.string().optional(),
  postal: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('El email no es válido').optional(),
});
