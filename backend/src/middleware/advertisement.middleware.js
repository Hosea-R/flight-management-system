const Advertisement = require('../models/Advertisement');
const logger = require('../config/logger');

/**
 * Middleware pour vérifier si l'utilisateur peut gérer une publicité
 * - SuperAdmin: peut tout gérer
 * - Admin: peut tout gérer
 * - Ad-Manager: peut gérer seulement ses propres pubs
 */
exports.canManageAdvertisement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // SuperAdmin et Admin peuvent tout gérer
    if (user.role === 'superadmin' || user.role === 'admin') {
      return next();
    }

    // Ad-Manager ne peut gérer que ses propres pubs
    if (user.role === 'ad-manager') {
      const advertisement = await Advertisement.findById(id);

      if (!advertisement) {
        return res.status(404).json({
          success: false,
          message: 'Publicité non trouvée'
        });
      }

      // Vérifier la propriété
      if (advertisement.createdBy.toString() !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'Vous n\'avez pas la permission de gérer cette publicité'
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Error in canManageAdvertisement middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur de vérification des permissions'
    });
  }
};

/**
 * Middleware pour vérifier l'accès aux aéroports assignés
 * Si un ad-manager a des aéroports assignés, il ne peut créer des pubs que pour ces aéroports
 */
exports.checkAirportAccess = (req, res, next) => {
  const user = req.user;

  // Seulement pour les ad-managers avec des aéroports assignés
  if (user.role !== 'ad-manager' || !user.assignedAirports || user.assignedAirports.length === 0) {
    return next();
  }

  const { airports, showOnAllAirports } = req.body;

  // Si la pub est pour tous les aéroports, refuser
  if (showOnAllAirports === 'true' || showOnAllAirports === true) {
    return res.status(403).json({
      success: false,
      message: 'Vous ne pouvez pas créer de publicités pour tous les aéroports. Veuillez sélectionner parmi vos aéroports assignés.'
    });
  }

  // Vérifier que les aéroports demandés sont dans la liste assignée
  const requestedAirports = airports ? (Array.isArray(airports) ? airports : JSON.parse(airports)) : [];
  
  const unauthorized = requestedAirports.filter(
    code => !user.assignedAirports.includes(code.toUpperCase())
  );

  if (unauthorized.length > 0) {
    return res.status(403).json({
      success: false,
      message: `Vous n'avez pas accès aux aéroports suivants : ${unauthorized.join(', ')}`
    });
  }

  next();
};

/**
 * Middleware pour vérifier la validité du contrat
 * Vérifie les dates, quotas, etc.
 */
exports.checkContractValidity = (req, res, next) => {
  const { startDate, endDate, contract } = req.body;

  // Vérifier que endDate > startDate
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'La date de fin doit être postérieure à la date de début'
      });
    }
  }

  // Vérifier que le montant est positif
  if (contract && contract.pricing && contract.pricing.amount) {
    const amount = parseFloat(contract.pricing.amount);
    if (amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Le montant doit être positif'
      });
    }
  }

  // Vérifier que maxViews est positif si défini
  if (contract && contract.maxViews) {
    const maxViews = parseInt(contract.maxViews);
    if (maxViews < 0) {
      return res.status(400).json({
        success: false,
        message: 'Le quota de vues doit être positif'
      });
    }
  }

  next();
};

/**
 * Middleware pour vérifier que la pub peut encore être affichée
 * (pas de quota atteint, contrat valide, etc.)
 */
exports.checkDisplayable = async (req, res, next) => {
  try {
    const { id } = req.params;
    const advertisement = await Advertisement.findById(id);

    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Publicité non trouvée'
      });
    }

    if (!advertisement.canDisplay()) {
      return res.status(403).json({
        success: false,
        message: 'Cette publicité ne peut plus être affichée (quota atteint, contrat expiré, ou statut inactif)'
      });
    }

    req.advertisement = advertisement;
    next();
  } catch (error) {
    logger.error('Error in checkDisplayable middleware:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur de vérification de l\'affichabilité'
    });
  }
};
