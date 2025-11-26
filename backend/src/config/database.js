const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Vérifier que MONGO_URI est défini
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI n\'est pas défini dans le fichier .env');
    }

    console.log('🔄 Connexion à MongoDB...');
    console.log(`📍 URI: ${process.env.MONGO_URI.replace(/\/\/.*@/, '//<credentials>@')}`);

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Options de connexion
      serverSelectionTimeoutMS: 5000, // Timeout après 5 secondes
    });

    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
    console.log(`📊 Base de données: ${conn.connection.name}`);

    // Événements de connexion
    mongoose.connection.on('error', (err) => {
      console.error('❌ Erreur MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB déconnecté');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnecté');
    });

  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error.message);
    console.error('\n💡 Solutions possibles:');
    console.error('   1. Vérifiez que MongoDB est installé et en cours d\'exécution');
    console.error('   2. Vérifiez que MONGO_URI est défini dans le fichier .env');
    console.error('   3. Pour MongoDB local: MONGO_URI=mongodb://localhost:27017/flight_management_db');
    console.error('   4. Testez avec: mongosh (dans un terminal)\n');
    process.exit(1);
  }
};

module.exports = connectDB;