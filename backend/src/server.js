const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');

// Charger les variables d'environnement
dotenv.config();

// Importer la connexion à la base de données
const connectDB = require('./config/database');
const logger = require('./config/logger');

// Importer les middleware de sécurité
const { helmetConfig, sanitizeData } = require('./middleware/security.middleware');
const { requestLogger, errorLogger } = require('./middleware/logger.middleware');

// Importer le script de nettoyage
const { cleanupOldFlights } = require('../scripts/cleanupOldFlights');
const { startAllJobs: startAdCronJobs } = require('./services/cronJobs');

// Créer l'application Express
const app = express();

// Créer le serveur HTTP
const server = http.createServer(app);

// Configurer Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware de sécurité (doit être en premier)
app.use(helmetConfig);
app.use(sanitizeData);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(requestLogger);

// Rendre io accessible dans les routes
app.set('io', io);

// Routes de test
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Gestion de Vols - Madagascar',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    environment: process.env.NODE_ENV,
    database: 'Connected' // Sera mis à jour après connexion DB
  });
});

// Routes API avec rate limiting
const { publicRateLimiter, authRateLimiter, loginRateLimiter } = require('./middleware/security.middleware');

// Routes publiques avec rate limiting strict
app.use('/api/public', publicRateLimiter, require('./routes/public.routes'));

// Route d'authentification avec rate limiting pour login
app.use('/api/auth', require('./routes/auth.routes'));

// Routes protégées avec rate limiting normal
app.use('/api/airports', authRateLimiter, require('./routes/airports.routes'));
app.use('/api/airlines', authRateLimiter, require('./routes/airlines.routes'));
app.use('/api/flights', authRateLimiter, require('./routes/flights.routes'));
app.use('/api/users', authRateLimiter, require('./routes/users.routes'));
app.use('/api/stats', authRateLimiter, require('./routes/stats.routes'));
app.use('/api/advertisements', authRateLimiter, require('./routes/advertisementRoutes'));
app.use('/api/system-settings', authRateLimiter, require('./routes/systemSettingsRoutes'));

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Middleware de logging des erreurs
app.use(errorLogger);

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  logger.error('Erreur serveur:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Socket.io - Gestion des connexions
io.on('connection', (socket) => {
  logger.info('Nouveau client Socket.io connecté', { socketId: socket.id });

  // Le client rejoint une room d'aéroport
  socket.on('join:airport', (airportCode) => {
    if (airportCode) {
      socket.join(airportCode.toUpperCase());
      logger.info(`Client a rejoint une room d'aéroport`, { 
        socketId: socket.id, 
        airportCode: airportCode.toUpperCase() 
      });
      
      socket.emit('joined:airport', {
        success: true,
        airportCode: airportCode.toUpperCase(),
        message: `Connecté à l'aéroport ${airportCode}`
      });
    }
  });

  // Le client quitte une room d'aéroport
  socket.on('leave:airport', (airportCode) => {
    if (airportCode) {
      socket.leave(airportCode.toUpperCase());
      logger.info(`Client a quitté une room d'aéroport`, { 
        socketId: socket.id, 
        airportCode: airportCode.toUpperCase() 
      });
      
      socket.emit('left:airport', {
        success: true,
        airportCode: airportCode.toUpperCase()
      });
    }
  });

  // Le client rejoint la room globale (pour SuperAdmin)
  socket.on('join:global', () => {
    socket.join('GLOBAL');
    logger.info('Client a rejoint la room GLOBAL', { socketId: socket.id });
    
    socket.emit('joined:global', {
      success: true,
      message: 'Connecté au flux global'
    });
  });

  // Ping pour vérifier la connexion
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });

  // Déconnexion
  socket.on('disconnect', () => {
    logger.info('Client Socket.io déconnecté', { socketId: socket.id });
  });

  // Gestion des erreurs
  socket.on('error', (error) => {
    logger.error('Erreur Socket.io', { socketId: socket.id, error: error.message });
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connecter à MongoDB
    await connectDB();
    logger.info('Base de données MongoDB connectée');
    
    // Démarrer le serveur
    server.listen(PORT, () => {
      logger.info('Serveur démarré avec succès', {
        port: PORT,
        environment: process.env.NODE_ENV,
        nodeVersion: process.version
      });
      
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║                                                       ║');
      console.log('║   🛫 SYSTÈME DE GESTION DE VOLS - MADAGASCAR 🇲🇬     ║');
      console.log(`║   📊 Nettoyage auto: 3h00                            ║`);
      console.log(`║   📢 Publicités CRON: Actifs                         ║`);
      console.log('╚═══════════════════════════════════════════════════════╝');
      console.log('');
      
      // Démarrer les CRON jobs de publicités
      startAdCronJobs();
      console.log(`║   ⚙️  Environnement: ${process.env.NODE_ENV?.padEnd(32)} ║`);
      console.log(`║   🌐 Serveur: http://localhost:${PORT}               ║`);
      console.log(`║   🔌 Socket.io: Activé                               ║`);
      console.log(`║   💾 Base de données: Connectée                      ║`);
      console.log(`║   🔒 Sécurité: Helmet, Rate Limiting activés         ║`);
      console.log(`║   📝 Logging: Winston activé                         ║`);
      console.log('║                                                       ║');
      console.log('╚═══════════════════════════════════════════════════════╝');
    });
  } catch (error) {
    logger.error('Erreur fatale au démarrage du serveur', {
      error: error.message,
      stack: error.stack
    });
    console.error('❌ Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();

// Configuration du CRON job pour le nettoyage automatique des vols
// S'exécute tous les jours à 2h du matin
cron.schedule('0 2 * * *', async () => {
  logger.info('🕐 CRON: Démarrage du nettoyage automatique des vols...');
  try {
    const result = await cleanupOldFlights();
    logger.info('✅ CRON: Nettoyage terminé', {
      archivedCount: result.archivedCount,
      cutoffDate: result.cutoffDate
    });
  } catch (error) {
    logger.error('❌ CRON: Erreur lors du nettoyage', {
      error: error.message
    });
  }
}, {
  timezone: "Indian/Antananarivo" // Timezone de Madagascar
});

logger.info('⏰ CRON job configuré: nettoyage quotidien des vols à 2h00');

// Configuration du CRON job pour la mise à jour automatique des statuts
// S'exécute toutes les 5 minutes
const FlightStatusService = require('./services/flightStatusService');

cron.schedule('*/5 * * * *', async () => {
  logger.info('🔄 CRON: Mise à jour automatique des statuts de vols...');
  try {
    const result = await FlightStatusService.updateFlightStatuses(io);
    logger.info('✅ CRON: Statuts mis à jour', {
      totalFlights: result.totalFlights,
      updatedCount: result.updatedCount,
      errors: result.errors
    });
  } catch (error) {
    logger.error('❌ CRON: Erreur lors de la mise à jour des statuts', {
      error: error.message,
      stack: error.stack
    });
  }
}, {
  timezone: "Indian/Antananarivo"
});

logger.info('⏰ CRON job configuré: mise à jour des statuts toutes les 5 minutes');


// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION - Arrêt du serveur', {
    error: err.message,
    stack: err.stack
  });
  console.error('❌ UNHANDLED REJECTION! Arrêt du serveur...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM reçu - Arrêt gracieux du serveur');
  console.log('👋 SIGTERM reçu. Arrêt gracieux du serveur...');
  server.close(() => {
    logger.info('Serveur arrêté proprement');
    console.log('✅ Processus terminé');
  });
});