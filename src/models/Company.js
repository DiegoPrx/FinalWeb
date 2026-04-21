import mongoose from 'mongoose';

/**
 * Esquema del modelo Compañía.
 * Almacena los datos fiscales y de contacto de la empresa.
 */
const companySchema = new mongoose.Schema(
  {
    // Usuario propietario de la compañía
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre de la compañía es obligatorio'],
      trim: true,
    },
    cif: {
      type: String,
      required: [true, 'El CIF es obligatorio'],
      trim: true,
    },
    street: {
      type: String,
      trim: true,
    },
    number: {
      type: String,
      trim: true,
    },
    postal: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    province: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    logo: {
      type: String, // URL del logo en la nube
    },
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

const Company = mongoose.model('Company', companySchema);

export default Company;
