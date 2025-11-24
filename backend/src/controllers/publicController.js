const Flight = require('../models/Flight');
const Airport = require('../models/Airport');

// @desc    Obtenir les arrivées publiques d'un aéroport (aujourd'hui)
// @route   GET /api/public/flights/:airportCode/arrivals
// @access  Public
exports.getArrivals = async (req, res) => {
  try {
    const { airportCode } = req.params;

    // Récupérer les infos de l'aéroport
    const airport = await Airport.findOne({ code: airportCode.toUpperCase() });
    
    const now = new Date();
    
    // FENÊTRE D'AFFICHAGE POUR ARRIVÉES
    // Passés : jusqu'à 1h après l'arrivée programmée
    // Futurs : jusqu'à 24h à l'avance
    const startTime = new Date(now);
    startTime.setHours(startTime.getHours() - 1);
    
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 24);

    const arrivals = await Flight.find({
      destinationAirportCode: airportCode.toUpperCase(),
      type: 'arrival',
      scheduledArrival: { $gte: startTime, $lte: endTime },
      isActive: true
    })
      .populate('airlineId', 'name code logo')
      .populate('originAirport', 'code city name')
      .sort({ scheduledArrival: 1 })
      .select('flightNumber originAirportCode scheduledArrival estimatedArrival actualArrival status remarks aircraft');

    // Filtrer les vols qui doivent être masqués (côté serveur pour performance)
    const FlightStatusService = require('../services/flightStatusService');
    const visibleFlights = arrivals.filter(flight => {
      return !FlightStatusService.shouldHideFlight(flight, now);
    });

    res.json({
      success: true,
      count: visibleFlights.length,
      airport,
      data: visibleFlights
    });
  } catch (error) {
    console.error('Erreur getArrivals:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des arrivées'
    });
  }
};

// @desc    Obtenir les départs publiques d'un aéroport (aujourd'hui)
// @route   GET /api/public/flights/:airportCode/departures
// @access  Public
exports.getDepartures = async (req, res) => {
  try {
    const { airportCode } = req.params;

    // Récupérer les infos de l'aéroport
    const airport = await Airport.findOne({ code: airportCode.toUpperCase() });

    const now = new Date();
    
    // FENÊTRE D'AFFICHAGE POUR DÉPARTS
    // Passés : jusqu'à 2h après le départ programmé
    // Futurs : jusqu'à 24h à l'avance
    const startTime = new Date(now);
    startTime.setHours(startTime.getHours() - 2);
    
    const endTime = new Date(now);
    endTime.setHours(endTime.getHours() + 24);

    const departures = await Flight.find({
      originAirportCode: airportCode.toUpperCase(),
      type: 'departure',
      scheduledDeparture: { $gte: startTime, $lte: endTime },
      isActive: true
    })
      .populate('airlineId', 'name code logo')
      .populate('destinationAirport', 'code city name')
      .sort({ scheduledDeparture: 1 })
      .select('flightNumber destinationAirportCode scheduledDeparture estimatedDeparture actualDeparture status remarks aircraft');

    // Filtrer les vols qui doivent être masqués
    const FlightStatusService = require('../services/flightStatusService');
    const visibleFlights = departures.filter(flight => {
      return !FlightStatusService.shouldHideFlight(flight, now);
    });

    res.json({
      success: true,
      count: visibleFlights.length,
      airport,
      data: visibleFlights
    });
  } catch (error) {
    console.error('Erreur getDepartures:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des départs'
    });
  }
};

// @desc    Obtenir tous les vols publiques d'un aéroport (aujourd'hui)
// @route   GET /api/public/flights/:airportCode/all
// @access  Public
exports.getAllFlights = async (req, res) => {
  try {
    const { airportCode } = req.params;

    // Récupérer les infos de l'aéroport
    const airport = await Airport.findOne({ code: airportCode.toUpperCase() });

    const now = new Date();
    const FlightStatusService = require('../services/flightStatusService');
    
    // FENÊTRE POUR DÉPARTS: -2h à +24h
    const departureStart = new Date(now);
    departureStart.setHours(departureStart.getHours() - 2);
    const departureEnd = new Date(now);
    departureEnd.setHours(departureEnd.getHours() + 24);

    // Récupérer les départs
    const allDepartures = await Flight.find({
      originAirportCode: airportCode.toUpperCase(),
      type: 'departure',
      scheduledDeparture: { $gte: departureStart, $lte: departureEnd },
      isActive: true
    })
      .populate('airlineId', 'name code logo')
      .populate('destinationAirport', 'code city name')
      .sort({ scheduledDeparture: 1 })
      .select('flightNumber destinationAirportCode scheduledDeparture estimatedDeparture actualDeparture status remarks aircraft type');

    // Filtrer les départs visibles
    const departures = allDepartures.filter(flight => {
      return !FlightStatusService.shouldHideFlight(flight, now);
    });

    // FENÊTRE POUR ARRIVÉES: -1h à +24h
    const arrivalStart = new Date(now);
    arrivalStart.setHours(arrivalStart.getHours() - 1);
    const arrivalEnd = new Date(now);
    arrivalEnd.setHours(arrivalEnd.getHours() + 24);

    // Récupérer les arrivées
    const allArrivals = await Flight.find({
      destinationAirportCode: airportCode.toUpperCase(),
      type: 'arrival',
      scheduledArrival: { $gte: arrivalStart, $lte: arrivalEnd },
      isActive: true
    })
      .populate('airlineId', 'name code logo')
      .populate('originAirport', 'code city name')
      .sort({ scheduledArrival: 1 })
      .select('flightNumber originAirportCode scheduledArrival estimatedArrival actualArrival status remarks aircraft type');

    // Filtrer les arrivées visibles
    const arrivals = allArrivals.filter(flight => {
      return !FlightStatusService.shouldHideFlight(flight, now);
    });

    res.json({
      success: true,
      airport,
      data: {
        departures,
        arrivals
      }
    });
  } catch (error) {
    console.error('Erreur getAllFlights:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des vols'
    });
  }
};
