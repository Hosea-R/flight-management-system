const express = require('express');
const router = express.Router();

const {
  getAllAirports,
  getAirportByCode,
  createAirport,
  updateAirport,
  deleteAirport,
  getAirportStats
} = require('../controllers/airportController');

const {
  protect,
  authorize
} = require('../middleware/auth.middleware');

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', protect, getAllAirports);
router.get('/:code', protect, getAirportByCode);
router.get('/:code/stats', protect, getAirportStats);

// Routes réservées au SuperAdmin
router.post('/', protect, authorize('superadmin'), createAirport);
router.put('/:code', protect, authorize('superadmin'), updateAirport);
router.delete('/:code', protect, authorize('superadmin'), deleteAirport);

module.exports = router;