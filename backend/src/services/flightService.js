const { Flight, Airport, Airline } = require('../models');

/**
 * SERVICE DE GESTION DES VOLS
 * 
 * Ce service contient toute la logique métier pour :
 * 1. Créer un départ et son arrivée automatiquement
 * 2. Synchroniser les statuts entre départ et arrivée
 * 3. Gérer les mises à jour et suppressions
 */

class FlightService {
  
  /**
   * Créer un vol de DÉPART (crée automatiquement l'ARRIVÉE)
   * 
   * @param {Object} flightData - Données du vol
   * @param {String} userId - ID de l'utilisateur qui crée le vol
   * @param {Object} io - Instance Socket.io pour les notifications
   * @returns {Object} - Les deux vols créés (départ et arrivée)
   */
  static async createDepartureFlight(flightData, userId, io) {
    const {
      flightNumber,
      airlineId,
      originAirportCode,
      destinationAirportCode,
      scheduledDeparture,
      scheduledArrival,
      aircraft,
      remarks
    } = flightData;

    // 1. VALIDATIONS
    
    // Vérifier que les aéroports existent
    const originAirport = await Airport.findOne({ 
      code: originAirportCode.toUpperCase(), 
      isActive: true 
    });
    
    if (!originAirport) {
      throw new Error(`L'aéroport d'origine ${originAirportCode} n'existe pas ou est inactif`);
    }

    const destinationAirport = await Airport.findOne({ 
      code: destinationAirportCode.toUpperCase(), 
      isActive: true 
    });
    
    if (!destinationAirport) {
      throw new Error(`L'aéroport de destination ${destinationAirportCode} n'existe pas ou est inactif`);
    }

    // Vérifier que la compagnie existe
    const airline = await Airline.findById(airlineId);
    if (!airline || !airline.isActive) {
      throw new Error('La compagnie aérienne n\'existe pas ou est inactive');
    }

    // Vérifier que les dates sont cohérentes
    if (new Date(scheduledArrival) <= new Date(scheduledDeparture)) {
      throw new Error('L\'heure d\'arrivée doit être postérieure à l\'heure de départ');
    }

    // 2. CRÉER LE VOL DE DÉPART
    
    const departureData = {
      flightNumber: flightNumber.toUpperCase(),
      airlineId,
      type: 'departure',
      originAirportCode: originAirportCode.toUpperCase(),
      destinationAirportCode: destinationAirportCode.toUpperCase(),
      scheduledDeparture: new Date(scheduledDeparture),
      scheduledArrival: new Date(scheduledArrival),
      status: 'scheduled',
      aircraft: aircraft || {},
      remarks,
      createdBy: userId,
      isActive: true
    };

    const departureFlight = await Flight.create(departureData);
    console.log(`✅ Vol de DÉPART créé: ${departureFlight._id}`);

    // 3. CRÉER AUTOMATIQUEMENT LE VOL D'ARRIVÉE
    
    const arrivalData = {
      flightNumber: flightNumber.toUpperCase(), // Même numéro de vol
      airlineId,
      type: 'arrival',
      originAirportCode: originAirportCode.toUpperCase(),
      destinationAirportCode: destinationAirportCode.toUpperCase(),
      scheduledDeparture: new Date(scheduledDeparture),
      scheduledArrival: new Date(scheduledArrival),
      status: 'scheduled',
      aircraft: aircraft || {},
      remarks,
      createdBy: userId,
      linkedFlightId: departureFlight._id, // Lien vers le départ
      isActive: true
    };

    const arrivalFlight = await Flight.create(arrivalData);
    console.log(`✅ Vol d'ARRIVÉE créé automatiquement: ${arrivalFlight._id}`);

    // 4. METTRE À JOUR LE DÉPART AVEC LE LIEN VERS L'ARRIVÉE
    
    departureFlight.linkedFlightId = arrivalFlight._id;
    await departureFlight.save();
    console.log(`✅ Lien bidirectionnel établi entre ${departureFlight._id} et ${arrivalFlight._id}`);

    // 5. PEUPLER LES RÉFÉRENCES
    
    await departureFlight.populate('airlineId', 'code name logo');
    await arrivalFlight.populate('airlineId', 'code name logo');

    // 6. ÉMETTRE LES ÉVÉNEMENTS SOCKET.IO
    
    if (io) {
      // Notifier l'aéroport d'origine (départ)
      io.to(originAirportCode.toUpperCase()).emit('flight:created', {
        type: 'departure',
        flight: departureFlight
      });

      // Notifier l'aéroport de destination (arrivée)
      io.to(destinationAirportCode.toUpperCase()).emit('flight:created', {
        type: 'arrival',
        flight: arrivalFlight
      });

      // Notifier globalement (pour le SuperAdmin)
      io.emit('flight:created:global', {
        departure: departureFlight,
        arrival: arrivalFlight
      });
    }

    return {
      departure: departureFlight,
      arrival: arrivalFlight
    };
  }

