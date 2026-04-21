/**
 * Clase personalizada para errores de la aplicación.
 * Extiende Error nativo con código de estado HTTP y flag operacional.
 */
class AppError extends Error {
  /**
   * @param {string} message - Mensaje descriptivo del error
   * @param {number} statusCode - Código de estado HTTP (por defecto 500)
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
