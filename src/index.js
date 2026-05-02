import { createServer } from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import app from './app.js';
import dbConnect from './config/db.js';
import config from './config/index.js';

/**
 * Punto de entrada principal de la aplicación.
 * Conecta a la base de datos, configura Socket.IO y arranca el servidor HTTP.
 */
const startServer = async () => {
  try {
    await dbConnect();

    // Crear servidor HTTP y Socket.IO
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Middleware de autenticación JWT para Socket.IO
    io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Se requiere autenticación'));
      }

      try {
        const decoded = jwt.verify(token, config.jwtSecret);
        socket.userId = decoded.id;
        next();
      } catch (error) {
        next(new Error('Token inválido'));
      }
    });

    // Gestión de conexiones WebSocket
    io.on('connection', async (socket) => {
      console.log(`🔌 Socket conectado: ${socket.id} (usuario: ${socket.userId})`);

      // Unir al usuario a la room de su compañía
      // El cliente debe enviar el companyId al conectarse
      socket.on('join:company', (companyId) => {
        if (companyId) {
          socket.join(`company:${companyId}`);
          console.log(`👥 Socket ${socket.id} unido a room company:${companyId}`);
        }
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Socket desconectado: ${socket.id}`);
      });
    });

    // Hacer io accesible desde los controladores a través de app
    app.set('io', io);

    httpServer.listen(config.port, () => {
      console.log(`🚀 Servidor en http://localhost:${config.port}`);
      console.log(`📚 API en http://localhost:${config.port}/api`);
      console.log(`📖 Swagger en http://localhost:${config.port}/api-docs`);
      console.log(`🔌 WebSocket activo`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} recibido. Cerrando servidor...`);

      // Cerrar Socket.IO
      io.close(() => {
        console.log('🔌 Socket.IO cerrado');
      });

      // Cerrar servidor HTTP
      httpServer.close(async () => {
        console.log('🛑 Servidor HTTP cerrado');

        // Cerrar conexión a MongoDB
        const mongoose = (await import('mongoose')).default;
        await mongoose.connection.close();
        console.log('🔌 Conexión a MongoDB cerrada');

        process.exit(0);
      });

      // Forzar cierre tras 10 segundos
      setTimeout(() => {
        console.error('⚠️ Cierre forzado tras timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Error al iniciar:', error);
    process.exit(1);
  }
};

startServer();
