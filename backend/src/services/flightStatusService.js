const Flight = require('../models/Flight');
const FlightService = require('./flightService');
const logger = require('../config/logger');

/**
 * SERVICE DE GESTION DES TRANSITIONS AUTOMATIQUES DE STATUTS
 * 
 * Ce service gère :
 * 1. Transitions automatiques basées sur le temps
 * 2. Détection automatique des retards
 * 3. Mise à jour des statuts selon les règles métier
 */

class FlightStatusService {
  
  /**
   * Met à jour tous les statuts de vols actifs selon l'heure actuelle
   * @param {Object} io - Instance Socket.io pour notifications temps réel
   * @returns {Object} - Statistiques des mises à jour
   */
  static async updateFlightStatuses(io) {
    const now = new Date();
    let updatedCount = 0;
    let errors = 0;

    try {
      // Récupérer tous les vols actifs d'aujourd'hui et demain
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      
      const endOfTomorrow = new Date(now);
      endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
      endOfTomorrow.setHours(23, 59, 59, 999);

      const flights = await Flight.find({
        isActive: true,
        scheduledDeparture: { $gte: startOfToday, $lte: endOfTomorrow },
        status: { $nin: ['cancelled'] } // Ne pas toucher aux vols annulés
      }).populate('airlineId', 'code name');

      logger.info(`🔄 Mise à jour automatique des statuts: ${flights.length} vols à analyser`);

      for (const flight of flights) {
        try {
          const newStatus = await this.calculateNewStatus(flight, now);
          
          if (newStatus && newStatus !== flight.status) {
            // Utiliser FlightService pour garantir la synchronisation
            await FlightService.updateFlightStatus(flight._id, newStatus, io);
            updatedCount++;
            logger.info(`✅ Vol ${flight.flightNumber} (${flight._id}): ${flight.status} → ${newStatus}`);
          }
        } catch (error) {
          errors++;
          logger.error(`❌ Erreur mise à jour vol ${flight._id}:`, { error: error.message });
        }
      }

      logger.info(`✅ Mise à jour terminée: ${updatedCount} vols mis à jour, ${errors} erreurs`);
      
      return {
        success: true,
        totalFlights: flights.length,
        updatedCount,
        errors
      };
    } catch (error) {
      logger.error('❌ Erreur lors de la mise à jour des statuts:', { error: error.message });
      throw error;
    }
  }

