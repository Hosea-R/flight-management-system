const cron = require('node-cron');
const Advertisement = require('../models/Advertisement');
const emailService = require('./emailService');
const ContractService = require('./contractService');
const logger = require('../config/logger');

/**
 * CRON Jobs pour la gestion automatique des contrats
 */

/**
 * Vérification quotidienne des expirations et quotas (9h00)
 */
const dailyCheck = cron.schedule('0 9 * * *', async () => {
  logger.info('🕐 CRON: Vérification quotidienne des contrats...');
  
  try {
    const advertisements = await Advertisement.find({
      isActive: true,
      'contract.status': 'active'
    });

    let expirationCount = 0;
    let quotaCount = 0;

    for (const ad of advertisements) {
      const alerts = ContractService.needsAlert(ad);

      // Alerte d'expiration
      if (alerts.expiration) {
        const daysRemaining = ad.getDaysRemaining();
        await emailService.sendExpirationAlert(ad, daysRemaining);
        expirationCount++;
        
        // Marquer comme "pending-renewal" si < 15 jours
        if (daysRemaining <= 15) {
          ad.contract.status = 'pending-renewal';
          await ad.save();
        }
      }

      // Alerte de quota
      if (alerts.quota) {
        const percentageUsed = (ad.viewCount / ad.contract.maxViews) * 100;
        await emailService.sendQuotaAlert(ad, percentageUsed);
        quotaCount++;
      }
    }

    logger.info(`✅ CRON: Vérification terminée - ${expirationCount} alertes d'expiration, ${quotaCount} alertes de quota`);
  } catch (error) {
    logger.error('❌ CRON: Erreur lors de la vérification quotidienne:', error);
  }
}, {
  timezone: "Indian/Antananarivo"
});

/**
 * Désactivation automatique des contrats expirés (minuit)
 */ 
const disableExpired = cron.schedule('0 0 * * *', async () => {
  logger.info('🕐 CRON: Désactivation des contrats expirés...');
  
  try {
    const now = new Date();
    const result = await Advertisement.updateMany(
      {
        isActive: true,
        endDate: { $lt: now }
      },
      {
        isActive: false,
        'contract.status': 'expired'
      }
    );

    logger.info(`✅ CRON: ${result.modifiedCount} publicités désactivées (contrats expirés)`);
  } catch (error) {
    logger.error('❌ CRON: Erreur lors de la désactivation:', error);
  }
}, {
  timezone: "Indian/Antananarivo"
});

/**
 * Désactivation des pubs ayant atteint leur quota
 */
const disableQuotaReached = cron.schedule('*/30 * * * *', async () => {
  // Toutes les 30 minutes
  try {
    const advertisements = await Advertisement.find({
      isActive: true,
      'contract.maxViews': { $exists: true, $ne: null }
    });

    let disabledCount = 0;

    for (const ad of advertisements) {
      if (ad.isQuotaReached()) {
        ad.isActive = false;
        ad.contract.status = 'expired';
        await ad.save();
        disabledCount++;

        // Envoyer notification
        if (ad.client?.contact?.email) {
          await emailService.sendEmail(
            ad.client.contact.email,
            'Quota de vues atteint',
            `Votre publicité "${ad.title}" a atteint son quota de vues (${ad.contract.maxViews}) et a été désactivée automatiquement.`
          );
        }
      }
    }

    if (disabledCount > 0) {
      logger.info(`✅ CRON: ${disabledCount} publicité(s) désactivée(s) (quota atteint)`);
    }
  } catch (error) {
    logger.error('❌ CRON: Erreur lors de la vérification des quotas:', error);
  }
}, {
  timezone: "Indian/Antananarivo"
});

/**
 * Rapport mensuel (1er du mois à 8h00)
 */
const monthlyReport = cron.schedule('0 8 1 * *', async () => {
  logger.info('🕐 CRON: Génération des rapports mensuels...');
  
  try {
    // Récupérer tous les ad-managers
    const User = require('../models/User');
    const adManagers = await User.find({ role: 'ad-manager', isActive: true });

    for (const manager of adManagers) {
      // Récupérer les pubs de ce manager
      const ads = await Advertisement.find({ createdBy: manager._id });

      if (ads.length === 0) continue;

      // Calculer les stats
      const stats = {
        activeAds: ads.filter(ad => ad.isActive).length,
        totalViews: ads.reduce((sum, ad) => sum + ad.viewCount, 0),
        totalRevenue: ads.reduce((sum, ad) => sum + ad.getRevenue(), 0),
        avgViewsPerDay: 0,
        topAds: ads
          .sort((a, b) => b.viewCount - a.viewCount)
          .slice(0, 3)
          .map(ad => ({ title: ad.title, views: ad.viewCount }))
      };

      // Calculer moyenne vues/jour
      const totalDays = ads.reduce((sum, ad) => {
        const days = Math.ceil((new Date() - ad.startDate) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      
      if (totalDays > 0) {
        stats.avgViewsPerDay = stats.totalViews / totalDays;
      }

      // Envoyer le rapport
      await emailService.sendMonthlyReport(manager.email, stats);
    }

    logger.info(`✅ CRON: Rapports envoyés à ${adManagers.length} ad-manager(s)`);
  } catch (error) {
    logger.error('❌ CRON: Erreur lors de la génération des rapports:', error);
  }
}, {
  timezone: "Indian/Antananarivo"
});

/**
 * Démarrer tous les CRON jobs
 */
const startAllJobs = () => {
  dailyCheck.start();
  disableExpired.start();
  disableQuotaReached.start();
  monthlyReport.start();
  
  logger.info('⏰ Tous les CRON jobs sont démarrés:');
  logger.info('   - Vérification quotidienne (9h00)');
  logger.info('   - Désactivation expirés (minuit)');
  logger.info('   - Vérification quotas (toutes les 30 min)');
  logger.info('   - Rapports mensuels (1er du mois à 8h00)');
};

/**
 * Arrêter tous les CRON jobs
 */
const stopAllJobs = () => {
  dailyCheck.stop();
  disableExpired.stop();
  disableQuotaReached.stop();
  monthlyReport.stop();
  
  logger.info('⏰ Tous les CRON jobs sont arrêtés');
};

module.exports = {
  startAllJobs,
  stopAllJobs,
  dailyCheck,
  disableExpired,
  disableQuotaReached,
  monthlyReport
};
