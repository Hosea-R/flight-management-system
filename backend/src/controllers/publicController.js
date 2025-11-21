const Flight = require('../models/Flight');

// @desc    Obtenir les arrivées publiques d'un aéroport (aujourd'hui)
// @route   GET /api/public/flights/:airportCode/arrivals
// @access  Public
exports.getArrivals = async (req, res) => {
  try {
    const { airportCode } = req.params;

    // Date du jour (début et fin)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const arrivals = await Flight.find({
      destinationAirportCode: airportCode.toUpperCase(),
      type: 'arrival',
      scheduledArrival: { $gte: startOfDay, $lte: endOfDay },
      isActive: true
    })
      .populate('airlineId', 'name code logo')
      .sort({ scheduledArrival: 1 })
      .select('flightNumber originAirportCode scheduledArrival estimatedArrival actualArrival status remarks aircraft');

    res.json({
      success: true,
      count: arrivals.length,
      data: arrivals
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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const departures = await Flight.find({
      originAirportCode: airportCode.toUpperCase(),
      type: 'departure',
      scheduledDeparture: { $gte: startOfDay, $lte: endOfDay },
      isActive: true
    })
      .populate('airlineId', 'name code logo')
      .sort({ scheduledDeparture: 1 })
      .select('flightNumber destinationAirportCode scheduledDeparture estimatedDeparture actualDeparture status remarks aircraft');

    res.json({
      success: true,
      count: departures.length,
      data: departures
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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Récupérer les départs
    const departures = await Flight.find({
      originAirportCode: airportCode.toUpperCase(),
      type: 'departure',
      scheduledDeparture: { $gte: startOfDay, $lte: endOfDay },
      isActive: true
    })
      .populate('airlineId', 'name code logo')
      .sort({ scheduledDeparture: 1 })
      .select('flightNumber destinationAirportCode scheduledDeparture estimatedDeparture actualDeparture status remarks aircraft type');

    // Récupérer les arrivées
    const arrivals = await Flight.find({
      destinationAirportCode: airportCode.toUpperCase(),
      type: 'arrival',
      scheduledArrival: { $gte: startOfDay, $lte: endOfDay },
      isActive: true
    })
      .populate('airlineId', 'name code logo')
      .sort({ scheduledArrival: 1 })
      .select('flightNumber originAirportCode scheduledArrival estimatedArrival actualArrival status remarks aircraft type');

    res.json({
      success: true,
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
