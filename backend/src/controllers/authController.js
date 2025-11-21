const { User } = require('../models');

// @desc    Inscription d'un nouvel utilisateur (admin uniquement)
// @route   POST /api/auth/register
// @access  Private (SuperAdmin uniquement)
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, airportCode } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Vérifier que seul un superadmin peut créer des utilisateurs
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Seul un superadmin peut créer des utilisateurs'
      });
    }

    // Validation du rôle
    if (!['superadmin', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rôle invalide. Doit être "superadmin" ou "admin"'
      });
    }

    // Si c'est un admin régional, airportCode est requis
    if (role === 'admin' && !airportCode) {
      return res.status(400).json({
        success: false,
        message: 'Le code d\'aéroport est requis pour un admin régional'
      });
    }

    // Si c'est un superadmin, airportCode ne doit pas être fourni
    if (role === 'superadmin' && airportCode) {
      return res.status(400).json({
        success: false,
        message: 'Un superadmin ne doit pas avoir de code d\'aéroport'
      });
    }

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role,
      airportCode: role === 'admin' ? airportCode : null
    });

    // Générer le token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          airportCode: user.airportCode
        },
        token
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur',
      error: error.message
    });
  }
};

// @desc    Connexion d'un utilisateur
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir un email et un mot de passe'
      });
    }

    // Chercher l'utilisateur avec le password (select: false par défaut)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si l'utilisateur est actif
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Votre compte a été désactivé. Contactez un administrateur.'
      });
    }

    // Vérifier le mot de passe
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Mettre à jour lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Générer le token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          airportCode: user.airportCode,
          lastLogin: user.lastLogin
        },
        token
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion',
      error: error.message
    });
  }
};

// @desc    Obtenir l'utilisateur connecté
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // req.user est ajouté par le middleware auth
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          airportCode: user.airportCode,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil',
      error: error.message
    });
  }
};

// @desc    Déconnexion (côté client surtout)
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    // Pour JWT, la déconnexion se fait principalement côté client
    // en supprimant le token du localStorage
    // Ici on peut juste confirmer la déconnexion

    res.status(200).json({
      success: true,
      message: 'Déconnexion réussie',
      data: {}
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion',
      error: error.message
    });
  }
};