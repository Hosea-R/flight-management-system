const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Routes publiques (pas d'authentification requise)
router.get('/flights/:airportCode/arrivals', publicController.getArrivals);
router.get('/flights/:airportCode/departures', publicController.getDepartures);
router.get('/flights/:airportCode/all', publicController.getAllFlights);

module.exports = router;
