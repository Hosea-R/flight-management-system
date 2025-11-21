const express = require('express');
const router = express.Router();

const {
  getAllAirlines,
  getAirlineByCode,
  createAirline,
  updateAirline,
  deleteAirline
} = require('../controllers/airlineController');

const {
  protect,
  authorize
} = require('../middleware/auth.middleware');

// Routes accessibles à tous les utilisateurs authentifiés
router.get('/', protect, getAllAirlines);
router.get('/:code', protect, getAirlineByCode);

// Routes réservées au SuperAdmin
router.post('/', protect, authorize('superadmin'), createAirline);
router.put('/:code', protect, authorize('superadmin'), updateAirline);
router.delete('/:code', protect, authorize('superadmin'), deleteAirline);

module.exports = router;