const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Générer un mot de passe temporaire aléatoire
const generateTemporaryPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// @desc    Liste tous les admins (pas les superadmins)
// @route   GET /api/users
// @access  SuperAdmin only
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'admin' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Erreur getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
};

// @desc    Détails d'un admin
// @route   GET /api/users/:id
// @access  SuperAdmin only
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erreur getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur'
    });
  }
};

// @desc    Créer un admin régional
// @route   POST /api/users
// @access  SuperAdmin only
exports.createAdmin = async (req, res) => {
  try {
    const { email, firstName, lastName, airportCode } = req.body;

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Générer un mot de passe temporaire
    const temporaryPassword = generateTemporaryPassword();

    // Créer l'admin (le middleware pre-save du modèle hashera automatiquement le password)
    const user = await User.create({
      email,
      password: temporaryPassword,
      firstName,
      lastName,
      role: 'admin',
      airportCode,
      isActive: true
    });

    // Retourner l'admin créé avec le mot de passe temporaire
    res.status(201).json({
      success: true,
      message: 'Admin créé avec succès',
      data: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        airportCode: user.airportCode,
        isActive: user.isActive,
        temporaryPassword // Important : à afficher une seule fois
      }
    });
  } catch (error) {
    console.error('Erreur createAdmin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'admin'
    });
  }
};

// @desc    Modifier un admin
// @route   PUT /api/users/:id
// @access  SuperAdmin only
exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, airportCode } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la modification du rôle et de l'email
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.airportCode = airportCode || user.airportCode;

    await user.save();

    res.json({
      success: true,
      message: 'Utilisateur modifié avec succès',
      data: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        airportCode: user.airportCode,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Erreur updateUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de l\'utilisateur'
    });
  }
};

// @desc    Supprimer un admin
// @route   DELETE /api/users/:id
// @access  SuperAdmin only
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la suppression d'un superadmin
    if (user.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Impossible de supprimer un superadmin'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });
  } catch (error) {
    console.error('Erreur deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'utilisateur'
    });
  }
};

// @desc    Activer/Désactiver un admin
// @route   PATCH /api/users/:id/toggle-status
// @access  SuperAdmin only
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Empêcher la désactivation d'un superadmin
    if (user.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Impossible de désactiver un superadmin'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `Utilisateur ${user.isActive ? 'activé' : 'désactivé'} avec succès`,
      data: {
        _id: user._id,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Erreur toggleUserStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de statut'
    });
  }
};
