import multer from 'multer';
import AppError from '../utils/AppError.js';

/**
 * Configuración de Multer para la subida de archivos.
 * Almacena en memoria para luego subir a Cloudinary.
 */
const storage = multer.memoryStorage();

/**
 * Filtro de archivos: solo permite imágenes y PDF.
 */
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WebP, GIF) y PDF', 400), false);
  }
};

/**
 * Instancia de Multer con límite de 10MB.
 */
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

export default upload;
