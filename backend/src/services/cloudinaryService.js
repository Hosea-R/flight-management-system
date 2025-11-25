const cloudinary = require('cloudinary').v2;

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload une image vers Cloudinary
 * @param {Buffer|String} file - Buffer du fichier ou chemin local
 * @param {String} folder - Dossier de destination (default: 'advertisements')
 * @returns {Promise<Object>} - Résultat de l'upload avec url et public_id
 */
const uploadImage = async (file, folder = 'advertisements/images') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      allowed_formats: ['jpg', 'png', 'webp', 'jpeg']
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    throw new Error(`Erreur upload image: ${error.message}`);
  }
};

/**
 * Upload une vidéo vers Cloudinary
 * @param {Buffer|String} file - Buffer du fichier ou chemin local
 * @param {String} folder - Dossier de destination
 * @returns {Promise<Object>} - Résultat de l'upload
 */
const uploadVideo = async (file, folder = 'advertisements/videos') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: folder,
      resource_type: 'video',
      transformation: [
        { quality: 'auto' },
        { format: 'mp4' }
      ],
      allowed_formats: ['mp4', 'webm', 'mov', 'avi']
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      duration: result.duration,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    throw new Error(`Erreur upload vidéo: ${error.message}`);
  }
};

/**
 * Upload un PDF vers Cloudinary
 * @param {Buffer|String} file - Buffer du fichier ou chemin local
 * @param {String} folder - Dossier de destination
 * @returns {Promise<Object>} - Résultat de l'upload
 */
const uploadPDF = async (file, folder = 'advertisements/contracts') => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: folder,
      resource_type: 'raw', // Pour les fichiers non-média (PDF, etc.)
      allowed_formats: ['pdf']
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes
    };
  } catch (error) {
    throw new Error(`Erreur upload PDF: ${error.message}`);
  }
};

/**
 * Supprime un média de Cloudinary
 * @param {String} publicId - ID public du média
 * @param {String} resourceType - Type de ressource ('image' ou 'video')
 * @returns {Promise<Object>} - Résultat de la suppression
 */
const deleteMedia = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true
    });

    return result;
  } catch (error) {
    throw new Error(`Erreur suppression média: ${error.message}`);
  }
};

/**
 * Récupère les infos d'un média
 * @param {String} publicId - ID public du média
 * @param {String} resourceType - Type de ressource
 * @returns {Promise<Object>} - Informations du média
 */
const getMediaInfo = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType
    });

    return result;
  } catch (error) {
    throw new Error(`Erreur récupération info média: ${error.message}`);
  }
};

/**
 * Génère une URL optimisée pour un média
 * @param {String} publicId - ID public du média
 * @param {Object} options - Options de transformation
 * @returns {String} - URL optimisée
 */
const getOptimizedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: 'auto:good',
    fetch_format: 'auto',
    ...options
  };

  return cloudinary.url(publicId, defaultOptions);
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadVideo,
  uploadPDF,
  deleteMedia,
  getMediaInfo,
  getOptimizedUrl
};
