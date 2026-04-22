import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

/**
 * Middleware de autenticación JWT.
 * Verifica el token del header Authorization y añade el usuario a req.user.
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Obtener el token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No se proporcionó token de autenticación', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verificar el token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Buscar el usuario en la base de datos
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      throw new AppError('Usuario no encontrado', 401);
    }

    if (user.deleted) {
      throw new AppError('La cuenta ha sido eliminada', 401);
    }

    // Añadir el usuario al request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token inválido', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expirado', 401));
    }
    next(error);
  }
};

export default authMiddleware;
