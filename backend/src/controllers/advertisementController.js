const Advertisement = require('../models/Advertisement');
const { uploadImage, uploadVideo, deleteMedia } = require('../services/cloudinaryService');
const logger = require('../config/logger');

/**
 * Récupérer toutes les publicités avec filtres
 */
exports.getAllAdvertisements = async (req, res) => {
  try {
    const { type, isActive, airport, showExpired } = req.query;
    
    const filter = {};
    
    if (type) filter.type = type;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    if (airport) {
      filter.$or = [
        { showOnAllAirports: true },
        { airports: airport }
      ];
    }
    
    // Filter par dates si on ne veut pas les expirées
    if (showExpired !== 'true') {
      const now = new Date();
      filter.startDate = { $lte: now };
      filter.$or = filter.$or || [];
      filter.$or.push(
        { endDate: { $exists: false } },
        { endDate: null },
        { endDate: { $gte: now } }
      );
    }
    
    const advertisements = await Advertisement.find(filter)
      .populate('createdBy', 'username email')
      .sort({ priority: 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: advertisements,
      count: advertisements.length
    });
  } catch (error) {
    logger.error('Error fetching advertisements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des publicités'
    });
  }
};

/**
 * Récupérer les publicités actives pour un aéroport (pour affichage public)
 */
exports.getActiveAdvertisements = async (req, res) => {
  try {
    const { airportCode } = req.params;
    
    const advertisements = await Advertisement.getActiveForAirport(airportCode);
    
    res.json({
      success: true,
      data: advertisements,
      count: advertisements.length
    });
  } catch (error) {
    logger.error('Error fetching active advertisements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des publicités actives'
    });
  }
};

/**
 * Récupérer une publicité par ID
 */
exports.getAdvertisementById = async (req, res) => {
  try {
    const advertisement = await Advertisement.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Publicité non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: advertisement
    });
  } catch (error) {
    logger.error('Error fetching advertisement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la publicité'
    });
  }
};

/**
 * Créer une nouvelle publicité avec upload de média
 */
exports.createAdvertisement = async (req, res) => {
  try {
    const { type, title, textContent, duration, priority, startDate, endDate, airports, showOnAllAirports } = req.body;
    
    let mediaData = {};
    
    // Upload du média si image ou vidéo
    if (type === 'image' && req.file) {
      const uploadResult = await uploadImage(req.file.path);
      mediaData = {
        mediaUrl: uploadResult.url,
        cloudinaryId: uploadResult.publicId
      };
    } else if (type === 'video' && req.file) {
      const uploadResult = await uploadVideo(req.file.path);
      mediaData = {
        mediaUrl: uploadResult.url,
        cloudinaryId: uploadResult.publicId
      };
    }
    
    // Créer la publicité
    const advertisement = new Advertisement({
      type,
      title,
      textContent: type === 'text' ? textContent : undefined,
      ...mediaData,
      duration: parseInt(duration) || 10,
      priority: parseInt(priority) || 5,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      airports: airports ? JSON.parse(airports) : [],
      showOnAllAirports: showOnAllAirports === 'true',
      createdBy: req.user.id
    });
    
    await advertisement.save();
    
    logger.info(`Advertisement created: ${advertisement._id} by user ${req.user.id}`);
    
    res.status(201).json({
      success: true,
      data: advertisement,
      message: 'Publicité créée avec succès'
    });
  } catch (error) {
    logger.error('Error creating advertisement:', error);
    
    // Cleanup Cloudinary si erreur
    if (req.file && error.cloudinaryId) {
      await deleteMedia(error.cloudinaryId, req.body.type);
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la publicité'
    });
  }
};

/**
 * Mettre à jour une publicité
 */
exports.updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, textContent, duration, priority, startDate, endDate, airports, showOnAllAirports, isActive } = req.body;
    
    const advertisement = await Advertisement.findById(id);
    
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Publicité non trouvée'
      });
    }
    
    // Si nouveau fichier uploadé, remplacer le média
    if (req.file) {
      // Supprimer l'ancien média de Cloudinary
      if (advertisement.cloudinaryId) {
        await deleteMedia(advertisement.cloudinaryId, advertisement.type);
      }
      
      // Upload du nouveau média
      let uploadResult;
      if (advertisement.type === 'image') {
        uploadResult = await uploadImage(req.file.path);
      } else if (advertisement.type === 'video') {
        uploadResult = await uploadVideo(req.file.path);
      }
      
      advertisement.mediaUrl = uploadResult.url;
      advertisement.cloudinaryId = uploadResult.publicId;
    }
    
    // Mettre à jour les autres champs
    if (title) advertisement.title = title;
    if (textContent && advertisement.type === 'text') advertisement.textContent = textContent;
    if (duration) advertisement.duration = parseInt(duration);
    if (priority) advertisement.priority = parseInt(priority);
    if (startDate) advertisement.startDate = startDate;
    if (endDate !== undefined) advertisement.endDate = endDate;
    if (airports) advertisement.airports = JSON.parse(airports);
    if (showOnAllAirports !== undefined) advertisement.showOnAllAirports = showOnAllAirports === 'true';
    if (isActive !== undefined) advertisement.isActive = isActive === 'true';
    
    await advertisement.save();
    
    logger.info(`Advertisement updated: ${id} by user ${req.user.id}`);
    
    res.json({
      success: true,
      data: advertisement,
      message: 'Publicité mise à jour avec succès'
    });
  } catch (error) {
    logger.error('Error updating advertisement:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour de la publicité'
    });
  }
};

/**
 * Supprimer une publicité
 */
exports.deleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const advertisement = await Advertisement.findById(id);
    
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Publicité non trouvée'
      });
    }
    
    // Supprimer le média de Cloudinary si existe
    if (advertisement.cloudinaryId) {
      await deleteMedia(advertisement.cloudinaryId, advertisement.type);
    }
    
    await Advertisement.findByIdAndDelete(id);
    
    logger.info(`Advertisement deleted: ${id} by user ${req.user.id}`);
    
    res.json({
      success: true,
      message: 'Publicité supprimée avec succès'
    });
  } catch (error) {
    logger.error('Error deleting advertisement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la publicité'
    });
  }
};

/**
 * Incrémenter le compteur de vues
 */
exports.incrementViewCount = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Advertisement.findByIdAndUpdate(id, {
      $inc: { viewCount: 1 }
    });
    
    res.json({
      success: true
    });
  } catch (error) {
    logger.error('Error incrementing view count:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du compteur'
    });
  }
};
