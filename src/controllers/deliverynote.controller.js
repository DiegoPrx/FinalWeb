import sharp from 'sharp';
import DeliveryNote from '../models/DeliveryNote.js';
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';
import { uploadToCloudinary } from '../services/storage.service.js';
import { generateDeliveryNotePdf } from '../services/pdf.service.js';

/**
 * POST /api/deliverynote
 * Crea un nuevo albarán asociado a un proyecto de la compañía.
 */
export const createDeliveryNote = async (req, res, next) => {
  try {
    const {
      project,
      client,
      format,
      description,
      workDate,
      material,
      quantity,
      unit,
      hours,
      workers,
    } = req.body;
    const userId = req.user._id;
    const companyId = req.user.company;

    if (!companyId) {
      throw new AppError('Debes crear una compañía antes de crear albaranes', 400);
    }

    // Verificar que el proyecto existe y pertenece a la misma compañía
    const existingProject = await Project.findOne({
      _id: project,
      company: companyId,
      deleted: false,
    });
    if (!existingProject) {
      throw new AppError('El proyecto no existe o no pertenece a tu compañía', 404);
    }

    // Verificar que el cliente existe y pertenece a la misma compañía
    const existingClient = await Client.findOne({
      _id: client,
      company: companyId,
      deleted: false,
    });
    if (!existingClient) {
      throw new AppError('El cliente no existe o no pertenece a tu compañía', 404);
    }

    const deliveryNote = await DeliveryNote.create({
      user: userId,
      company: companyId,
      client,
      project,
      format,
      description,
      workDate: new Date(workDate),
      material,
      quantity,
      unit,
      hours,
      workers,
    });

    res.status(201).json({
      message: 'Albarán creado correctamente',
      deliveryNote,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/deliverynote
 * Lista todos los albaranes de la compañía con paginación y filtros.
 */
export const getDeliveryNotes = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const {
      page = 1,
      limit = 10,
      project,
      client,
      format,
      signed,
      from,
      to,
      sort = '-workDate',
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Construir filtro
    const filter = { company: companyId, deleted: false };

    if (project) {
      filter.project = project;
    }
    if (client) {
      filter.client = client;
    }
    if (format) {
      filter.format = format;
    }
    if (signed !== undefined) {
      filter.signed = signed === 'true';
    }

    // Filtro de rango de fechas
    if (from || to) {
      filter.workDate = {};
      if (from) filter.workDate.$gte = new Date(from);
      if (to) filter.workDate.$lte = new Date(to);
    }

    // Contar total de documentos
    const totalItems = await DeliveryNote.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Obtener albaranes con paginación y populate
    const deliveryNotes = await DeliveryNote.find(filter)
      .populate('client', 'name cif')
      .populate('project', 'name projectCode')
      .populate('user', 'name email')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      deliveryNotes,
      pagination: {
        totalItems,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/deliverynote/:id
 * Obtiene un albarán concreto con populate de usuario, cliente y proyecto.
 */
export const getDeliveryNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company;

    const deliveryNote = await DeliveryNote.findOne({
      _id: id,
      company: companyId,
      deleted: false,
    })
      .populate('user', 'name surnames email')
      .populate('client', 'name cif email phone address')
      .populate('project', 'name projectCode address email');

    if (!deliveryNote) {
      throw new AppError('Albarán no encontrado', 404);
    }

    res.json({ deliveryNote });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/deliverynote/pdf/:id
 * Genera y descarga el albarán en formato PDF.
 * Si está firmado y el PDF ya está en la nube, lo descarga desde allí.
 */
export const getDeliveryNotePdf = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company;

    const deliveryNote = await DeliveryNote.findOne({
      _id: id,
      company: companyId,
      deleted: false,
    })
      .populate('user', 'name surnames email')
      .populate('client', 'name cif email phone address')
      .populate('project', 'name projectCode address');

    if (!deliveryNote) {
      throw new AppError('Albarán no encontrado', 404);
    }

    // Si el albarán está firmado y ya tiene PDF en la nube, redirigir
    if (deliveryNote.signed && deliveryNote.pdfUrl) {
      return res.redirect(deliveryNote.pdfUrl);
    }

    // Generar PDF
    const pdfBuffer = await generateDeliveryNotePdf(deliveryNote);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="albaran-${deliveryNote._id}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/deliverynote/:id/sign
 * Firma un albarán: recibe la imagen de firma, la sube a Cloudinary,
 * genera el PDF y lo sube también a la nube.
 */
export const signDeliveryNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company;

    const deliveryNote = await DeliveryNote.findOne({
      _id: id,
      company: companyId,
      deleted: false,
    });

    if (!deliveryNote) {
      throw new AppError('Albarán no encontrado', 404);
    }

    // 409 Conflict: la peticion es correcta pero el estado del recurso impide ejecutarla
    if (deliveryNote.signed) {
      throw new AppError('Este albarán ya está firmado', 409);
    }

    if (!req.file) {
      throw new AppError('Debes adjuntar la imagen de la firma', 400);
    }

    // Optimizar la imagen de la firma con Sharp antes de subir
    const optimizedBuffer = await sharp(req.file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Subir la firma optimizada a Cloudinary
    const signatureResult = await uploadToCloudinary(optimizedBuffer, 'bildyapp/signatures', {
      public_id: `signature-${deliveryNote._id}`,
      format: 'webp',
    });

    // Actualizar el albarán con la firma
    deliveryNote.signed = true;
    deliveryNote.signedAt = new Date();
    deliveryNote.signatureUrl = signatureResult.secure_url;

    // Generar el PDF del albarán firmado con populate
    const populatedNote = await DeliveryNote.findById(deliveryNote._id)
      .populate('user', 'name surnames email')
      .populate('client', 'name cif email phone address')
      .populate('project', 'name projectCode address');

    // Copiar los campos de firma al objeto populated para el PDF
    populatedNote.signed = true;
    populatedNote.signedAt = deliveryNote.signedAt;
    populatedNote.signatureUrl = deliveryNote.signatureUrl;

    const pdfBuffer = await generateDeliveryNotePdf(populatedNote);

    // Subir el PDF a Cloudinary
    const pdfResult = await uploadToCloudinary(pdfBuffer, 'bildyapp/pdfs', {
      public_id: `albaran-${deliveryNote._id}`,
      resource_type: 'raw',
    });

    deliveryNote.pdfUrl = pdfResult.secure_url;
    await deliveryNote.save();

    res.json({
      message: 'Albarán firmado correctamente',
      deliveryNote,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/deliverynote/:id
 * Elimina un albarán. Solo se puede borrar si no está firmado.
 */
export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company;

    const deliveryNote = await DeliveryNote.findOne({
      _id: id,
      company: companyId,
      deleted: false,
    });

    if (!deliveryNote) {
      throw new AppError('Albarán no encontrado', 404);
    }

    // 409 Conflict: borrar un albaran firmado es un conflicto de estado, no un error de formato
    if (deliveryNote.signed) {
      throw new AppError('No se puede eliminar un albarán firmado', 409);
    }

    // Soft delete: marcar como eliminado en vez de borrar fisicamente
    // Esto mantiene la integridad referencial con los PDFs y permite auditoria
    await DeliveryNote.findByIdAndUpdate(id, { deleted: true });

    res.json({ message: 'Albarán eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};
