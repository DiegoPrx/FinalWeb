import mongoose from 'mongoose';

/**
 * Esquema del modelo Usuario.
 * Contiene los datos personales, credenciales y referencia a su compañía.
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    },
    name: {
      type: String,
      trim: true,
    },
    surnames: {
      type: String,
      trim: true,
    },
    nif: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    // Código de verificación de email
    verificationCode: {
      type: String,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    // Rol del usuario
    role: {
      type: String,
      enum: ['user', 'admin', 'guest'],
      default: 'user',
    },
    // Referencia a la compañía
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
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

const User = mongoose.model('User', userSchema);

export default User;
