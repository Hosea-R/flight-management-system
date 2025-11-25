const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const advertisementController = require('../controllers/advertisementController');
const { protect, authorize } = require('../middleware/auth.middleware');
const { canManageAdvertisement, checkAirportAccess, checkContractValidity } = require('../middleware/advertisement.middleware');

// Configuration de multer pour l'upload temporaire
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/temp/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Types de fichiers acceptés
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  
  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non supporté. Utilisez JPG, PNG, WebP, MP4, WebM, MOV, ou AVI.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB max
  }
});

// Routes publiques (pour les affichages FIDS)
router.get('/active/:airportCode', advertisementController.getActiveAdvertisements);
router.post('/:id/view', advertisementController.incrementViewCount);

// Routes protégées (admin/superadmin/ad-manager)
router.use(protect);
router.use(authorize('admin', 'superadmin', 'ad-manager'));

router.get('/', advertisementController.getAllAdvertisements);
router.get('/:id', advertisementController.getAdvertisementById);

// Création avec validation
router.post('/', 
  upload.single('media'), 
  checkAirportAccess,
  checkContractValidity,
  advertisementController.createAdvertisement
);

// Modification avec vérification de propriété
router.put('/:id', 
  canManageAdvertisement,
  upload.single('media'),
  checkContractValidity,
  advertisementController.updateAdvertisement
);

// Suppression avec vérification de propriété
router.delete('/:id', 
  canManageAdvertisement,
  advertisementController.deleteAdvertisement
);

module.exports = router;
