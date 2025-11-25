const Advertisement = require('../models/Advertisement');

/**
 * Service pour gérer la logique contractuelle
 */
class ContractService {
  /**
   * Générer un numéro de contrat unique
   */
  static generateContractNumber() {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PUB-${year}-${random}`;
  }

  /**
   * Calculer les métriques d'un contrat
   */
  static getContractMetrics(advertisement) {
    const metrics = {
      daysRemaining: advertisement.getDaysRemaining(),
      quotaReached: advertisement.isQuotaReached(),
      progressPercentage: advertisement.getProgressPercentage(),
      revenue: advertisement.getRevenue(),
      isExpiringSoon: advertisement.isExpiringSoon(),
      canDisplay: advertisement.canDisplay(),
      
      // Métriques calculées
      viewsRemaining: null,
      averageViewsPerDay: 0,
      projectedEndDate: null
    };

    // Vues restantes
    if (advertisement.contract?.maxViews) {
      metrics.viewsRemaining = advertisement.contract.maxViews - advertisement.viewCount;
    }

    // Moyenne de vues par jour
    const daysElapsed = Math.ceil((new Date() - advertisement.startDate) / (1000 * 60 * 60 * 24));
    if (daysElapsed > 0) {
      metrics.averageViewsPerDay = advertisement.viewCount / daysElapsed;
    }

    // Date de fin projetée basée sur le rythme actuel
    if (advertisement.contract?.maxViews && metrics.averageViewsPerDay > 0) {
      const daysToQuota = metrics.viewsRemaining / metrics.averageViewsPerDay;
      metrics.projectedEndDate = new Date(Date.now() + (daysToQuota * 24 * 60 * 60 * 1000));
    }

    return metrics;
  }

  /**
   * Vérifier si un contrat nécessite une alerte
   */
  static needsAlert(advertisement) {
    const alerts = {
      expiration: false,
      quota: false,
      messages: []
    };

    const metrics = this.getContractMetrics(advertisement);

    // Alerte d'expiration
    if (advertisement.alerts?.expirationWarning?.enabled && metrics.isExpiringSoon) {
      const daysLeft = metrics.daysRemaining;
      const threshold = advertisement.alerts.expirationWarning.daysBeforeExpiry || 30;
      
      if (daysLeft <= threshold) {
        alerts.expiration = true;
        alerts.messages.push(`Expire dans ${daysLeft} jour(s)`);
      }
    }

    // Alerte de quota
    if (advertisement.alerts?.quotaWarning?.enabled && advertisement.contract?.maxViews) {
      const threshold = advertisement.alerts.quotaWarning.threshold || 90;
      const percentUsed = (advertisement.viewCount / advertisement.contract.maxViews) * 100;
      
      if (percentUsed >= threshold) {
        alerts.quota = true;
        alerts.messages.push(`Quota atteint à ${percentUsed.toFixed(0)}%`);
      }
    }

    return alerts;
  }

  /**
   * Calculer le tarif suggéré selon le mode d'affichage
   */
  static getSuggestedPricing(displayMode, airportCount, billingCycle = 'monthly') {
    const baseRates = {
      'half-screen': {
        basique: 300000,    // 1 aéroport
        standard: 500000,   // 2-3 aéroports
        premium: 800000     // Tous
      },
      'full-screen': {
        basique: 800000,
        standard: 1500000,
        premium: 3000000
      }
    };

    let category;
    if (airportCount === 1) {
      category = 'basique';
    } else if (airportCount <= 3) {
      category = 'standard';
    } else {
      category = 'premium';
    }

    let amount = baseRates[displayMode][category];

    // Ajuster selon le cycle de facturation
    const multipliers = {
      monthly: 1,
      quarterly: 2.85,  // -5%
      yearly: 10.2      // -15%
    };

    amount *= multipliers[billingCycle] || 1;

    return {
      amount: Math.round(amount),
      currency: 'MGA',
      billingCycle,
      category,
      displayMode
    };
  }

  /**
   * Valider un contrat avant création/mise à jour
   */
  static validateContract(contractData) {
    const errors = [];

    // Vérifier les dates
    if (contractData.startDate && contractData.endDate) {
      const start = new Date(contractData.startDate);
      const end = new Date(contractData.endDate);
      
      if (end <= start) {
        errors.push('La date de fin doit être postérieure à la date de début');
      }
    }

    // Vérifier le montant
    if (contractData.pricing?.amount && contractData.pricing.amount < 0) {
      errors.push('Le montant doit être positif');
    }

    // Vérifier les quotas
    if (contractData.maxViews && contractData.maxViews < 0) {
      errors.push('Le quota de vues doit être positif');
    }

    if (contractData.maxDiffusionsPerDay && contractData.maxDiffusionsPerDay < 0) {
      errors.push('Le nombre max de diffusions par jour doit être positif');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = ContractService;
