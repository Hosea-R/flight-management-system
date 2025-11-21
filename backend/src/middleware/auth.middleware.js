const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware pour protéger les routes (vérifier le JWT)
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Vérifier si le token est dans les headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extraire le token du header "Bearer TOKEN"
      token = req.headers.authorization.split(' ')[1];
    }

    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé. Aucun token fourni.'
      });
    }

    try {
      // Vérifier et décoder le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Récupérer l'utilisateur depuis la DB (sans le password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier si l'utilisateur est actif
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Votre compte a été désactivé'
        });
      }

      // Ajouter l'utilisateur à l'objet request
      req.user = user;
      next();

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

  } catch (error) {
    console.error('Erreur dans le middleware protect:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification',
      error: error.message
    });
  }
};

// Middleware pour autoriser uniquement certains rôles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource`
      });
    }
    next();
  };
};

// Middleware pour vérifier que l'admin gère son propre aéroport
exports.checkAirportAccess = (req, res, next) => {
  // SuperAdmin a accès à tout
  if (req.user.role === 'superadmin') {
    return next();
  }

  // Admin régional : vérifier l'accès à l'aéroport
  const airportCode = req.params.airportCode || req.body.originAirportCode;

  if (!airportCode) {
    return res.status(400).json({
      success: false,
      message: 'Code d\'aéroport manquant'
    });
  }

  if (req.user.airportCode !== airportCode) {
    return res.status(403).json({
      success: false,
      message: 'Vous n\'avez pas accès à cet aéroport'
    });
  }

  next();
};

// Alias pour compatibilité avec d'autres routes
exports.verifyToken = exports.protect;
exports.isSuperAdmin = exports.authorize('superadmin');