const express = require('express');
const router = express.Router();
const systemSettingsController = require('../controllers/systemSettingsController');
const { protect, authorize } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent authentification admin ou superadmin
router.use(protect);
router.use(authorize('admin', 'superadmin'));

// Récupérer un paramètre
router.get('/:key', systemSettingsController.getSetting);

// Mettre à jour un paramètre
router.put('/:key', systemSettingsController.updateSetting);

// Toggle mode urgence publicités
router.post('/ads-emergency/toggle', systemSettingsController.toggleAdsEmergency);

module.exports = router;
