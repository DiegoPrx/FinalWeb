import { v2 as cloudinary } from 'cloudinary';
import config from '../config/index.js';

/**
 * Configuración de Cloudinary con las credenciales del .env.
 */
cloudinary.config({
  cloud_name: config.cloudinaryCloudName,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinaryApiSecret,
});

/**
 * Sube un archivo (buffer) a Cloudinary.
 * @param {Buffer} fileBuffer - Buffer del archivo a subir
 * @param {string} folder - Carpeta en Cloudinary (ej: 'logos', 'signatures')
 * @param {object} options - Opciones adicionales de Cloudinary
 * @returns {Promise<object>} Resultado de la subida con secure_url y public_id
 */
export const uploadToCloudinary = (fileBuffer, folder = 'bildyapp', options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: 'auto',
      ...options,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Elimina un archivo de Cloudinary por su public_id.
 * @param {string} publicId - ID público del archivo en Cloudinary
 * @returns {Promise<object>} Resultado de la eliminación
 */
export const deleteFromCloudinary = async (publicId) => {
  return cloudinary.uploader.destroy(publicId);
};

export default { uploadToCloudinary, deleteFromCloudinary };
