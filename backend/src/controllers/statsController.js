const Flight = require('../models/Flight');
const Airport = require('../models/Airport');
const Airline = require('../models/Airline');
const moment = require('moment-timezone');

// @desc    Obtenir les statistiques globales (SuperAdmin)
// @route   GET /api/stats/global
// @access  SuperAdmin only
exports.getGlobalStats = async (req, res) => {
  try {
    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    // 1. Total vols aujourd'hui
    const totalFlights = await Flight.countDocuments({
      $or: [
        { scheduledDeparture: { $gte: startOfDay, $lte: endOfDay } },
        { scheduledArrival: { $gte: startOfDay, $lte: endOfDay } }
      ],
      isActive: true
    });

    // 2. Vols par statut
    const flightsByStatus = await Flight.aggregate([
      {
        $match: {
          $or: [
            { scheduledDeparture: { $gte: startOfDay, $lte: endOfDay } },
            { scheduledArrival: { $gte: startOfDay, $lte: endOfDay } }
          ],
          isActive: true
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Transformer en objet pour faciliter l'accès
    const statusCounts = {
      scheduled: 0,
      boarding: 0,
      departed: 0,
      'in-flight': 0,
      landed: 0,
      arrived: 0,
      delayed: 0,
      cancelled: 0
    };

    flightsByStatus.forEach(item => {
      if (item._id) {
        statusCounts[item._id] = item.count;
      }
    });

    // 3. Vols par compagnie (top 5)
    const flightsByAirline = await Flight.aggregate([
      {
        $match: {
          $or: [
            { scheduledDeparture: { $gte: startOfDay, $lte: endOfDay } },
            { scheduledArrival: { $gte: startOfDay, $lte: endOfDay } }
          ],
          isActive: true
        }
      },
      {
        $group: {
          _id: '$airlineId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'airlines',
          localField: '_id',
          foreignField: '_id',
          as: 'airline'
        }
      },
      {
        $unwind: '$airline'
      },
      {
        $project: {
          name: '$airline.name',
          code: '$airline.code',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // 4. Nombre d'aéroports actifs
    const activeAirports = await Airport.countDocuments({ isActive: true });

    // 5. Historique 7 derniers jours
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = moment().subtract(i, 'days').startOf('day').toDate();
      const dayEnd = moment().subtract(i, 'days').endOf('day').toDate();

      const count = await Flight.countDocuments({
        $or: [
          { scheduledDeparture: { $gte: dayStart, $lte: dayEnd } },
          { scheduledArrival: { $gte: dayStart, $lte: dayEnd } }
        ],
        isActive: true
      });

      last7Days.push({
        date: moment(dayStart).format('DD/MM'),
        flights: count
      });
    }

    res.json({
      success: true,
      data: {
        totalFlights,
        delayed: statusCounts.delayed,
        cancelled: statusCounts.cancelled,
        activeAirports,
        statusBreakdown: statusCounts,
        flightsByAirline,
        last7Days
      }
    });

  } catch (error) {
    console.error('Erreur getGlobalStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};

// @desc    Obtenir les statistiques d'un aéroport
// @route   GET /api/stats/airport/:airportCode
// @access  Admin (son aéroport) ou SuperAdmin
exports.getAirportStats = async (req, res) => {
  try {
    const { airportCode } = req.params;

    // Vérifier les permissions
    if (req.user.role === 'admin' && req.user.airportCode !== airportCode.toUpperCase()) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'avez pas accès aux statistiques de cet aéroport'
      });
    }

    const startOfDay = moment().startOf('day').toDate();
    const endOfDay = moment().endOf('day').toDate();

    // 1. Départs aujourd'hui
    const departures = await Flight.countDocuments({
      originAirportCode: airportCode.toUpperCase(),
      scheduledDeparture: { $gte: startOfDay, $lte: endOfDay },
      isActive: true
    });

    // 2. Arrivées aujourd'hui
    const arrivals = await Flight.countDocuments({
      destinationAirportCode: airportCode.toUpperCase(),
      scheduledArrival: { $gte: startOfDay, $lte: endOfDay },
      isActive: true
    });

    // 3. Vols en retard
    const delayedFlights = await Flight.countDocuments({
      $or: [
        { originAirportCode: airportCode.toUpperCase() },
        { destinationAirportCode: airportCode.toUpperCase() }
      ],
      status: 'delayed',
      isActive: true
    });

    // 4. Prochains départs (5 prochains)
    const upcomingDepartures = await Flight.find({
      originAirportCode: airportCode.toUpperCase(),
      scheduledDeparture: { $gte: new Date() },
      isActive: true
    })
      .populate('airlineId', 'name code logo')
      .sort({ scheduledDeparture: 1 })
      .limit(5)
      .select('flightNumber destinationAirportCode scheduledDeparture estimatedDeparture status');

    // 5. Prochaines arrivées (5 prochaines)
    const upcomingArrivals = await Flight.find({
      destinationAirportCode: airportCode.toUpperCase(),
      scheduledArrival: { $gte: new Date() },
      isActive: true
    })
      .populate('airlineId', 'name code logo')
      .sort({ scheduledArrival: 1 })
      .limit(5)
      .select('flightNumber originAirportCode scheduledArrival estimatedArrival status');

    // 6. Historique 7 derniers jours
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = moment().subtract(i, 'days').startOf('day').toDate();
      const dayEnd = moment().subtract(i, 'days').endOf('day').toDate();

      const departuresCount = await Flight.countDocuments({
        originAirportCode: airportCode.toUpperCase(),
        scheduledDeparture: { $gte: dayStart, $lte: dayEnd },
        isActive: true
      });

      const arrivalsCount = await Flight.countDocuments({
        destinationAirportCode: airportCode.toUpperCase(),
        scheduledArrival: { $gte: dayStart, $lte: dayEnd },
        isActive: true
      });

      last7Days.push({
        date: moment(dayStart).format('DD/MM'),
        departures: departuresCount,
        arrivals: arrivalsCount
      });
    }

    res.json({
      success: true,
      data: {
        airportCode: airportCode.toUpperCase(),
        today: {
          departures,
          arrivals,
          total: departures + arrivals
        },
        delayedFlights,
        upcomingDepartures,
        upcomingArrivals,
        last7Days
      }
    });

  } catch (error) {
    console.error('Erreur getAirportStats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    });
  }
};
