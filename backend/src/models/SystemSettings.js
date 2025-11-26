const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  // Clé unique du paramètre
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Valeur du paramètre (flexible pour différents types)
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Description du paramètre
  description: {
    type: String,
    trim: true
  },
  
  // Utilisateur ayant effectué la dernière modification
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Méthode statique pour récupérer ou créer un paramètre avec valeur par défaut
systemSettingsSchema.statics.getOrCreate = async function(key, defaultValue, description = '') {
  let setting = await this.findOne({ key });
  
  if (!setting) {
    setting = await this.create({
      key,
      value: defaultValue,
      description
    });
  }
  
  return setting;
};

// Méthode statique pour mettre à jour un paramètre
systemSettingsSchema.statics.updateSetting = async function(key, value, userId) {
  const setting = await this.findOneAndUpdate(
    { key },
    { 
      value, 
      updatedBy: userId 
    },
    { 
      new: true, 
      upsert: true 
    }
  );
  
  return setting;
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
