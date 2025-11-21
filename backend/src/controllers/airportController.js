const { Airport } = require('../models');

// @desc    Obtenir tous les aéroports
// @route   GET /api/airports
// @access  Private
exports.getAllAirports = async (req, res) => {
  try {
    const { isActive, isCentral } = req.query;
    
    // Construire le filtre
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (isCentral !== undefined) {
      filter.isCentral = isCentral === 'true';
    }

    const airports = await Airport.find(filter).sort({ city: 1 });

    res.status(200).json({
      success: true,
      count: airports.length,
      data: airports
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des aéroports:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des aéroports',
      error: error.message
    });
  }
};

// @desc    Obtenir un aéroport par son code
// @route   GET /api/airports/:code
// @access  Private
exports.getAirportByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const airport = await Airport.findOne({ code: code.toUpperCase() });

    if (!airport) {
      return res.status(404).json({
        success: false,
        message: `Aucun aéroport trouvé avec le code ${code}`
      });
    }

    res.status(200).json({
      success: true,
      data: airport
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'aéroport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'aéroport',
      error: error.message
    });
  }
};

// @desc    Créer un nouvel aéroport
// @route   POST /api/airports
// @access  Private (SuperAdmin uniquement)
exports.createAirport = async (req, res) => {
  try {
    const { code, name, city, region, isCentral, coordinates, contact } = req.body;

    // Vérifier si l'aéroport existe déjà
    const existingAirport = await Airport.findOne({ code: code.toUpperCase() });
    if (existingAirport) {
      return res.status(400).json({
        success: false,
        message: `Un aéroport avec le code ${code} existe déjà`
      });
    }

    // Si on crée un aéroport central, vérifier qu'il n'y en a pas déjà un
    if (isCentral) {
      const centralAirport = await Airport.findOne({ isCentral: true });
      if (centralAirport) {
        return res.status(400).json({
          success: false,
          message: `Un aéroport central existe déjà (${centralAirport.code} - ${centralAirport.name})`
        });
      }
    }

    const airport = await Airport.create({
      code: code.toUpperCase(),
      name,
      city,
      region,
      isCentral: isCentral || false,
      coordinates,
      contact
    });

    // Émettre un événement Socket.io
    const io = req.app.get('io');
    io.emit('airport:created', airport);

    res.status(201).json({
      success: true,
      message: 'Aéroport créé avec succès',
      data: airport
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'aéroport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'aéroport',
      error: error.message
    });
  }
};

// @desc    Mettre à jour un aéroport
// @route   PUT /api/airports/:code
// @access  Private (SuperAdmin uniquement)
exports.updateAirport = async (req, res) => {
  try {
    const { code } = req.params;
    const updates = req.body;

    // Ne pas permettre de modifier le code
    delete updates.code;

    // Si on tente de rendre un aéroport central, vérifier qu'il n'y en a pas déjà un
    if (updates.isCentral === true) {
      const centralAirport = await Airport.findOne({ 
        isCentral: true, 
        code: { $ne: code.toUpperCase() } 
      });
      
      if (centralAirport) {
        return res.status(400).json({
          success: false,
          message: `Un aéroport central existe déjà (${centralAirport.code} - ${centralAirport.name})`
        });
      }
    }

    const airport = await Airport.findOneAndUpdate(
      { code: code.toUpperCase() },
      updates,
      { new: true, runValidators: true }
    );

    if (!airport) {
      return res.status(404).json({
        success: false,
        message: `Aucun aéroport trouvé avec le code ${code}`
      });
    }

    // Émettre un événement Socket.io
    const io = req.app.get('io');
    io.emit('airport:updated', airport);

    res.status(200).json({
      success: true,
      message: 'Aéroport mis à jour avec succès',
      data: airport
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'aéroport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'aéroport',
      error: error.message
    });
  }
};

// @desc    Supprimer (désactiver) un aéroport
// @route   DELETE /api/airports/:code
// @access  Private (SuperAdmin uniquement)
exports.deleteAirport = async (req, res) => {
  try {
    const { code } = req.params;

    const airport = await Airport.findOne({ code: code.toUpperCase() });

    if (!airport) {
      return res.status(404).json({
        success: false,
        message: `Aucun aéroport trouvé avec le code ${code}`
      });
    }

    // Ne pas supprimer physiquement, juste désactiver
    airport.isActive = false;
    await airport.save();

    // Émettre un événement Socket.io
    const io = req.app.get('io');
    io.emit('airport:deleted', { code: airport.code });

    res.status(200).json({
      success: true,
      message: 'Aéroport désactivé avec succès',
      data: airport
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'aéroport:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'aéroport',
      error: error.message
    });
  }
};

// @desc    Obtenir les statistiques d'un aéroport
// @route   GET /api/airports/:code/stats
// @access  Private
exports.getAirportStats = async (req, res) => {
  try {
    const { code } = req.params;
    const { Flight } = require('../models');

    const airport = await Airport.findOne({ code: code.toUpperCase() });

    if (!airport) {
      return res.status(404).json({
        success: false,
        message: `Aucun aéroport trouvé avec le code ${code}`
      });
    }

    // Statistiques du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Compter les vols
    const departuresToday = await Flight.countDocuments({
      type: 'departure',
      originAirportCode: code.toUpperCase(),
      scheduledDeparture: { $gte: today, $lt: tomorrow },
      isActive: true
    });

    const arrivalsToday = await Flight.countDocuments({
      type: 'arrival',
      destinationAirportCode: code.toUpperCase(),
      scheduledArrival: { $gte: today, $lt: tomorrow },
      isActive: true
    });

    const delayedFlights = await Flight.countDocuments({
      $or: [
        { type: 'departure', originAirportCode: code.toUpperCase() },
        { type: 'arrival', destinationAirportCode: code.toUpperCase() }
      ],
      status: 'delayed',
      scheduledDeparture: { $gte: today, $lt: tomorrow },
      isActive: true
    });

    const cancelledFlights = await Flight.countDocuments({
      $or: [
        { type: 'departure', originAirportCode: code.toUpperCase() },
        { type: 'arrival', destinationAirportCode: code.toUpperCase() }
      ],
      status: 'cancelled',
      scheduledDeparture: { $gte: today, $lt: tomorrow },
      isActive: true
    });

    res.status(200).json({
      success: true,
      data: {
        airport: {
          code: airport.code,
          name: airport.name,
          city: airport.city
        },
        stats: {
          departuresToday,
          arrivalsToday,
          totalFlightsToday: departuresToday + arrivalsToday,
          delayedFlights,
          cancelledFlights
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};