  /**
   * Calcule le nouveau statut d'un vol selon l'heure actuelle
   * @param {Object} flight - Le vol à analyser
   * @param {Date} now - Heure actuelle
   * @returns {String|null} - Nouveau statut ou null si pas de changement
   */
  static async calculateNewStatus(flight, now) {
    const currentStatus = flight.status;
    
    // Ne pas modifier les vols terminés ou annulés
    if (['departed', 'landed', 'cancelled'].includes(currentStatus)) {
      return null;
    }

    const scheduledTime = flight.type === 'departure' 
      ? new Date(flight.scheduledDeparture) 
      : new Date(flight.scheduledArrival);
    
    const estimatedTime = flight.type === 'departure'
      ? flight.estimatedDeparture ? new Date(flight.estimatedDeparture) : null
      : flight.estimatedArrival ? new Date(flight.estimatedArrival) : null;

    const minutesUntilScheduled = (scheduledTime - now) / (1000 * 60);
    const minutesUntilEstimated = estimatedTime ? (estimatedTime - now) / (1000 * 60) : null;

    // RÈGLE 1 : Détection automatique des retards
    if (estimatedTime && (estimatedTime - scheduledTime) > 15 * 60 * 1000) {
      // Retard de plus de 15 minutes
      if (!['delayed', 'boarding'].includes(currentStatus)) {
        return 'delayed';
      }
    }

    // RÈGLES POUR LES DÉPARTS
    if (flight.type === 'departure') {
      
      // scheduled → on-time (T-2h avant départ)
      if (currentStatus === 'scheduled' && minutesUntilScheduled <= 120 && minutesUntilScheduled > 0) {
        return 'on-time';
      }

      // on-time → boarding (T-45min avant départ)
      if (currentStatus === 'on-time' && minutesUntilScheduled <= 45 && minutesUntilScheduled > 0) {
        return 'boarding';
      }

      // delayed → boarding (T-30min avant heure estimée)
      if (currentStatus === 'delayed' && minutesUntilEstimated !== null && 
          minutesUntilEstimated <= 30 && minutesUntilEstimated > 0) {
        return 'boarding';
      }

      // boarding → departed (T+15min si pas de actualDeparture)
      if (currentStatus === 'boarding' && !flight.actualDeparture) {
        const timeToUse = estimatedTime || scheduledTime;
        const minutesSinceDeparture = (now - timeToUse) / (1000 * 60);
        
        if (minutesSinceDeparture >= 15) {
          return 'departed';
        }
      }
    }

    // RÈGLES POUR LES ARRIVÉES
    if (flight.type === 'arrival') {
      
      // scheduled → on-time (T-2h avant arrivée)
      if (currentStatus === 'scheduled' && minutesUntilScheduled <= 120 && minutesUntilScheduled > 0) {
        return 'on-time';
      }

      // on-time → in-flight (T-1h avant arrivée)
      if (currentStatus === 'on-time' && minutesUntilScheduled <= 60 && minutesUntilScheduled > 0) {
        return 'in-flight';
      }

      // delayed → in-flight (T-45min avant heure estimée)
      if (currentStatus === 'delayed' && minutesUntilEstimated !== null && 
          minutesUntilEstimated <= 45 && minutesUntilEstimated > 0) {
        return 'in-flight';
      }

      // in-flight → landed (à l'heure programmée si pas de actualArrival)
      if (currentStatus === 'in-flight' && !flight.actualArrival) {
        const timeToUse = estimatedTime || scheduledTime;
        const minutesSinceArrival = (now - timeToUse) / (1000 * 60);
        
        if (minutesSinceArrival >= 0) {
          return 'landed';
        }
      }
    }

    // Pas de changement nécessaire
    return null;
  }

  /**
   * Vérifie si un vol doit être masqué des écrans publics
   * @param {Object} flight - Le vol à vérifier
   * @param {Date} now - Heure actuelle
   * @returns {Boolean} - true si le vol doit être masqué
   */
  static shouldHideFlight(flight, now) {
    const status = flight.status;
    
    // departed : masquer après 30min
    if (status === 'departed' && flight.actualDeparture) {
      const minutesSinceDeparture = (now - new Date(flight.actualDeparture)) / (1000 * 60);
      return minutesSinceDeparture > 30;
    }

    // landed : masquer après 30min
    if (status === 'landed' && flight.actualArrival) {
      const minutesSinceLanding = (now - new Date(flight.actualArrival)) / (1000 * 60);
      return minutesSinceLanding > 30;
    }

    // cancelled : masquer après 2h
    if (status === 'cancelled') {
      const scheduledTime = flight.type === 'departure' 
        ? new Date(flight.scheduledDeparture)
        : new Date(flight.scheduledArrival);
      const hoursSinceScheduled = (now - scheduledTime) / (1000 * 60 * 60);
      return hoursSinceScheduled > 2;
    }

    return false;
  }

  /**
   * Calcule le délai d'un vol en minutes
   * @param {Object} flight - Le vol
   * @returns {Number} - Délai en minutes (0 si aucun retard)
   */
  static getDelayMinutes(flight) {
    if (flight.type === 'departure') {
      if (!flight.estimatedDeparture) return 0;
      const delay = new Date(flight.estimatedDeparture) - new Date(flight.scheduledDeparture);
      return Math.max(0, Math.floor(delay / (1000 * 60)));
    } else {
      if (!flight.estimatedArrival) return 0;
      const delay = new Date(flight.estimatedArrival) - new Date(flight.scheduledArrival);
      return Math.max(0, Math.floor(delay / (1000 * 60)));
    }
  }
}

module.exports = FlightStatusService;
