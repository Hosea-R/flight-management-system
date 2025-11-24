const mongoose = require('mongoose');
const dotenv = require('dotenv');
const logger = require('../src/config/logger');

// Charger les variables d'environnement
dotenv.config();

const connectDB = require('../src/config/database');
const Flight = require('../src/models/Flight');

/**
 * Script de nettoyage automatique des vols anciens
 * Supprime ou archive les vols de plus de 7 jours
 */
const cleanupOldFlights = async () => {
  try {
    logger.info('🧹 Démarrage du nettoyage des vols anciens...');

    // Date limite : 7 jours avant maintenant
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    logger.info(`Suppression des vols antérieurs à ${cutoffDate.toISOString()}`);

    // Option 1: Marquer comme inactif (soft delete - recommandé)
    const result = await Flight.updateMany(
      {
        scheduledDeparture: { $lt: cutoffDate },
        isActive: true
      },
      {
        $set: { 
          isActive: false,
          archivedAt: new Date()
        }
      }
    );

    logger.info(`✅ Nettoyage terminé: ${result.modifiedCount} vols archivés`);
    
    // Option 2: Supprimer définitivement (décommenter si nécessaire)
    // const deleteResult = await Flight.deleteMany({
    //   scheduledDeparture: { $lt: cutoffDate }
    // });
    // logger.info(`✅ Nettoyage terminé: ${deleteResult.deletedCount} vols supprimés`);

    return {
      success: true,
      archivedCount: result.modifiedCount,
      cutoffDate
    };
  } catch (error) {
    logger.error('❌ Erreur lors du nettoyage des vols', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Fonction pour nettoyer les vols très anciens (>30 jours) de manière définitive
 * À exécuter moins fréquemment (hebdomadaire ou mensuel)
 */
const permanentDeleteOldFlights = async () => {
  try {
    logger.info('🗑️ Démarrage de la suppression permanente des vols très anciens...');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const result = await Flight.deleteMany({
      scheduledDeparture: { $lt: cutoffDate },
      isActive: false
    });

    logger.info(`✅ Suppression permanente terminée: ${result.deletedCount} vols supprimés`);

    return {
      success: true,
      deletedCount: result.deletedCount,
      cutoffDate
    };
  } catch (error) {
    logger.error('❌ Erreur lors de la suppression permanente', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Exécution du script si appelé directement
 */
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      logger.info('📊 Base de données connectée');

      // Exécuter le nettoyage
      const result = await cleanupOldFlights();
      
      console.log('\n========================================');
      console.log('✅ Nettoyage terminé avec succès');
      console.log(`📊 Vols archivés: ${result.archivedCount}`);
      console.log(`📅 Date limite: ${result.cutoffDate.toLocaleDateString('fr-FR')}`);
      console.log('========================================\n');

      process.exit(0);
    } catch (error) {
      console.error('❌ Erreur:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  cleanupOldFlights,
  permanentDeleteOldFlights
};
