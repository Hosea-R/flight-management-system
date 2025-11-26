const Advertisement = require('../models/Advertisement');
const SystemSettings = require('../models/SystemSettings');
const { uploadImage, uploadVideo, uploadPDF, deleteMedia } = require('../services/cloudinaryService');
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
    
    // Vérifier le mode urgence
    const emergencySetting = await SystemSettings.findOne({ key: 'adsEmergencyDisabled' });
    if (emergencySetting && emergencySetting.value === true) {
      // Mode urgence actif: ne retourner aucune publicité
      return res.json({
        success: true,
        data: [],
        count: 0,
        emergencyMode: true,
        message: 'Publicités désactivées en mode urgence'
      });
    }
    
    const advertisements = await Advertisement.getActiveForAirport(airportCode);
    
    // Filtrer côté serveur les pubs qui peuvent être affichées
    const displayableAds = advertisements.filter(ad => ad.canDisplay());
    
    res.json({
      success: true,
      data: displayableAds,
      count: displayableAds.length,
      emergencyMode: false
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
    const { 
      type, title, textContent, duration, priority, startDate, endDate, 
      airports, showOnAllAirports, isActive, displayMode,
      client, contract, alerts,
      displayLimit, displayHours, minDisplayInterval
    } = req.body;
    
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
    
    // Parser les données JSON si elles sont strings
    const parsedClient = client ? (typeof client === 'string' ? JSON.parse(client) : client) : undefined;
    const parsedContract = contract ? (typeof contract === 'string' ? JSON.parse(contract) : contract) : undefined;
    const parsedAlerts = alerts ? (typeof alerts === 'string' ? JSON.parse(alerts) : alerts) : undefined;
    const parsedDisplayHours = displayHours ? (typeof displayHours === 'string' ? JSON.parse(displayHours) : displayHours) : undefined;
    
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
      isActive: isActive !== undefined ? isActive === 'true' : true,
      displayMode: displayMode || 'half-screen',
      displayLimit: displayLimit ? parseInt(displayLimit) : undefined,
      displayHours: parsedDisplayHours,
      minDisplayInterval: minDisplayInterval ? parseInt(minDisplayInterval) : undefined,
      client: parsedClient,
      contract: parsedContract,
      alerts: parsedAlerts,
      createdBy: req.user.id
    });
    
    await advertisement.save();
    
    logger.info(`Advertisement created: ${advertisement._id} by user ${req.user.id}`);

    // Émettre l'événement Socket.IO
    const io = req.app.get('io');
    if (io) {
      if (advertisement.showOnAllAirports) {
        io.emit('advertisement:created', advertisement);
      } else if (advertisement.airports && advertisement.airports.length > 0) {
        advertisement.airports.forEach(airportCode => {
          io.to(airportCode).emit('advertisement:created', advertisement);
        });
        // Également émettre aux admins (GLOBAL)
        io.to('GLOBAL').emit('advertisement:created', advertisement);
      }
    }
    
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
    const { 
      title, textContent, duration, priority, startDate, endDate, 
      airports, showOnAllAirports, isActive, displayMode,
      client, contract, alerts,
      displayLimit, displayHours, minDisplayInterval
    } = req.body;
    
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
    if (displayMode) advertisement.displayMode = displayMode;
    
    // Mettre à jour les nouveaux champs de planification
    if (displayLimit !== undefined) {
      advertisement.displayLimit = displayLimit ? parseInt(displayLimit) : undefined;
    }
    if (displayHours) {
      const parsedDisplayHours = typeof displayHours === 'string' ? JSON.parse(displayHours) : displayHours;
      advertisement.displayHours = parsedDisplayHours;
    }
    if (minDisplayInterval !== undefined) {
      advertisement.minDisplayInterval = minDisplayInterval ? parseInt(minDisplayInterval) : undefined;
    }
    
    // Mettre à jour client, contract, alerts si fournis
    if (client) {
      const parsedClient = typeof client === 'string' ? JSON.parse(client) : client;
      advertisement.client = parsedClient;
    }
    
    if (contract) {
      const parsedContract = typeof contract === 'string' ? JSON.parse(contract) : contract;
      // Fusionner avec le contrat existant pour ne pas perdre les attachments
      advertisement.contract = {
        ...advertisement.contract,
        ...parsedContract
      };
    }
    
    if (alerts) {
      const parsedAlerts = typeof alerts === 'string' ? JSON.parse(alerts) : alerts;
      advertisement.alerts = parsedAlerts;
    }
    
    await advertisement.save();
    
    logger.info(`Advertisement updated: ${id} by user ${req.user.id}`);

    // Émettre l'événement Socket.IO
    const io = req.app.get('io');
    if (io) {
      if (advertisement.showOnAllAirports) {
        io.emit('advertisement:updated', advertisement);
      } else if (advertisement.airports && advertisement.airports.length > 0) {
        advertisement.airports.forEach(airportCode => {
          io.to(airportCode).emit('advertisement:updated', advertisement);
        });
        // Également émettre aux admins (GLOBAL)
        io.to('GLOBAL').emit('advertisement:updated', advertisement);
      }
    }
    
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

    // Émettre l'événement Socket.IO
    const io = req.app.get('io');
    if (io) {
      // Pour la suppression, on ne peut pas savoir facilement où elle était affichée si on ne l'a pas stocké avant
      // Mais on a l'objet 'advertisement' récupéré avant suppression
      if (advertisement.showOnAllAirports) {
        io.emit('advertisement:deleted', { id });
      } else if (advertisement.airports && advertisement.airports.length > 0) {
        advertisement.airports.forEach(airportCode => {
          io.to(airportCode).emit('advertisement:deleted', { id });
        });
        // Également émettre aux admins (GLOBAL)
        io.to('GLOBAL').emit('advertisement:deleted', { id });
      }
    }
    
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
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Chercher si une entrée existe pour aujourd'hui
    const advertisement = await Advertisement.findById(id);
    
    if (!advertisement) {
      return res.status(404).json({ success: false, message: 'Publicité non trouvée' });
    }
    
    // Incrémenter les compteurs ET mettre à jour lastDisplayedAt
    advertisement.viewCount += 1;
    advertisement.currentDisplays += 1;
    advertisement.lastDisplayedAt = new Date(); // Pour le contrôle de fréquence
    
    // Gestion de l'historique
    const historyIndex = advertisement.viewHistory.findIndex(h => 
      new Date(h.date).getTime() === today.getTime()
    );
    
    if (historyIndex >= 0) {
      advertisement.viewHistory[historyIndex].count += 1;
    } else {
      advertisement.viewHistory.push({
        date: today,
        count: 1
      });
    }
    
    await advertisement.save();
    
    res.json({
      success: true,
      data: { 
        viewCount: advertisement.viewCount,
        currentDisplays: advertisement.currentDisplays
      }
    });
  } catch (error) {
    logger.error('Error incrementing view count:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'incrémentation des vues'
    });
  }
};
/**
 * Récupérer les publicités avec alertes
 */
