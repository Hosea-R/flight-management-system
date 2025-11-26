const mongoose = require('mongoose');

const AirportSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Le code IATA est requis'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [3, 'Le code IATA doit contenir 3 caractères'],
    maxlength: [3, 'Le code IATA doit contenir 3 caractères'],
    match: [/^[A-Z]{3}$/, 'Le code IATA doit contenir 3 lettres majuscules']
  },
  name: {
    type: String,
    required: [true, 'Le nom de l\'aéroport est requis'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'La ville est requise'],
    trim: true
  },
  region: {
    type: String,
    required: [true, 'La région est requise'],
    trim: true
  },
  isCentral: {
    type: Boolean,
    default: false
  },
  coordinates: {
    latitude: {
      type: Number,
      required: [true, 'La latitude est requise'],
      min: -25,  // Sud de Madagascar
      max: -12   // Nord de Madagascar
    },
    longitude: {
      type: Number,
      required: [true, 'La longitude est requise'],
      min: 43,   // Ouest de Madagascar
      max: 51    // Est de Madagascar
    }
  },
  contact: {
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour optimiser les recherches
AirportSchema.index({ city: 1 });
AirportSchema.index({ isActive: 1 });
AirportSchema.index({ isCentral: 1 });

// Méthode statique : Obtenir l'aéroport central (Antananarivo)
AirportSchema.statics.getCentralAirport = function() {
  return this.findOne({ isCentral: true, isActive: true });
};

// Méthode statique : Obtenir tous les aéroports actifs
AirportSchema.statics.getActiveAirports = function() {
  return this.find({ isActive: true }).sort({ city: 1 });
};

// Méthode statique : Obtenir les aéroports régionaux (non centraux)
AirportSchema.statics.getRegionalAirports = function() {
  return this.find({ isCentral: false, isActive: true }).sort({ city: 1 });
};

// Virtuel : Nom complet (code + nom + ville)
AirportSchema.virtual('fullName').get(function() {
  return `${this.code} - ${this.name} (${this.city})`;
});

// S'assurer que les virtuels sont inclus dans les résultats JSON
AirportSchema.set('toJSON', { virtuals: true });
AirportSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Airport', AirportSchema);