  /**
   * Mettre à jour le statut d'un vol (synchronise automatiquement le vol lié)
   * 
   * @param {String} flightId - ID du vol à mettre à jour
   * @param {String} newStatus - Nouveau statut
   * @param {Object} io - Instance Socket.io
   * @returns {Object} - Les deux vols mis à jour
   */
  static async updateFlightStatus(flightId, newStatus, io) {
    
    // 1. RÉCUPÉRER LE VOL
    
    const flight = await Flight.findById(flightId).populate('airlineId', 'code name logo');
    
    if (!flight) {
      throw new Error('Vol non trouvé');
    }

    const oldStatus = flight.status;

    // 2. VALIDATIONS DES TRANSITIONS DE STATUT
    
    const validTransitions = {
      'scheduled': ['on-time', 'delayed', 'cancelled'],
      'on-time': ['delayed', 'boarding', 'cancelled'],
      'delayed': ['on-time', 'boarding', 'cancelled'],
      'boarding': ['departed', 'delayed', 'cancelled'],
      'departed': ['in-flight'],
      'in-flight': ['landed'],
      'landed': [], // État final
      'cancelled': [] // État final
    };

    if (!validTransitions[oldStatus]?.includes(newStatus)) {
      throw new Error(`Transition de statut invalide: ${oldStatus} → ${newStatus}`);
    }

    // 3. METTRE À JOUR LE VOL PRINCIPAL
    
    flight.status = newStatus;

    // Mettre à jour les heures réelles si applicable
    if (newStatus === 'departed') {
      flight.actualDeparture = new Date();
    } else if (newStatus === 'landed') {
      flight.actualArrival = new Date();
    }

    await flight.save();
    console.log(`✅ Statut du vol ${flightId} mis à jour: ${oldStatus} → ${newStatus}`);

    // 4. SYNCHRONISER LE VOL LIÉ
    
    let linkedFlight = null;
    
    if (flight.linkedFlightId) {
      linkedFlight = await Flight.findById(flight.linkedFlightId).populate('airlineId', 'code name logo');
      
      if (linkedFlight) {
        const linkedOldStatus = linkedFlight.status;
        
        // RÈGLES DE SYNCHRONISATION
        if (flight.type === 'departure') {
          // Si le DÉPART décolle → l'ARRIVÉE passe en "in-flight"
          if (newStatus === 'departed') {
            linkedFlight.status = 'in-flight';
            console.log(`🔄 Arrivée synchronisée: ${linkedOldStatus} → in-flight`);
          }
          // Si le DÉPART est annulé → l'ARRIVÉE est annulée
          else if (newStatus === 'cancelled') {
            linkedFlight.status = 'cancelled';
            console.log(`🔄 Arrivée synchronisée: ${linkedOldStatus} → cancelled`);
          }
          // Si le DÉPART est retardé → l'ARRIVÉE est retardée
          else if (newStatus === 'delayed') {
            linkedFlight.status = 'delayed';
            console.log(`🔄 Arrivée synchronisée: ${linkedOldStatus} → delayed`);
          }
          // Si le DÉPART est à l'heure → l'ARRIVÉE est à l'heure
          else if (newStatus === 'on-time') {
            linkedFlight.status = 'on-time';
            console.log(`🔄 Arrivée synchronisée: ${linkedOldStatus} → on-time`);
          }
        } 
        else if (flight.type === 'arrival') {
          // Si l'ARRIVÉE atterrit → le DÉPART reste "departed"
          if (newStatus === 'landed') {
            if (linkedFlight.status === 'in-flight') {
              linkedFlight.status = 'departed'; // État final du départ
            }
            console.log(`🔄 Départ reste: departed (arrivée atterrie)`);
          }
        }

        await linkedFlight.save();
      }
    }

    // 5. ÉMETTRE LES ÉVÉNEMENTS SOCKET.IO
    
    if (io) {
      // Notifier les aéroports concernés
      if (flight.type === 'departure') {
        io.to(flight.originAirportCode).emit('flight:statusChanged', {
          flightId: flight._id,
          oldStatus,
          newStatus,
          flight
        });
      } else {
        io.to(flight.destinationAirportCode).emit('flight:statusChanged', {
          flightId: flight._id,
          oldStatus,
          newStatus,
          flight
        });
      }

      // Notifier pour le vol lié
      if (linkedFlight) {
        const linkedFlightAirport = linkedFlight.type === 'departure' 
          ? linkedFlight.originAirportCode 
          : linkedFlight.destinationAirportCode;
        
        io.to(linkedFlightAirport).emit('flight:statusChanged', {
          flightId: linkedFlight._id,
          oldStatus: linkedOldStatus,
          newStatus: linkedFlight.status,
          flight: linkedFlight
        });
      }

      // Notification globale
      io.emit('flight:statusChanged:global', {
        main: { flight, oldStatus, newStatus },
        linked: linkedFlight ? { 
          flight: linkedFlight, 
          oldStatus: linkedOldStatus, 
          newStatus: linkedFlight.status 
        } : null
      });
    }

    return {
      main: flight,
      linked: linkedFlight
    };
  }

