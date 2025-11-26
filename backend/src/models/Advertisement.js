const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  // Type de publicité
  type: {
    type: String,
    enum: ['image', 'video', 'text'],
    required: true
  },
  
  // Titre/Description
  title: {
    type: String,
    required: true,
    trim: true
  },
  
  // Pour images et vidéos : URL Cloudinary
  mediaUrl: {
    type: String,
    required: function() {
      return this.type === 'image' || this.type === 'video';
    }
  },
  
  // ID Cloudinary pour la suppression
  cloudinaryId: {
    type: String,
    required: function() {
      return this.type === 'image' || this.type === 'video';
    }
  },
  
  // Pour les bandes de texte
  textContent: {
    type: String,
    required: function() {
      return this.type === 'text';
    }
  },
  
  // Durée d'affichage en secondes
  duration: {
    type: Number,
    required: true,
    default: 10,
    min: 3,
    max: 60
  },
  
  // Priorité d'affichage (1 = plus haute)
  priority: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },
  
  // Période de validité
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  endDate: {
    type: Date,
    required: false
  },
  
  // Ciblage par aéroport
  airports: [{
    type: String,
    ref: 'Airport'
  }],
  
  // Si vide, s'affiche sur tous les aéroports
  showOnAllAirports: {
    type: Boolean,
    default: true
  },
  
  // Mode d'affichage
  displayMode: {
    type: String,
    enum: ['half-screen', 'full-screen'],
    default: 'half-screen',
    required: true
  },
  
  // Statut
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Statistiques
  viewCount: {
    type: Number,
    default: 0
  },
  
  // Historique des vues par jour
  viewHistory: [{
    date: {
      type: Date,
      required: true
    },
    count: {
      type: Number,
      default: 1
    }
  }],
  
  // ===== PLANIFICATION AUTOMATIQUE =====
  
  // Quota d'affichages (nombre max)
  displayLimit: {
    type: Number,
    min: 0
  },
  
  // Compteur d'affichages actuels
  currentDisplays: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Plage horaire d'affichage (format 24h, ex: 8 = 8h00, 18 = 18h00)
  displayHours: {
    startHour: {
      type: Number,
      min: 0,
      max: 23
    },
    endHour: {
      type: Number,
      min: 0,
      max: 23
    }
  },
  
  // Intervalle minimum entre deux affichages (en secondes)
  minDisplayInterval: {
    type: Number,
    min: 0
  },
  
  // Dernière fois que la pub a été affichée
  lastDisplayedAt: {
    type: Date
  },
  
  // ===== DONNÉES CONTRACTUELLES =====
  
  // Informations client
  client: {
    name: {
      type: String,
      trim: true
    },
    company: {
      type: String,
      trim: true
    },
    contact: {
      email: String,
      phone: String
    }
  },
  
  // Contrat
  contract: {
    // Numéro de contrat unique
    number: {
      type: String,
      unique: true,
      sparse: true, // Permet null
      trim: true
    },
    
    // Tarification
    pricing: {
      type: {
        type: String,
        enum: ['fixed', 'per-view', 'per-day'],
        default: 'fixed'
      },
      amount: {
        type: Number,
        min: 0
      },
      currency: {
        type: String,
        default: 'MGA',
        enum: ['MGA', 'EUR', 'USD']
      },
      billingCycle: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly', 'one-time'],
        default: 'monthly'
      }
    },
    
    // Quotas
    maxViews: {
      type: Number,
      min: 0
    },
    maxDiffusionsPerDay: {
      type: Number,
      min: 0
    },
    
    // Statut du contrat
    status: {
      type: String,
      enum: ['draft', 'active', 'expired', 'cancelled', 'pending-renewal'],
      default: 'draft'
    },
    
    // Renouvellement
    autoRenew: {
      type: Boolean,
      default: false
    },
    
    signedDate: Date,
    
    // Pièces jointes (contrats PDF sur Cloudinary)
    attachments: [{
      name: String,
      url: String,
      cloudinaryId: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Alertes
  alerts: {
    expirationWarning: {
      enabled: {
        type: Boolean,
        default: true
      },
      daysBeforeExpiry: {
        type: Number,
        default: 30
      },
      notifyEmails: [String]
    },
    quotaWarning: {
      enabled: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        default: 90, // 90% du quota
        min: 0,
        max: 100
      },
      notifyEmails: [String]
    }
  },
  
  // Métadonnées
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index pour les requêtes fréquentes
advertisementSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
advertisementSchema.index({ airports: 1 });
advertisementSchema.index({ priority: -1 });

// Méthode pour vérifier si la pub est valide à une date donnée
advertisementSchema.methods.isValidAt = function(date = new Date()) {
  if (!this.isActive) return false;
  if (date < this.startDate) return false;
  if (this.endDate && date > this.endDate) return false;
  return true;
};

// Méthode pour vérifier si l'heure actuelle est dans la plage horaire autorisée
advertisementSchema.methods.isWithinDisplayHours = function(date = new Date()) {
  // Si pas de plage horaire définie, toujours autorisé
  if (!this.displayHours || 
      this.displayHours.startHour === undefined || 
      this.displayHours.endHour === undefined) {
    return true;
  }
  
  const currentHour = date.getHours();
  const { startHour, endHour } = this.displayHours;
  
  // Gérer le cas où la plage traverse minuit (ex: 22h à 6h)
  if (startHour <= endHour) {
    return currentHour >= startHour && currentHour < endHour;
  } else {
    return currentHour >= startHour || currentHour < endHour;
  }
};

// Méthode statique pour récupérer les pubs actives pour un aéroport
advertisementSchema.statics.getActiveForAirport = async function(airportCode) {
  const now = new Date();
  
  return this.find({
    isActive: true,
    startDate: { $lte: now },
    $and: [
      {
        $or: [
          { endDate: { $exists: false } },
          { endDate: null },
          { endDate: { $gte: now } }
        ]
      },
      {
        $or: [
          { showOnAllAirports: true },
          { airports: airportCode }
        ]
      }
    ]
  })
  .sort({ priority: 1, createdAt: -1 })
  .select('-__v');
};

// ===== MÉTHODES CONTRACTUELLES =====

// Calculer les jours restants  
advertisementSchema.methods.getDaysRemaining = function() {
  if (!this.endDate) return null; // Contrat illimité
  const now = new Date();
  const diff = this.endDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Vérifier si le quota est atteint
advertisementSchema.methods.isQuotaReached = function() {
  if (!this.contract?.maxViews) return false;
  return this.viewCount >= this.contract.maxViews;
};

// Calculer le % de progression
advertisementSchema.methods.getProgressPercentage = function() {
  if (this.contract?.maxViews) {
    return (this.viewCount / this.contract.maxViews) * 100;
  }
  
  if (this.endDate) {
    const total = this.endDate - this.startDate;
    const elapsed = new Date() - this.startDate;
    return (elapsed / total) * 100;
  }
  
  return 0;
};

// Calculer le revenu généré
advertisementSchema.methods.getRevenue = function() {
  if (!this.contract?.pricing) return 0;
  
  const { type, amount } = this.contract.pricing;
  
  switch (type) {
    case 'per-view':
      return this.viewCount * (amount || 0);
    case 'per-day':
      const daysElapsed = Math.ceil((new Date() - this.startDate) / (1000 * 60 * 60 * 24));
      return daysElapsed * (amount || 0);
    case 'fixed':
    default:
      return amount || 0;
  }
};

// Vérifier si expiration proche
advertisementSchema.methods.isExpiringSoon = function(daysThreshold = 30) {
  const daysRemaining = this.getDaysRemaining();
  if (daysRemaining === null) return false;
  return daysRemaining <= daysThreshold && daysRemaining > 0;
};

// Méthode pour vérifier si la pub peut être affichée
advertisementSchema.methods.canDisplay = function() {
  // Vérifier statut actif
  if (!this.isActive) return false;
  
  // Vérifier validité temporelle
  if (!this.isValidAt()) return false;
  
  // Vérifier quota du contrat
  if (this.isQuotaReached()) return false;
  
  // Vérifier statut du contrat
  if (this.contract?.status && this.contract.status !== 'active') return false;
  
  // Vérifier quota d'affichages automatique
  if (this.displayLimit && this.currentDisplays >= this.displayLimit) return false;
  
  // Vérifier plage horaire
  if (!this.isWithinDisplayHours()) return false;
  
  // Vérifier intervalle minimum entre affichages
  if (this.minDisplayInterval && this.lastDisplayedAt) {
    const now = new Date();
    const timeSinceLastDisplay = (now - this.lastDisplayedAt) / 1000; // en secondes
    if (timeSinceLastDisplay < this.minDisplayInterval) return false;
  }
  
  return true;
};

module.exports = mongoose.model('Advertisement', advertisementSchema);
