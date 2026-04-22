import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js';
import config from '../config/index.js';
import AppError from '../utils/AppError.js';
import { sendVerificationEmail } from '../services/mail.service.js';
import { uploadToCloudinary } from '../services/storage.service.js';

/**
 * Genera un token JWT para el usuario.
 * @param {string} id - ID del usuario
 * @returns {string} Token JWT firmado
 */
const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Genera un código de verificación aleatorio de 6 dígitos.
 * @returns {string} Código numérico de 6 dígitos
 */
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * POST /api/user/register
 * Registra un nuevo usuario y envía código de verificación por email.
 */
export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Comprobar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Ya existe un usuario con ese email', 409);
    }

    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generar código de verificación
    const verificationCode = generateVerificationCode();

    // Crear el usuario
    const user = await User.create({
      email,
      password: hashedPassword,
      verificationCode,
    });

    // Enviar email de verificación
    try {
      await sendVerificationEmail(email, verificationCode);
    } catch (emailError) {
      console.error('Error al enviar email de verificación:', emailError.message);
    }

    // Generar token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Usuario registrado correctamente. Revisa tu email para verificar la cuenta.',
      token,
      user: {
        id: user._id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/user/validation
 * Valida el email del usuario con el código de verificación.
 */
export const validateEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = req.user;

    if (user.emailVerified) {
      throw new AppError('El email ya está verificado', 400);
    }

    if (user.verificationCode !== code) {
      throw new AppError('Código de verificación incorrecto', 400);
    }

    // Marcar como verificado
    user.emailVerified = true;
    user.verificationCode = undefined;
    await user.save();

    res.json({
      message: 'Email verificado correctamente',
      user: {
        id: user._id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/user/login
 * Inicia sesión y devuelve un token JWT.
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email (incluir password para comparar)
    const user = await User.findOne({ email, deleted: false });
    if (!user) {
      throw new AppError('Credenciales incorrectas', 401);
    }

    // Comparar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AppError('Credenciales incorrectas', 401);
    }

    // Generar token
    const token = generateToken(user._id);

    res.json({
      message: 'Login correcto',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
        role: user.role,
        company: user.company,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/user/register
 * Actualiza los datos personales del usuario autenticado.
 */
export const updateUser = async (req, res, next) => {
  try {
    const { name, surnames, nif, phone } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, surnames, nif, phone },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Datos actualizados correctamente',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/user/company
 * Crea o actualiza la compañía del usuario.
 */
export const updateCompany = async (req, res, next) => {
  try {
    const { name, cif, street, number, postal, city, province, phone, email } = req.body;
    const userId = req.user._id;

    let company;

    if (req.user.company) {
      // Actualizar compañía existente
      company = await Company.findByIdAndUpdate(
        req.user.company,
        { name, cif, street, number, postal, city, province, phone, email },
        { new: true, runValidators: true }
      );
    } else {
      // Crear nueva compañía
      company = await Company.create({
        owner: userId,
        name,
        cif,
        street,
        number,
        postal,
        city,
        province,
        phone,
        email,
      });

      // Asociar la compañía al usuario
      await User.findByIdAndUpdate(userId, { company: company._id });
    }

    res.json({
      message: 'Compañía actualizada correctamente',
      company,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/user/logo
 * Sube el logo de la compañía a Cloudinary.
 */
export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError('No se proporcionó ningún archivo', 400);
    }

    if (!req.user.company) {
      throw new AppError('Primero debes crear una compañía', 400);
    }

    // Subir a Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'bildyapp/logos', {
      transformation: [{ width: 400, height: 400, crop: 'limit' }],
    });

    // Actualizar el logo de la compañía
    const company = await Company.findByIdAndUpdate(
      req.user.company,
      { logo: result.secure_url },
      { new: true }
    );

    res.json({
      message: 'Logo subido correctamente',
      logo: result.secure_url,
      company,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/user
 * Obtiene los datos del usuario autenticado.
 */
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('company');

    res.json({
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/user
 * Elimina el usuario (soft o hard según query param).
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { soft } = req.query;

    if (soft === 'true' || soft === undefined) {
      // Soft delete
      await User.findByIdAndUpdate(req.user._id, { deleted: true });
      res.json({ message: 'Usuario desactivado correctamente' });
    } else {
      // Hard delete
      await User.findByIdAndDelete(req.user._id);
      // También eliminar la compañía si existe
      if (req.user.company) {
        await Company.findByIdAndDelete(req.user.company);
      }
      res.json({ message: 'Usuario eliminado permanentemente' });
    }
  } catch (error) {
    next(error);
  }
};
