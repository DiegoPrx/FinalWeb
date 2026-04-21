# BildyApp API

API REST para la digitalización de albaranes entre clientes y proveedores.

## Descripción

BildyApp permite gestionar albaranes (partes de horas o materiales), clientes y proyectos. Incluye autenticación JWT, documentación Swagger, notificaciones en tiempo real con WebSockets, generación de PDF, subida de archivos a la nube y testing automatizado.

## Tecnologías

- **Node.js** + **Express** — Servidor HTTP
- **MongoDB** + **Mongoose** — Base de datos
- **JWT** — Autenticación
- **Zod** — Validación de datos
- **Swagger/OpenAPI 3.0** — Documentación interactiva
- **Socket.IO** — WebSockets en tiempo real
- **Jest + Supertest** — Testing
- **Multer + Cloudinary** — Subida de archivos
- **pdfkit** — Generación de PDF
- **Docker** — Contenedores

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/DiegoPrx/FinalWeb.git
cd FinalWeb

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar en desarrollo
npm run dev
```

## Docker

```bash
docker compose up --build
```

## Testing

```bash
# Ejecutar tests
npm test

# Ejecutar tests con cobertura
npm run test:coverage
```

## Documentación

La documentación interactiva Swagger está disponible en:

```
http://localhost:3000/api-docs
```

## Estructura del proyecto

```
src/
├── config/         # Configuración (BD, Swagger, etc.)
├── controllers/    # Controladores (lógica de negocio)
├── middlewares/     # Middleware (auth, errores, validación)
├── models/         # Modelos de Mongoose
├── routes/         # Definición de rutas
├── services/       # Servicios (email, PDF, storage, Slack)
├── utils/          # Utilidades (AppError)
├── validators/     # Esquemas de validación Zod
├── app.js          # Configuración de Express
└── index.js        # Punto de entrada
```
