import swaggerJsdoc from 'swagger-jsdoc';
import config from './index.js';

/**
 * Configuración de Swagger/OpenAPI 3.0
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BildyApp API',
      version: '1.0.0',
      description: 'API REST para la digitalización de albaranes entre clientes y proveedores',
      contact: {
        name: 'BildyApp',
        email: 'info@bildyapp.com',
      },
    },
    servers: [
      {
        url: config.publicUrl,
        description: config.nodeEnv === 'production' ? 'Servidor de producción' : 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido en el login o registro',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d0' },
            email: { type: 'string', example: 'usuario@example.com' },
            name: { type: 'string', example: 'Juan' },
            surnames: { type: 'string', example: 'García López' },
            nif: { type: 'string', example: '12345678A' },
            phone: { type: 'string', example: '612345678' },
            emailVerified: { type: 'boolean', example: true },
            role: { type: 'string', enum: ['user', 'admin', 'guest'], example: 'user' },
            company: { type: 'string', example: '6650a1b2c3d4e5f6a7b8c9d1' },
          },
        },
        Company: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            owner: { type: 'string' },
            name: { type: 'string', example: 'Mi Empresa S.L.' },
            cif: { type: 'string', example: 'B12345678' },
            street: { type: 'string', example: 'Calle Mayor' },
            number: { type: 'string', example: '10' },
            postal: { type: 'string', example: '28001' },
            city: { type: 'string', example: 'Madrid' },
            province: { type: 'string', example: 'Madrid' },
            phone: { type: 'string' },
            email: { type: 'string' },
            logo: { type: 'string' },
          },
        },
        Address: {
          type: 'object',
          properties: {
            street: { type: 'string', example: 'Calle Mayor' },
            number: { type: 'string', example: '15' },
            postal: { type: 'string', example: '28001' },
            city: { type: 'string', example: 'Madrid' },
            province: { type: 'string', example: 'Madrid' },
          },
        },
        Client: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            company: { type: 'string' },
            name: { type: 'string', example: 'Construcciones García S.L.' },
            cif: { type: 'string', example: 'B87654321' },
            email: { type: 'string', example: 'garcia@empresa.com' },
            phone: { type: 'string', example: '912345678' },
            address: { $ref: '#/components/schemas/Address' },
            deleted: { type: 'boolean', example: false },
          },
        },
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            company: { type: 'string' },
            client: { type: 'string' },
            name: { type: 'string', example: 'Reforma Oficina Central' },
            projectCode: { type: 'string', example: 'PRJ-001' },
            address: { $ref: '#/components/schemas/Address' },
            email: { type: 'string' },
            notes: { type: 'string' },
            active: { type: 'boolean', example: true },
            deleted: { type: 'boolean', example: false },
          },
        },
        DeliveryNote: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            company: { type: 'string' },
            client: { type: 'string' },
            project: { type: 'string' },
            format: { type: 'string', enum: ['material', 'hours'], example: 'hours' },
            description: { type: 'string', example: 'Jornada de instalación eléctrica' },
            workDate: { type: 'string', format: 'date', example: '2026-04-15' },
            material: { type: 'string', example: 'Cemento Portland' },
            quantity: { type: 'number', example: 50 },
            unit: { type: 'string', example: 'sacos' },
            hours: { type: 'number', example: 8 },
            workers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Juan López' },
                  hours: { type: 'number', example: 6 },
                },
              },
            },
            signed: { type: 'boolean', example: false },
            signedAt: { type: 'string', format: 'date-time' },
            signatureUrl: { type: 'string' },
            pdfUrl: { type: 'string' },
            deleted: { type: 'boolean', example: false },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            totalItems: { type: 'integer', example: 25 },
            totalPages: { type: 'integer', example: 3 },
            currentPage: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Mensaje de error descriptivo' },
          },
        },
        ValidationError: {
          type: 'object',
          properties: {
            error: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Error de validación' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Usuarios', description: 'Gestión de usuarios y autenticación' },
      { name: 'Clientes', description: 'Gestión de clientes de la compañía' },
      { name: 'Proyectos', description: 'Gestión de proyectos asociados a clientes' },
      { name: 'Albaranes', description: 'Gestión de albaranes, firma y generación de PDF' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;
