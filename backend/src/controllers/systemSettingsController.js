const SystemSettings = require('../models/SystemSettings');
const logger = require('../config/logger');

/**
 * Récupérer un paramètre système par clé
 */
exports.getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    const setting = await SystemSettings.findOne({ key });
    
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Paramètre non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: setting
    });
  } catch (error) {
    logger.error('Error fetching system setting:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du paramètre'
    });
  }
};

/**
 * Mettre à jour un paramètre système
 */
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    
    const setting = await SystemSettings.findOneAndUpdate(
      { key },
      { 
        value,
        ...(description && { description }),
        updatedBy: req.user.id
      },
      { 
        new: true,
        upsert: true
      }
    );
    
    logger.info(`System setting updated: ${key} by user ${req.user.id}`);
    
    res.json({
      success: true,
      data: setting,
      message: 'Paramètre mis à jour avec succès'
    });
  } catch (error) {
    logger.error('Error updating system setting:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du paramètre'
    });
  }
};

/**
 * Basculer le mode urgence des publicités
 */
exports.toggleAdsEmergency = async (req, res) => {
  try {
    const key = 'adsEmergencyDisabled';
    
    // Récupérer le paramètre actuel ou créer avec valeur par défaut false
    const currentSetting = await SystemSettings.getOrCreate(
      key, 
      false, 
      'Mode urgence pour désactiver toutes les publicités sur les écrans publics'
    );
    
    // Inverser la valeur
    const newValue = !currentSetting.value;
    
    const setting = await SystemSettings.updateSetting(key, newValue, req.user.id);
    
    logger.info(`Ads emergency mode ${newValue ? 'ENABLED' : 'DISABLED'} by user ${req.user.id}`);
    
    res.json({
      success: true,
      data: setting,
      message: `Publicités ${newValue ? 'désactivées' : 'activées'} sur les écrans publics`
    });
  } catch (error) {
    logger.error('Error toggling ads emergency:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du basculement du mode urgence'
    });
  }
};
