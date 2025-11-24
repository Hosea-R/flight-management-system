const { Flight } = require('../models');
const FlightService = require('../services/flightService');
const logger = require('../config/logger');
const { formatPaginatedResponse } = require('../middleware/pagination.middleware');

// @desc    Créer un vol de départ (crée automatiquement l'arrivée)
// @route   POST /api/flights
// @access  Private (Admin de l'aéroport d'origine)
exports.createFlight = async (req, res) => {
  try {
    const userId = req.user.id;
    const io = req.app.get('io');

    // Vérifier que l'admin crée un vol depuis SON aéroport
    if (req.user.role === 'admin') {
      if (req.body.originAirportCode.toUpperCase() !== req.user.airportCode) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez créer des vols que depuis votre aéroport'
        });
      }
    }

    // Créer la paire de vols via le service
    const { departure, arrival } = await FlightService.createDepartureFlight(
      req.body,
      userId,
      io
    );

    res.status(201).json({
      success: true,
      message: 'Vol créé avec succès (départ + arrivée automatique)',
      data: {
        departure,
        arrival
      }
    });

    logger.info('Vol créé avec succès', {
      userId: req.user.id,
      departureId: departure._id,
      arrivalId: arrival._id,
      flightNumber: departure.flightNumber,
      route: `${departure.originAirportCode} → ${departure.destinationAirportCode}`
    });

  } catch (error) {
    logger.error('Erreur lors de la création du vol', {
      error: error.message,
      userId: req.user.id,
      body: req.body
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création du vol'
    });
  }
};

// @desc    Obtenir tous les vols (avec filtres)
// @route   GET /api/flights
// @access  Private
exports.getAllFlights = async (req, res) => {
  try {
    const { 
      airportCode, 
      type, 
      status, 
      date,
      page = 1,
      limit = 50
    } = req.query;

    // Construction du filtre
    const filter = { isActive: true };

    if (airportCode) {
      if (type === 'departure') {
        filter.type = 'departure';
        filter.originAirportCode = airportCode.toUpperCase();
      } else if (type === 'arrival') {
        filter.type = 'arrival';
        filter.destinationAirportCode = airportCode.toUpperCase();
      } else {
        // Les deux types
        filter.$or = [
          { type: 'departure', originAirportCode: airportCode.toUpperCase() },
          { type: 'arrival', destinationAirportCode: airportCode.toUpperCase() }
        ];
      }
    }

    if (status) {
      filter.status = status;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      filter.scheduledDeparture = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    // Si c'est un admin, limiter à son aéroport
    if (req.user.role === 'admin') {
      filter.$or = [
        { type: 'departure', originAirportCode: req.user.airportCode },
        { type: 'arrival', destinationAirportCode: req.user.airportCode }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const flights = await Flight.find(filter)
      .populate('airlineId', 'code name logo')
      .populate('createdBy', 'firstName lastName')
      .sort({ scheduledDeparture: 1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Flight.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: flights.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: flights
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des vols:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des vols',
      error: error.message
    });
  }
};

// @desc    Obtenir un vol par son ID
// @route   GET /api/flights/:id
// @access  Private
exports.getFlightById = async (req, res) => {
  try {
    const flight = await Flight.findById(req.params.id)
      .populate('airlineId', 'code name logo')
      .populate('createdBy', 'firstName lastName')
      .populate('linkedFlightId');

    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Vol non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: flight
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du vol:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du vol',
      error: error.message
    });
  }
};

// @desc    Obtenir les vols d'un aéroport (départs, arrivées ou tous)
// @route   GET /api/flights/airport/:airportCode
// @access  Private
exports.getFlightsByAirport = async (req, res) => {
  try {
    const { airportCode } = req.params;
    const { type, date } = req.query;

    // Vérifier les permissions
    if (req.user.role === 'admin' && req.user.airportCode !== airportCode.toUpperCase()) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas accès à cet aéroport'
      });
    }

    const filter = { isActive: true };

    // Filtre par type
    if (type === 'departure') {
      filter.type = 'departure';
      filter.originAirportCode = airportCode.toUpperCase();
    } else if (type === 'arrival') {
      filter.type = 'arrival';
      filter.destinationAirportCode = airportCode.toUpperCase();
    } else {
      filter.$or = [
        { type: 'departure', originAirportCode: airportCode.toUpperCase() },
        { type: 'arrival', destinationAirportCode: airportCode.toUpperCase() }
      ];
    }

    // Filtre par date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      filter.scheduledDeparture = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    const flights = await Flight.find(filter)
      .populate('airlineId', 'code name logo')
      .sort({ scheduledDeparture: 1 });

    res.status(200).json({
      success: true,
      airportCode: airportCode.toUpperCase(),
      count: flights.length,
      data: flights
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des vols:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des vols',
      error: error.message
    });
  }
};

