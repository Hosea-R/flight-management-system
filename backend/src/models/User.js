const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Veuillez fournir un email valide'
    ]
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false // Ne pas retourner le password par défaut
  },
  firstName: {
    type: String,
    required: [true, 'Le prénom est requis'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin'],
    default: 'admin'
  },
  airportCode: {
    type: String,
    uppercase: true,
    trim: true,
    // Requis seulement pour les admins régionaux
    validate: {
      validator: function(value) {
        // Si c'est un admin, airportCode est requis
        if (this.role === 'admin' && !value) {
          return false;
        }
        // Si c'est un superadmin, airportCode doit être null
        if (this.role === 'superadmin' && value) {
          return false;
        }
        return true;
      },
      message: 'Les admins régionaux doivent avoir un code d\'aéroport, les superadmins non'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true // Ajoute automatiquement createdAt et updatedAt
});

// Index pour optimiser les recherches
UserSchema.index({ email: 1 });
UserSchema.index({ airportCode: 1 });
UserSchema.index({ role: 1 });

// Middleware : Hasher le mot de passe avant de sauvegarder
UserSchema.pre('save', async function(next) {
  // Ne hasher que si le password a été modifié
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Générer un salt et hasher le password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthode : Comparer le mot de passe
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Méthode : Générer un JWT token
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      airportCode: this.airportCode 
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE
    }
  );
};

// Méthode : Retourner les données publiques de l'utilisateur (sans password)
UserSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', UserSchema);