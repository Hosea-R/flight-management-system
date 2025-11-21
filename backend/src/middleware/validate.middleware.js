const { body, validationResult } = require('express-validator');

// Middleware pour gérer les erreurs de validation
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreurs de validation',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg
      }))
    });
  }
  
  next();
};

// Validations pour l'inscription
exports.validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('Le prénom est requis')
    .isLength({ min: 2 })
    .withMessage('Le prénom doit contenir au moins 2 caractères'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ min: 2 })
    .withMessage('Le nom doit contenir au moins 2 caractères'),
  
  body('role')
    .isIn(['superadmin', 'admin'])
    .withMessage('Le rôle doit être "superadmin" ou "admin"'),
  
  body('airportCode')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Le code d\'aéroport doit contenir 3 caractères')
    .isAlpha()
    .withMessage('Le code d\'aéroport doit contenir uniquement des lettres')
    .toUpperCase(),
  
  exports.handleValidationErrors
];

// Validations pour la connexion
exports.validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email invalide')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
  
  exports.handleValidationErrors
];