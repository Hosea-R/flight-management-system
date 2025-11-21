const mongoose = require('mongoose');

const FlightSchema = new mongoose.Schema({
  flightNumber: {
    type: String,
    required: [true, 'Le numéro de vol est requis'],
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9]{2,6}$/, 'Format de numéro de vol invalide']
  },
  
  // Référence vers la compagnie aérienne
  airlineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Airline',
    required: [true, 'La compagnie aérienne est requise']
  },
  
  // Type de vol (départ ou arrivée)
  type: {
    type: String,
    enum: ['departure', 'arrival'],
    required: [true, 'Le type de vol est requis']
  },
  
  // Aéroports (codes IATA)
  originAirportCode: {
    type: String,
    required: [true, 'L\'aéroport d\'origine est requis'],
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 3
  },
  
  destinationAirportCode: {
    type: String,
    required: [true, 'L\'aéroport de destination est requis'],
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 3
  },
  
  // Horaires de départ
  scheduledDeparture: {
    type: Date,
    required: [true, 'L\'heure de départ prévue est requise']
  },
  
  estimatedDeparture: {
    type: Date,
    default: null
  },
  
  actualDeparture: {
    type: Date,
    default: null
  },
  
  // Horaires d'arrivée
  scheduledArrival: {
    type: Date,
    required: [true, 'L\'heure d\'arrivée prévue est requise']
  },
  
  estimatedArrival: {
    type: Date,
    default: null
  },
  
  actualArrival: {
    type: Date,
    default: null
  },
  
  // Statut du vol
  status: {
    type: String,
    enum: [
      'scheduled',    // Programmé
      'on-time',      // À l'heure
      'delayed',      // Retardé
      'boarding',     // Embarquement
      'departed',     // Décollé
      'in-flight',    // En vol
      'landed',       // Atterri
      'cancelled'     // Annulé
    ],
    default: 'scheduled'
  },
  
  // Lien vers le vol jumeau (départ <-> arrivée)
  linkedFlightId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flight',
    default: null
  },
  
  // Informations sur l'avion
  aircraft: {
    type: {
      type: String,
      trim: true,
      default: null
    },
    registration: {
      type: String,
      uppercase: true,
      trim: true,
      default: null
    }
  },
  
  // Métadonnées
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  remarks: {
    type: String,
    trim: true,
    maxlength: [500, 'Les remarques ne peuvent pas dépasser 500 caractères']
  },
  
  // Pour l'historique et le nettoyage
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index composés pour optimiser les recherches
FlightSchema.index({ flightNumber: 1, scheduledDeparture: -1 });
FlightSchema.index({ originAirportCode: 1, scheduledDeparture: -1 });
FlightSchema.index({ destinationAirportCode: 1, scheduledArrival: -1 });
FlightSchema.index({ status: 1 });
FlightSchema.index({ linkedFlightId: 1 });
FlightSchema.index({ airlineId: 1 });
FlightSchema.index({ type: 1, originAirportCode: 1 });
FlightSchema.index({ type: 1, destinationAirportCode: 1 });
FlightSchema.index({ createdAt: -1 });

// Validation : L'heure d'arrivée doit être après l'heure de départ
FlightSchema.pre('validate', function(next) {
  if (this.scheduledArrival <= this.scheduledDeparture) {
    next(new Error('L\'heure d\'arrivée doit être postérieure à l\'heure de départ'));
  } else {
    next();
  }
});

// Validation : Origine et destination doivent être différentes
FlightSchema.pre('validate', function(next) {
  if (this.originAirportCode === this.destinationAirportCode) {
    next(new Error('L\'aéroport d\'origine et de destination doivent être différents'));
  } else {
    next();
  }
});

// Méthode statique : Obtenir les vols par aéroport et type
FlightSchema.statics.getFlightsByAirport = function(airportCode, type, filters = {}) {
  const query = { isActive: true };
  
  if (type === 'departure') {
    query.type = 'departure';
    query.originAirportCode = airportCode;
  } else if (type === 'arrival') {
    query.type = 'arrival';
    query.destinationAirportCode = airportCode;
  } else {
    // Les deux types
    query.$or = [
      { type: 'departure', originAirportCode: airportCode },
      { type: 'arrival', destinationAirportCode: airportCode }
    ];
  }
  
  // Ajouter les filtres supplémentaires (date, statut, etc.)
  Object.assign(query, filters);
  
  return this.find(query)
    .populate('airlineId', 'code name logo')
    .populate('createdBy', 'firstName lastName')
    .sort({ scheduledDeparture: 1 });
};

// Méthode statique : Obtenir les vols d'aujourd'hui
FlightSchema.statics.getTodayFlights = function(airportCode = null) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  const query = {
    isActive: true,
    scheduledDeparture: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  };
  
  if (airportCode) {
    query.$or = [
      { type: 'departure', originAirportCode: airportCode },
      { type: 'arrival', destinationAirportCode: airportCode }
    ];
  }
  
  return this.find(query)
    .populate('airlineId', 'code name logo')
    .sort({ scheduledDeparture: 1 });
};

// Méthode d'instance : Vérifier si le vol est en retard
FlightSchema.methods.isDelayed = function() {
  return this.status === 'delayed' || 
         (this.estimatedDeparture && this.estimatedDeparture > this.scheduledDeparture);
};

// Méthode d'instance : Calculer la durée du vol
FlightSchema.methods.getFlightDuration = function() {
  const departure = this.actualDeparture || this.estimatedDeparture || this.scheduledDeparture;
  const arrival = this.actualArrival || this.estimatedArrival || this.scheduledArrival;
  
  const durationMs = arrival - departure;
  const durationMinutes = Math.floor(durationMs / 1000 / 60);
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  
  return { hours, minutes, total: durationMinutes };
};

// Virtuel : Numéro de vol complet avec compagnie
FlightSchema.virtual('fullFlightNumber').get(function() {
  return this.airlineId ? `${this.airlineId.code}${this.flightNumber}` : this.flightNumber;
});

// S'assurer que les virtuels sont inclus dans les résultats JSON
FlightSchema.set('toJSON', { virtuals: true });
FlightSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Flight', FlightSchema);