const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Charger les variables d'environnement
dotenv.config();

// Importer la connexion à la base de données
const connectDB = require('./config/database');

// Créer l'application Express
const app = express();

// Créer le serveur HTTP
const server = http.createServer(app);

// Configurer Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Routes API (seront ajoutées progressivement)
// app.use('/api/auth', require('./routes/auth.routes'));
// app.use('/api/airports', require('./routes/airports.routes'));
// app.use('/api/airlines', require('./routes/airlines.routes'));
// app.use('/api/flights', require('./routes/flights.routes'));
// app.use('/api/users', require('./routes/users.routes'));

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Socket.io - Gestion des connexions
io.on('connection', (socket) => {
  console.log('✅ Nouveau client connecté:', socket.id);

  // Le client rejoint une room d'aéroport
  socket.on('join:airport', (airportCode) => {
    socket.join(airportCode);
    console.log(`Client ${socket.id} a rejoint la room: ${airportCode}`);
  });

  // Le client quitte une room d'aéroport
  socket.on('leave:airport', (airportCode) => {
    socket.leave(airportCode);
    console.log(`Client ${socket.id} a quitté la room: ${airportCode}`);
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log('❌ Client déconnecté:', socket.id);
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connecter à MongoDB
    await connectDB();
    
    // Démarrer le serveur
    server.listen(PORT, () => {
      console.log('╔═══════════════════════════════════════════════════════╗');
      console.log('║                                                       ║');
      console.log('║   🛫 SYSTÈME DE GESTION DE VOLS - MADAGASCAR 🇲🇬     ║');
      console.log('║                                                       ║');
      console.log('╠═══════════════════════════════════════════════════════╣');
      console.log(`║   ⚙️  Environnement: ${process.env.NODE_ENV?.padEnd(32)} ║`);
      console.log(`║   🌐 Serveur: http://localhost:${PORT}               ║`);
      console.log(`║   🔌 Socket.io: Activé                               ║`);
      console.log(`║   💾 Base de données: Connectée                      ║`);
      console.log('║                                                       ║');
      console.log('╚═══════════════════════════════════════════════════════╝');
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

startServer();

// Gestion des erreurs non capturées
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Arrêt du serveur...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM reçu. Arrêt gracieux du serveur...');
  server.close(() => {
    console.log('✅ Processus terminé');
  });
});