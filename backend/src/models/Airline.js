const mongoose = require('mongoose');

const AirlineSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Le code IATA de la compagnie est requis'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [2, 'Le code IATA doit contenir 2 caractères'],
    maxlength: [2, 'Le code IATA doit contenir 2 caractères'],
    match: [/^[A-Z0-9]{2}$/, 'Le code IATA doit contenir 2 caractères (lettres ou chiffres)']
  },
  name: {
    type: String,
    required: [true, 'Le nom de la compagnie est requis'],
    trim: true
  },
  fullName: {
    type: String,
    trim: true
  },
  logo: {
    type: String,
    trim: true,
    default: null // URL du logo
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index pour optimiser les recherches
AirlineSchema.index({ code: 1 }, { unique: true });
AirlineSchema.index({ name: 1 });
AirlineSchema.index({ isActive: 1 });

// Méthode statique : Obtenir toutes les compagnies actives
AirlineSchema.statics.getActiveAirlines = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

// Virtuel : Display name (code + nom)
AirlineSchema.virtual('displayName').get(function() {
  return `${this.code} - ${this.name}`;
});

// S'assurer que les virtuels sont inclus dans les résultats JSON
AirlineSchema.set('toJSON', { virtuals: true });
AirlineSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Airline', AirlineSchema);