/**
 * SERVICE DE NOTIFICATIONS EN TEMPS RÉEL
 * 
 * Centralise toutes les émissions Socket.io pour maintenir la cohérence
 */

class NotificationService {
  
  constructor(io) {
    this.io = io;
  }

  /**
   * Notifier la création d'un vol
   */
  notifyFlightCreated(departure, arrival) {
    console.log(`📡 Émission: flight:created pour ${departure.flightNumber}`);

    // Notifier l'aéroport d'origine (départ)
    this.io.to(departure.originAirportCode).emit('flight:created', {
      type: 'departure',
      flight: departure
    });

    // Notifier l'aéroport de destination (arrivée)
    this.io.to(arrival.destinationAirportCode).emit('flight:created', {
      type: 'arrival',
      flight: arrival
    });

    // Notification globale (SuperAdmin, dashboards globaux)
    this.io.emit('flight:created:global', {
      departure,
      arrival
    });
  }

  /**
   * Notifier la mise à jour du statut d'un vol
   */
  notifyFlightStatusChanged(mainFlight, linkedFlight, oldStatus, newStatus) {
    console.log(`📡 Émission: flight:statusChanged ${mainFlight._id} (${oldStatus} → ${newStatus})`);

    // Notifier pour le vol principal
    const mainAirportCode = mainFlight.type === 'departure' 
      ? mainFlight.originAirportCode 
      : mainFlight.destinationAirportCode;

    this.io.to(mainAirportCode).emit('flight:statusChanged', {
      flightId: mainFlight._id,
      oldStatus,
      newStatus,
      flight: mainFlight
    });

    // Notifier pour le vol lié
    if (linkedFlight) {
      const linkedAirportCode = linkedFlight.type === 'departure'
        ? linkedFlight.originAirportCode
        : linkedFlight.destinationAirportCode;

      this.io.to(linkedAirportCode).emit('flight:statusChanged', {
        flightId: linkedFlight._id,
        oldStatus: linkedFlight.status,
        newStatus: linkedFlight.status,
        flight: linkedFlight
      });
    }

    // Notification globale
    this.io.emit('flight:statusChanged:global', {
      main: { flight: mainFlight, oldStatus, newStatus },
      linked: linkedFlight
    });
  }

  /**
   * Notifier la mise à jour des détails d'un vol
   */
  notifyFlightUpdated(mainFlight, linkedFlight) {
    console.log(`📡 Émission: flight:updated ${mainFlight._id}`);

    // Vol principal
    const mainAirportCode = mainFlight.type === 'departure'
      ? mainFlight.originAirportCode
      : mainFlight.destinationAirportCode;

    this.io.to(mainAirportCode).emit('flight:updated', mainFlight);

    // Vol lié
    if (linkedFlight) {
      const linkedAirportCode = linkedFlight.type === 'departure'
        ? linkedFlight.originAirportCode
        : linkedFlight.destinationAirportCode;

      this.io.to(linkedAirportCode).emit('flight:updated', linkedFlight);
    }

    // Global
    this.io.emit('flight:updated:global', {
      main: mainFlight,
      linked: linkedFlight
    });
  }

  /**
   * Notifier la suppression d'un vol
   */
  notifyFlightDeleted(flight, linkedFlightId) {
    console.log(`📡 Émission: flight:deleted ${flight._id}`);

    // Notifier les aéroports concernés
    this.io.to(flight.originAirportCode).emit('flight:deleted', {
      flightId: flight._id
    });

    this.io.to(flight.destinationAirportCode).emit('flight:deleted', {
      flightId: flight._id
    });

    // Global
    this.io.emit('flight:deleted:global', {
      flightId: flight._id,
      linkedFlightId
    });
  }

  /**
   * Notifier la création d'un aéroport
   */
  notifyAirportCreated(airport) {
    console.log(`📡 Émission: airport:created ${airport.code}`);
    this.io.emit('airport:created', airport);
  }

  /**
   * Notifier la mise à jour d'un aéroport
   */
  notifyAirportUpdated(airport) {
    console.log(`📡 Émission: airport:updated ${airport.code}`);
    this.io.emit('airport:updated', airport);
  }

  /**
   * Notifier la suppression d'un aéroport
   */
  notifyAirportDeleted(airportCode) {
    console.log(`📡 Émission: airport:deleted ${airportCode}`);
    this.io.emit('airport:deleted', { code: airportCode });
  }

  /**
   * Notifier la création d'une compagnie
   */
  notifyAirlineCreated(airline) {
    console.log(`📡 Émission: airline:created ${airline.code}`);
    this.io.emit('airline:created', airline);
  }

  /**
   * Notifier la mise à jour d'une compagnie
   */
  notifyAirlineUpdated(airline) {
    console.log(`📡 Émission: airline:updated ${airline.code}`);
    this.io.emit('airline:updated', airline);
  }

  /**
   * Notifier la suppression d'une compagnie
   */
  notifyAirlineDeleted(airlineCode) {
    console.log(`📡 Émission: airline:deleted ${airlineCode}`);
    this.io.emit('airline:deleted', { code: airlineCode });
  }

  /**
   * Envoyer un message personnalisé à un aéroport spécifique
   */
  sendToAirport(airportCode, event, data) {
    console.log(`📡 Émission custom vers ${airportCode}: ${event}`);
    this.io.to(airportCode).emit(event, data);
  }

  /**
   * Broadcast global
   */
  broadcast(event, data) {
    console.log(`📡 Broadcast global: ${event}`);
    this.io.emit(event, data);
  }
}

module.exports = NotificationService;