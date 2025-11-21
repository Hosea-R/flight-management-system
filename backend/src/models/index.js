// Exporter tous les modèles depuis un seul fichier
const mongoose = require('mongoose');

// Import des modèles
const UserSchema = require('./User');
const AirportSchema = require('./Airport');
const AirlineSchema = require('./Airline');
const FlightSchema = require('./Flight');

// Créer les modèles Mongoose
const User = mongoose.model('User', UserSchema);
const Airport = mongoose.model('Airport', AirportSchema);
const Airline = mongoose.model('Airline', AirlineSchema);
const Flight = mongoose.model('Flight', FlightSchema);

// Exporter les modèles
module.exports = {
  User,
  Airport,
  Airline,
  Flight,
  
  // Exporter aussi les schémas pour référence
  schemas: {
    UserSchema,
    AirportSchema,
    AirlineSchema,
    FlightSchema
  },
  
  // Helper pour initialiser tous les modèles
  initializeModels: function() {
    return {
      User,
      Airport,
      Airline,
      Flight
    };
  }
};