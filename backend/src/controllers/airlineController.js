const { Airline } = require('../models');

// @desc    Obtenir toutes les compagnies aériennes
// @route   GET /api/airlines
// @access  Private
exports.getAllAirlines = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    // Construire le filtre
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const airlines = await Airline.find(filter).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: airlines.length,
      data: airlines
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des compagnies:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des compagnies',
      error: error.message
    });
  }
};

// @desc    Obtenir une compagnie par son code
// @route   GET /api/airlines/:code
// @access  Private
exports.getAirlineByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const airline = await Airline.findOne({ code: code.toUpperCase() });

    if (!airline) {
      return res.status(404).json({
        success: false,
        message: `Aucune compagnie trouvée avec le code ${code}`
      });
    }

    res.status(200).json({
      success: true,
      data: airline
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la compagnie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la compagnie',
      error: error.message
    });
  }
};

// @desc    Créer une nouvelle compagnie aérienne
// @route   POST /api/airlines
// @access  Private (SuperAdmin uniquement)
exports.createAirline = async (req, res) => {
  try {
    const { code, name, fullName, logo } = req.body;

    // Vérifier si la compagnie existe déjà
    const existingAirline = await Airline.findOne({ code: code.toUpperCase() });
    
    if (existingAirline) {
      // Si elle existe mais est inactive (supprimée), on la réactive et on met à jour
      if (!existingAirline.isActive) {
        existingAirline.isActive = true;
        existingAirline.name = name;
        existingAirline.fullName = fullName || name;
        existingAirline.logo = logo;
        await existingAirline.save();

        // Émettre un événement Socket.io
        const io = req.app.get('io');
        io.emit('airline:created', existingAirline);

        return res.status(201).json({
          success: true,
          message: 'Compagnie réactivée avec succès',
          data: existingAirline
        });
      }

      // Si elle existe et est active, erreur
      return res.status(400).json({
        success: false,
        message: `Une compagnie avec le code ${code} existe déjà`
      });
    }

    const airline = await Airline.create({
      code: code.toUpperCase(),
      name,
      fullName: fullName || name,
      logo
    });

    // Émettre un événement Socket.io
    const io = req.app.get('io');
    io.emit('airline:created', airline);

    res.status(201).json({
      success: true,
      message: 'Compagnie créée avec succès',
      data: airline
    });

  } catch (error) {
    console.error('Erreur lors de la création de la compagnie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la compagnie',
      error: error.message
    });
  }
};

// @desc    Mettre à jour une compagnie aérienne
// @route   PUT /api/airlines/:code
// @access  Private (SuperAdmin uniquement)
exports.updateAirline = async (req, res) => {
  try {
    const { code } = req.params;
    const updates = req.body;

    // Ne pas permettre de modifier le code
    delete updates.code;

    const airline = await Airline.findOneAndUpdate(
      { code: code.toUpperCase() },
      updates,
      { new: true, runValidators: true }
    );

    if (!airline) {
      return res.status(404).json({
        success: false,
        message: `Aucune compagnie trouvée avec le code ${code}`
      });
    }

    // Émettre un événement Socket.io
    const io = req.app.get('io');
    io.emit('airline:updated', airline);

    res.status(200).json({
      success: true,
      message: 'Compagnie mise à jour avec succès',
      data: airline
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la compagnie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la compagnie',
      error: error.message
    });
  }
};

// @desc    Supprimer (désactiver) une compagnie aérienne
// @route   DELETE /api/airlines/:code
// @access  Private (SuperAdmin uniquement)
exports.deleteAirline = async (req, res) => {
  try {
    const { code } = req.params;

    const airline = await Airline.findOne({ code: code.toUpperCase() });

    if (!airline) {
      return res.status(404).json({
        success: false,
        message: `Aucune compagnie trouvée avec le code ${code}`
      });
    }

    // Ne pas supprimer physiquement, juste désactiver
    airline.isActive = false;
    await airline.save();

    // Émettre un événement Socket.io
    const io = req.app.get('io');
    io.emit('airline:deleted', { code: airline.code });

    res.status(200).json({
      success: true,
      message: 'Compagnie désactivée avec succès',
      data: airline
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la compagnie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la compagnie',
      error: error.message
    });
  }
};