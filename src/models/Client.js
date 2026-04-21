import mongoose from 'mongoose';

/**
 * Esquema del modelo Cliente.
 * Representa un cliente asociado a una compañía y creado por un usuario.
 */
const clientSchema = new mongoose.Schema(
  {
    // Usuario que creó el cliente
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Compañía a la que pertenece
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre del cliente es obligatorio'],
      trim: true,
    },
    cif: {
      type: String,
      required: [true, 'El CIF del cliente es obligatorio'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      number: { type: String, trim: true },
      postal: { type: String, trim: true },
      city: { type: String, trim: true },
      province: { type: String, trim: true },
    },
    // Soft delete
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Índice compuesto: CIF único por compañía
clientSchema.index({ cif: 1, company: 1 }, { unique: true });

const Client = mongoose.model('Client', clientSchema);

export default Client;
