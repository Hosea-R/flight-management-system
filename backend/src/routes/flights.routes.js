const express = require('express');
const router = express.Router();

const {
  createFlight,
  getAllFlights,
  getFlightById,
  getFlightsByAirport,
  updateFlightStatus,
  updateFlightDetails,
  cancelFlight,
  deleteFlight
} = require('../controllers/flightController');

const {
  protect,
  authorize
} = require('../middleware/auth.middleware');

// Routes de consultation (tous les utilisateurs authentifiés)
router.get('/', protect, getAllFlights);
router.get('/:id', protect, getFlightById);
router.get('/airport/:airportCode', protect, getFlightsByAirport);

// Routes de création et modification
router.post('/', protect, createFlight); // Admin peut créer depuis son aéroport
router.put('/:id', protect, updateFlightDetails); // Modifier les détails
router.patch('/:id/status', protect, updateFlightStatus); // Changer le statut
router.patch('/:id/cancel', protect, cancelFlight); // Annuler un vol
router.delete('/:id', protect, deleteFlight); // Supprimer (paire complète)

module.exports = router;