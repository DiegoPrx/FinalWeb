import mongoose from 'mongoose';

/**
 * Esquema del modelo Proyecto.
 * Un proyecto pertenece a un cliente y a una compañía.
 */
const projectSchema = new mongoose.Schema(
  {
    // Usuario que creó el proyecto
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
    // Cliente asociado
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre del proyecto es obligatorio'],
      trim: true,
    },
    projectCode: {
      type: String,
      required: [true, 'El código del proyecto es obligatorio'],
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      number: { type: String, trim: true },
      postal: { type: String, trim: true },
      city: { type: String, trim: true },
      province: { type: String, trim: true },
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
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

// Índice compuesto: código de proyecto único por compañía
projectSchema.index({ projectCode: 1, company: 1 }, { unique: true });

const Project = mongoose.model('Project', projectSchema);

export default Project;
