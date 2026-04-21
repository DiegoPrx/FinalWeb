import mongoose from 'mongoose';

/**
 * Esquema del modelo Albarán (DeliveryNote).
 * Registra horas trabajadas o materiales entregados en un proyecto.
 */
const deliveryNoteSchema = new mongoose.Schema(
  {
    // Usuario que crea el albarán
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
    // Proyecto asociado
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    // Tipo de albarán: material u horas
    format: {
      type: String,
      enum: ['material', 'hours'],
      required: [true, 'El formato del albarán es obligatorio'],
    },
    description: {
      type: String,
      trim: true,
    },
    // Fecha del trabajo realizado
    workDate: {
      type: Date,
      required: [true, 'La fecha de trabajo es obligatoria'],
    },

    // --- Campos para formato "material" ---
    material: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
    },
    unit: {
      type: String,
      trim: true,
    },

    // --- Campos para formato "hours" ---
    hours: {
      type: Number,
    },
    workers: [
      {
        name: { type: String, trim: true },
        hours: { type: Number },
      },
    ],

    // --- Firma ---
    signed: {
      type: Boolean,
      default: false,
    },
    signedAt: {
      type: Date,
    },
    signatureUrl: {
      type: String, // URL de la imagen de firma en la nube
    },
    pdfUrl: {
      type: String, // URL del PDF firmado en la nube
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

const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema);

export default DeliveryNote;
