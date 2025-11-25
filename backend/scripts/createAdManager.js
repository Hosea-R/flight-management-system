const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Charger les variables d'environnement
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

const createAdManager = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connecté à MongoDB');

    // Données du compte ad-manager
    const adManagerData = {
      email: 'admanager@fids.mg',
      password: 'AdManager2025!',
      firstName: 'Gestionnaire',
      lastName: 'Publicités',
      role: 'ad-manager',
      assignedAirports: ['TNR', 'NOS'], // Peut gérer Ivato et Fascene
      isActive: true
    };

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email: adManagerData.email });
    if (existingUser) {
      console.log('⚠️  Un utilisateur avec cet email existe déjà');
      
      // Mettre à jour le rôle si nécessaire
      if (existingUser.role !== 'ad-manager') {
        existingUser.role = 'ad-manager';
        existingUser.assignedAirports = adManagerData.assignedAirports;
        await existingUser.save();
        console.log('✅ Rôle mis à jour vers ad-manager');
      }
      
      console.log('\n📋 Compte existant:');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Rôle: ${existingUser.role}`);
      console.log(`   Aéroports: ${existingUser.assignedAirports.join(', ')}`);
      process.exit(0);
    }

    // Créer le nouvel utilisateur
    const user = new User(adManagerData);
    await user.save();

    console.log('\n✅ Compte Ad-Manager créé avec succès!\n');
    console.log('📋 Informations de connexion:');
    console.log('   ─────────────────────────────────');
    console.log(`   Email:    ${adManagerData.email}`);
    console.log(`   Password: ${adManagerData.password}`);
    console.log(`   Rôle:     ${adManagerData.role}`);
    console.log(`   Aéroports: ${adManagerData.assignedAirports.join(', ')}`);
    console.log('   ─────────────────────────────────\n');
    console.log('💡 Utilisez ces identifiants pour vous connecter');
    console.log('💡 Cet utilisateur ne peut gérer que les publicités\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

createAdManager();