// @desc    Mettre à jour le statut d'un vol
// @route   PATCH /api/flights/:id/status
// @access  Private
exports.updateFlightStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const io = req.app.get('io');

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Le statut est requis'
      });
    }

    // Vérifier les permissions
    const flight = await Flight.findById(id);
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Vol non trouvé'
      });
    }

    if (req.user.role === 'admin') {
      const userAirport = req.user.airportCode;
      const flightAirport = flight.type === 'departure' 
        ? flight.originAirportCode 
        : flight.destinationAirportCode;

      if (userAirport !== flightAirport) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez modifier que les vols de votre aéroport'
        });
      }
    }

    // Mettre à jour via le service (synchronise automatiquement)
    const oldStatus = flight.status;
    const result = await FlightService.updateFlightStatus(id, status, io);

    logger.info('Statut de vol mis à jour', {
      userId: req.user.id,
      flightId: id,
      flightNumber: flight.flightNumber,
      oldStatus,
      newStatus: status,
      route: `${flight.originAirportCode} → ${flight.destinationAirportCode}`
    });

    res.status(200).json({
      success: true,
      message: 'Statut mis à jour avec succès',
      data: result
    });

  } catch (error) {
    logger.error('Erreur lors de la mise à jour du statut', {
      error: error.message,
      userId: req.user?.id,
      flightId: req.params.id,
      requestedStatus: req.body.status
    });
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour du statut'
    });
  }
};

// @desc    Mettre à jour les détails d'un vol
// @route   PUT /api/flights/:id
// @access  Private
exports.updateFlightDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const io = req.app.get('io');

    // Vérifier les permissions
    const flight = await Flight.findById(id);
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Vol non trouvé'
      });
    }

    if (req.user.role === 'admin') {
      const userAirport = req.user.airportCode;
      const flightAirport = flight.type === 'departure' 
        ? flight.originAirportCode 
        : flight.destinationAirportCode;

      if (userAirport !== flightAirport) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez modifier que les vols de votre aéroport'
        });
      }
    }

    // Mettre à jour via le service
    const result = await FlightService.updateFlightDetails(id, updates, io);

    res.status(200).json({
      success: true,
      message: 'Vol mis à jour avec succès',
      data: result
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du vol:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour du vol'
    });
  }
};

// @desc    Annuler un vol
// @route   PATCH /api/flights/:id/cancel
// @access  Private
exports.cancelFlight = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const io = req.app.get('io');

    // Vérifier les permissions
    const flight = await Flight.findById(id);
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Vol non trouvé'
      });
    }

    if (req.user.role === 'admin') {
      if (flight.type === 'departure' && flight.originAirportCode !== req.user.airportCode) {
        return res.status(403).json({
          success: false,
          message: 'Seul l\'aéroport d\'origine peut annuler un vol'
        });
      }
    }

    // Annuler via le service
    const result = await FlightService.cancelFlight(id, reason, io);

    res.status(200).json({
      success: true,
      message: 'Vol annulé avec succès',
      data: result
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation du vol:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Erreur lors de l\'annulation du vol'
    });
  }
};

// @desc    Supprimer un vol (paire complète)
// @route   DELETE /api/flights/:id
// @access  Private (SuperAdmin ou Admin de l'aéroport d'origine)
exports.deleteFlight = async (req, res) => {
  try {
    const { id } = req.params;
    const io = req.app.get('io');

    // Vérifier les permissions
    const flight = await Flight.findById(id);
    if (!flight) {
      return res.status(404).json({
        success: false,
        message: 'Vol non trouvé'
      });
    }

    if (req.user.role === 'admin') {
      if (flight.type === 'departure' && flight.originAirportCode !== req.user.airportCode) {
        return res.status(403).json({
          success: false,
          message: 'Seul l\'aéroport d\'origine peut supprimer un vol'
        });
      }
    }

    // Supprimer via le service
    const result = await FlightService.deleteFlightPair(id, io);

    logger.warn('Vol supprimé (paire complète)', {
      userId: req.user.id,
      flightId: id,
      flightNumber: flight.flightNumber,
      route: `${flight.originAirportCode} → ${flight.destinationAirportCode}`,
      deletedCount: result.deletedFlights
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        deletedFlights: result.deletedFlights
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la suppression du vol', {
      error: error.message,
      userId: req.user?.id,
      flightId: req.params.id
    });
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression du vol'
    });
  }
};