import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';

/**
 * POST /api/client
 * Crea un nuevo cliente asociado al usuario y su compañía.
 */
export const createClient = async (req, res, next) => {
  try {
    const { name, cif, email, phone, address } = req.body;
    const userId = req.user._id;
    const companyId = req.user.company;

    if (!companyId) {
      throw new AppError('Debes crear una compañía antes de añadir clientes', 400);
    }

    // Comprobar que no exista un cliente con el mismo CIF en la misma compañía
    const existingClient = await Client.findOne({ cif, company: companyId, deleted: false });
    if (existingClient) {
      throw new AppError('Ya existe un cliente con ese CIF en tu compañía', 409);
    }

    const client = await Client.create({
      user: userId,
      company: companyId,
      name,
      cif,
      email,
      phone,
      address,
    });

    res.status(201).json({
      message: 'Cliente creado correctamente',
      client,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/client/:id
 * Actualiza un cliente existente de la compañía.
 */
export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company;

    const client = await Client.findOne({ _id: id, company: companyId, deleted: false });
    if (!client) {
      throw new AppError('Cliente no encontrado', 404);
    }

    // Si se cambia el CIF, comprobar que no exista otro con el mismo
    if (req.body.cif && req.body.cif !== client.cif) {
      const duplicate = await Client.findOne({ cif: req.body.cif, company: companyId, deleted: false });
      if (duplicate) {
        throw new AppError('Ya existe un cliente con ese CIF en tu compañía', 409);
      }
    }

    const updatedClient = await Client.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: 'Cliente actualizado correctamente',
      client: updatedClient,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/client
 * Lista todos los clientes de la compañía con paginación y filtros.
 */
export const getClients = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const { page = 1, limit = 10, name, sort = '-createdAt' } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Construir filtro
    const filter = { company: companyId, deleted: false };
    if (name) {
      filter.name = { $regex: name, $options: 'i' }; // Búsqueda parcial insensible a mayúsculas
    }

    // Contar total de documentos
    const totalItems = await Client.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Obtener clientes con paginación
    const clients = await Client.find(filter)
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      clients,
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
 * GET /api/client/archived
 * Lista los clientes archivados (soft delete) de la compañía.
 */
export const getArchivedClients = async (req, res, next) => {
  try {
    const companyId = req.user.company;

    const clients = await Client.find({ company: companyId, deleted: true })
      .sort('-updatedAt');

    res.json({ clients });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/client/:id
 * Obtiene un cliente concreto de la compañía.
 */
export const getClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company;

    const client = await Client.findOne({ _id: id, company: companyId, deleted: false });
    if (!client) {
      throw new AppError('Cliente no encontrado', 404);
    }

    res.json({ client });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/client/:id
 * Archiva (soft) o elimina (hard) un cliente según query param ?soft=true.
 */
export const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { soft } = req.query;
    const companyId = req.user.company;

    const client = await Client.findOne({ _id: id, company: companyId });
    if (!client) {
      throw new AppError('Cliente no encontrado', 404);
    }

    if (soft === 'true' || soft === undefined) {
      // Soft delete (archivar)
      await Client.findByIdAndUpdate(id, { deleted: true });
      res.json({ message: 'Cliente archivado correctamente' });
    } else {
      // Hard delete
      await Client.findByIdAndDelete(id);
      res.json({ message: 'Cliente eliminado permanentemente' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/client/:id/restore
 * Restaura un cliente archivado.
 */
export const restoreClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company;

    const client = await Client.findOne({ _id: id, company: companyId, deleted: true });
    if (!client) {
      throw new AppError('Cliente archivado no encontrado', 404);
    }

    client.deleted = false;
    await client.save();

    res.json({
      message: 'Cliente restaurado correctamente',
      client,
    });
  } catch (error) {
    next(error);
  }
};
