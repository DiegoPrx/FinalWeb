import app from './app.js';
import dbConnect from './config/db.js';
import config from './config/index.js';

/**
 * Punto de entrada principal de la aplicación.
 * Conecta a la base de datos y arranca el servidor HTTP.
 */
const startServer = async () => {
  try {
    await dbConnect();

    app.listen(config.port, () => {
      console.log(`🚀 Servidor en http://localhost:${config.port}`);
      console.log(`📚 API en http://localhost:${config.port}/api`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar:', error);
    process.exit(1);
  }
};

startServer();
