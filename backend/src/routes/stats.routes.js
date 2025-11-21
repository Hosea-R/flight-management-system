const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth.middleware');

// Stats globales (SuperAdmin uniquement)
router.get('/global', protect, authorize('superadmin'), statsController.getGlobalStats);

// Stats d'un aéroport (Admin pour son aéroport, SuperAdmin pour tous)
router.get('/airport/:airportCode', protect, statsController.getAirportStats);

module.exports = router;
