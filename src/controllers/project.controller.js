import Project from '../models/Project.js';
import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';

/**
 * POST /api/project
 * Crea un nuevo proyecto asociado al usuario, su compañía y un cliente existente.
 */
export const createProject = async (req, res, next) => {
  try {
    const { name, projectCode, client, email, notes, address } = req.body;
    const userId = req.user._id;
    const companyId = req.user.company;

    if (!companyId) {
      throw new AppError('Debes crear una compañía antes de añadir proyectos', 400);
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

    // Comprobar que no exista un proyecto con el mismo código en la misma compañía
    const existingProject = await Project.findOne({
      projectCode,
      company: companyId,
      deleted: false,
    });
    if (existingProject) {
      throw new AppError('Ya existe un proyecto con ese código en tu compañía', 409);
    }

    const project = await Project.create({
      user: userId,
      company: companyId,
      client,
      name,
      projectCode,
      email,
      notes,
      address,
    });

    res.status(201).json({
      message: 'Proyecto creado correctamente',
      project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/project/:id
 * Actualiza un proyecto existente de la compañía.
 */
export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company;

    const project = await Project.findOne({ _id: id, company: companyId, deleted: false });
    if (!project) {
      throw new AppError('Proyecto no encontrado', 404);
    }

    // Si se cambia el cliente, verificar que existe en la misma compañía
    if (req.body.client && req.body.client !== project.client.toString()) {
      const existingClient = await Client.findOne({
        _id: req.body.client,
        company: companyId,
        deleted: false,
      });
      if (!existingClient) {
        throw new AppError('El cliente no existe o no pertenece a tu compañía', 404);
      }
    }

    // Si se cambia el código de proyecto, comprobar que no exista duplicado
    if (req.body.projectCode && req.body.projectCode !== project.projectCode) {
      const duplicate = await Project.findOne({
        projectCode: req.body.projectCode,
        company: companyId,
        deleted: false,
      });
      if (duplicate) {
        throw new AppError('Ya existe un proyecto con ese código en tu compañía', 409);
      }
    }

    const updatedProject = await Project.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({
      message: 'Proyecto actualizado correctamente',
      project: updatedProject,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/project
 * Lista todos los proyectos de la compañía con paginación y filtros.
 */
export const getProjects = async (req, res, next) => {
  try {
    const companyId = req.user.company;
    const {
      page = 1,
      limit = 10,
      name,
      client,
      active,
      sort = '-createdAt',
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Construir filtro
    const filter = { company: companyId, deleted: false };

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }
    if (client) {
      filter.client = client;
    }
    if (active !== undefined) {
      filter.active = active === 'true';
    }

    // Contar total de documentos
    const totalItems = await Project.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limitNum);

    // Obtener proyectos con paginación y populate del cliente
    const projects = await Project.find(filter)
      .populate('client', 'name cif')
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      projects,
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
 * GET /api/project/archived
 * Lista los proyectos archivados (soft delete) de la compañía.
 */
export const getArchivedProjects = async (req, res, next) => {
  try {
    const companyId = req.user.company;

    const projects = await Project.find({ company: companyId, deleted: true })
      .populate('client', 'name cif')
      .sort('-updatedAt');

    res.json({ projects });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/project/:id
 * Obtiene un proyecto concreto de la compañía con datos del cliente.
 */
export const getProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company;

    const project = await Project.findOne({ _id: id, company: companyId, deleted: false })
      .populate('client', 'name cif email phone address');

    if (!project) {
      throw new AppError('Proyecto no encontrado', 404);
    }

    res.json({ project });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/project/:id
 * Archiva (soft) o elimina (hard) un proyecto según query param ?soft=true.
 */
export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { soft } = req.query;
    const companyId = req.user.company;

    const project = await Project.findOne({ _id: id, company: companyId });
    if (!project) {
      throw new AppError('Proyecto no encontrado', 404);
    }

    if (soft === 'true' || soft === undefined) {
      // Soft delete (archivar)
      await Project.findByIdAndUpdate(id, { deleted: true });
      res.json({ message: 'Proyecto archivado correctamente' });
    } else {
      // Hard delete
      await Project.findByIdAndDelete(id);
      res.json({ message: 'Proyecto eliminado permanentemente' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/project/:id/restore
 * Restaura un proyecto archivado.
 */
export const restoreProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const companyId = req.user.company;

    const project = await Project.findOne({ _id: id, company: companyId, deleted: true });
    if (!project) {
      throw new AppError('Proyecto archivado no encontrado', 404);
    }

    project.deleted = false;
    await project.save();

    res.json({
      message: 'Proyecto restaurado correctamente',
      project,
    });
  } catch (error) {
    next(error);
  }
};