exports.getAdvertisementAlerts = async (req, res) => {
  try {
    const now = new Date();
    const advertisements = await Advertisement.find({
      isActive: true
    }).populate('createdBy', 'username email');

    const alerts = {
      expiring: [],
      quotaReached: [],
      expired: []
    };

    advertisements.forEach(ad => {
      // Vérifier expiration proche
      if (ad.alerts?.expirationWarning?.enabled) {
        const daysRemaining = ad.getDaysRemaining();
        const threshold = ad.alerts.expirationWarning.daysBeforeExpiry || 30;
        
        if (daysRemaining !== null && daysRemaining <= threshold && daysRemaining > 0) {
          alerts.expiring.push({
            ...ad.toObject(),
            daysRemaining,
            alertType: 'expiration'
          });
        }
      }

      // Vérifier quota
      if (ad.alerts?.quotaWarning?.enabled && ad.contract?.maxViews) {
        const percentage = (ad.viewCount / ad.contract.maxViews) * 100;
        const threshold = ad.alerts.quotaWarning.threshold || 90;
        
        if (percentage >= threshold) {
          alerts.quotaReached.push({
            ...ad.toObject(),
            quotaPercentage: Math.round(percentage),
            alertType: 'quota'
          });
        }
      }

      // Vérifier si expiré
      if (ad.endDate && ad.endDate < now) {
        alerts.expired.push({
          ...ad.toObject(),
          alertType: 'expired'
        });
      }
    });

    const totalAlerts = alerts.expiring.length + alerts.quotaReached.length + alerts.expired.length;

    res.json({
      success: true,
      data: alerts,
      count: totalAlerts
    });
  } catch (error) {
    logger.error('Error fetching advertisement alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des alertes'
    });
  }
};

/**
 * Upload un PDF de contrat
 */
exports.uploadContractPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body; // Nom du document
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }
    
    const advertisement = await Advertisement.findById(id);
    
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Publicité non trouvée'
      });
    }
    
    // Upload du PDF vers Cloudinary
    const uploadResult = await uploadPDF(req.file.path);
    
    // Ajouter l'attachment au contrat
    if (!advertisement.contract) {
      advertisement.contract = {};
    }
    if (!advertisement.contract.attachments) {
      advertisement.contract.attachments = [];
    }
    
    advertisement.contract.attachments.push({
      name: name || req.file.originalname,
      url: uploadResult.url,
      cloudinaryId: uploadResult.publicId,
      uploadedAt: new Date()
    });
    
    await advertisement.save();
    
    logger.info(`PDF uploaded for advertisement ${id}`);
    
    res.json({
      success: true,
      data: advertisement.contract.attachments,
      message: 'PDF ajouté avec succès'
    });
  } catch (error) {
    logger.error('Error uploading PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'upload du PDF'
    });
  }
};

/**
 * Supprimer un PDF de contrat
 */
exports.deleteContractPDF = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    
    const advertisement = await Advertisement.findById(id);
    
    if (!advertisement) {
      return res.status(404).json({
        success: false,
        message: 'Publicité non trouvée'
      });
    }
    
    // Trouver l'attachment
    const attachment = advertisement.contract?.attachments?.find(
      att => att._id.toString() === attachmentId
    );
    
    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Pièce jointe non trouvée'
      });
    }
    
    // Supprimer de Cloudinary
    await deleteMedia(attachment.cloudinaryId, 'raw');
    
    // Retirer du tableau
    advertisement.contract.attachments = advertisement.contract.attachments.filter(
      att => att._id.toString() !== attachmentId
    );
    
    await advertisement.save();
    
    logger.info(`PDF deleted from advertisement ${id}`);
    
    res.json({
      success: true,
      message: 'PDF supprimé avec succès'
    });
  } catch (error) {
    logger.error('Error deleting PDF:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la suppression du PDF'
    });
  }
};