  /**
   * Mettre à jour les détails d'un vol (heures, remarques, etc.)
   * 
   * @param {String} flightId - ID du vol
   * @param {Object} updates - Données à mettre à jour
   * @param {Object} io - Instance Socket.io
   * @returns {Object} - Les deux vols mis à jour
   */
  static async updateFlightDetails(flightId, updates, io) {
    
    // Champs non modifiables
    const protectedFields = ['_id', 'type', 'linkedFlightId', 'createdBy', 'createdAt'];
    protectedFields.forEach(field => delete updates[field]);

    // 1. METTRE À JOUR LE VOL PRINCIPAL
    
    const flight = await Flight.findByIdAndUpdate(
      flightId,
      updates,
      { new: true, runValidators: true }
    ).populate('airlineId', 'code name logo');

    if (!flight) {
      throw new Error('Vol non trouvé');
    }

    console.log(`✅ Vol ${flightId} mis à jour`);

    // 2. SYNCHRONISER LE VOL LIÉ
    
    let linkedFlight = null;
    
    if (flight.linkedFlightId) {
      // Synchroniser les champs communs
      const syncFields = {
        scheduledDeparture: updates.scheduledDeparture,
        scheduledArrival: updates.scheduledArrival,
        estimatedDeparture: updates.estimatedDeparture,
        estimatedArrival: updates.estimatedArrival,
        aircraft: updates.aircraft,
        remarks: updates.remarks
      };

      // Retirer les champs undefined
      Object.keys(syncFields).forEach(key => {
        if (syncFields[key] === undefined) delete syncFields[key];
      });

      if (Object.keys(syncFields).length > 0) {
        linkedFlight = await Flight.findByIdAndUpdate(
          flight.linkedFlightId,
          syncFields,
          { new: true, runValidators: true }
        ).populate('airlineId', 'code name logo');

        console.log(`🔄 Vol lié ${flight.linkedFlightId} synchronisé`);
      }
    }

    // 3. ÉMETTRE LES ÉVÉNEMENTS
    
    if (io) {
      const airportCode = flight.type === 'departure' 
        ? flight.originAirportCode 
        : flight.destinationAirportCode;
      
      io.to(airportCode).emit('flight:updated', flight);

      if (linkedFlight) {
        const linkedAirportCode = linkedFlight.type === 'departure'
          ? linkedFlight.originAirportCode
          : linkedFlight.destinationAirportCode;
        
        io.to(linkedAirportCode).emit('flight:updated', linkedFlight);
      }

      io.emit('flight:updated:global', { main: flight, linked: linkedFlight });
    }

    return {
      main: flight,
      linked: linkedFlight
    };
  }

  /**
   * Annuler un vol (annule automatiquement le vol lié)
   * 
   * @param {String} flightId - ID du vol
   * @param {String} reason - Raison de l'annulation
   * @param {Object} io - Instance Socket.io
   * @returns {Object} - Les deux vols annulés
   */
  static async cancelFlight(flightId, reason, io) {
    return await this.updateFlightStatus(flightId, 'cancelled', io);
  }

  /**
   * Supprimer une paire de vols (départ + arrivée)
   * 
   * @param {String} flightId - ID d'un des deux vols
   * @param {Object} io - Instance Socket.io
   * @returns {Object} - Confirmation de suppression
   */
  static async deleteFlightPair(flightId, io) {
    
    const flight = await Flight.findById(flightId);
    
    if (!flight) {
      throw new Error('Vol non trouvé');
    }

    const linkedFlightId = flight.linkedFlightId;

    // Supprimer (désactiver) les deux vols
    flight.isActive = false;
    await flight.save();

    let linkedFlight = null;
    if (linkedFlightId) {
      linkedFlight = await Flight.findById(linkedFlightId);
      if (linkedFlight) {
        linkedFlight.isActive = false;
        await linkedFlight.save();
      }
    }

    console.log(`🗑️  Paire de vols supprimée: ${flightId} et ${linkedFlightId}`);

    // Émettre les événements
    if (io) {
      io.to(flight.originAirportCode).emit('flight:deleted', { flightId: flight._id });
      io.to(flight.destinationAirportCode).emit('flight:deleted', { flightId: flight._id });
      
      if (linkedFlight) {
        io.to(linkedFlight.originAirportCode).emit('flight:deleted', { flightId: linkedFlight._id });
        io.to(linkedFlight.destinationAirportCode).emit('flight:deleted', { flightId: linkedFlight._id });
      }

      io.emit('flight:deleted:global', { 
        flightId: flight._id, 
        linkedFlightId: linkedFlightId 
      });
    }

    return {
      message: 'Vols supprimés avec succès',
      deletedFlights: [flight._id, linkedFlightId]
    };
  }
}

module.exports = FlightService;