const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isSuperAdmin } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent authentification et rôle SuperAdmin
router.use(verifyToken);
router.use(isSuperAdmin);

// Routes CRUD
router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createAdmin);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.patch('/:id/toggle-status', userController.toggleUserStatus);

module.exports = router;
