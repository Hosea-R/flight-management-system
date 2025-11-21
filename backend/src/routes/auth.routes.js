const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getMe,
  logout
} = require('../controllers/authController');

const {
  protect,
  authorize
} = require('../middleware/auth.middleware');

const {
  validateRegister,
  validateLogin
} = require('../middleware/validate.middleware');

// Routes publiques
router.post('/login', validateLogin, login);
router.post('/logout', logout);

// Routes protégées
router.post('/register', protect, authorize('superadmin'), validateRegister, register);
router.get('/me', protect, getMe);

module.exports = router;