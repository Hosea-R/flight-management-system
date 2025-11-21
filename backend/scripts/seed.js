const dotenv = require('dotenv');
const connectDB = require('../src/config/database');
const { User, Airport, Airline } = require('../src/models');

// Charger les variables d'environnement
dotenv.config();

// Données de seed
const seedData = async () => {
  try {
    // Connexion à la base de données
    await connectDB();

    console.log('🗑️  Nettoyage de la base de données...');
    
    // Supprimer toutes les données existantes
    await User.deleteMany({});
    await Airport.deleteMany({});
    await Airline.deleteMany({});

    console.log('✅ Base de données nettoyée');

    // Créer le SuperAdmin
    console.log('👤 Création du SuperAdmin...');
    const superadmin = await User.create({
      email: 'superadmin@aviation.mg',
      password: 'admin123',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin',
      isActive: true
    });
    console.log(`✅ SuperAdmin créé: ${superadmin.email}`);

    // Créer les aéroports de Madagascar
    console.log('✈️  Création des aéroports...');
    const airports = await Airport.insertMany([
      {
        code: 'TNR',
        name: 'Ivato International Airport',
        city: 'Antananarivo',
        region: 'Analamanga',
        isCentral: true,
        coordinates: { latitude: -18.7969, longitude: 47.4788 },
        contact: { phone: '+261 20 22 222 22', email: 'contact@ivato.mg' },
        isActive: true
      },
      {
        code: 'TMM',
        name: 'Toamasina Airport',
        city: 'Toamasina',
        region: 'Atsinanana',
        isCentral: false,
        coordinates: { latitude: -18.1095, longitude: 49.3925 },
        contact: { phone: '+261 20 53 333 33', email: 'contact@toamasina-airport.mg' },
        isActive: true
      },
      {
        code: 'DIE',
        name: 'Arrachart Airport',
        city: 'Antsiranana',
        region: 'Diana',
        isCentral: false,
        coordinates: { latitude: -12.3494, longitude: 49.2917 },
        contact: { phone: '+261 20 82 222 22', email: 'contact@diego-airport.mg' },
        isActive: true
      },
      {
        code: 'MJN',
        name: 'Amborovy Airport',
        city: 'Mahajanga',
        region: 'Boeny',
        isCentral: false,
        coordinates: { latitude: -15.6669, longitude: 46.3512 },
        contact: { phone: '+261 20 62 222 22', email: 'contact@majunga-airport.mg' },
        isActive: true
      },
      {
        code: 'FTU',
        name: 'Toliara Airport',
        city: 'Toliara',
        region: 'Atsimo-Andrefana',
        isCentral: false,
        coordinates: { latitude: -23.3834, longitude: 43.7285 },
        contact: { phone: '+261 20 94 444 44', email: 'contact@tulear-airport.mg' },
        isActive: true
      },
      {
        code: 'WVK',
        name: 'Manakara Airport',
        city: 'Manakara',
        region: 'Vatovavy-Fitovinany',
        isCentral: false,
        coordinates: { latitude: -22.1197, longitude: 48.0217 },
        isActive: true
      },
      {
        code: 'MOQ',
        name: 'Morondava Airport',
        city: 'Morondava',
        region: 'Menabe',
        isCentral: false,
        coordinates: { latitude: -20.2847, longitude: 44.3176 },
        isActive: true
      },
      {
        code: 'SMS',
        name: 'Sainte Marie Airport',
        city: 'Sainte Marie',
        region: 'Analanjirofo',
        isCentral: false,
        coordinates: { latitude: -17.0939, longitude: 49.8158 },
        isActive: true
      }
    ]);
    console.log(`✅ ${airports.length} aéroports créés`);

    // Créer les compagnies aériennes
    console.log('🛫 Création des compagnies aériennes...');
    const airlines = await Airline.insertMany([
      {
        code: 'MD',
        name: 'Air Madagascar',
        fullName: 'Société Nationale Air Madagascar',
        isActive: true
      },
      {
        code: 'TS',
        name: 'Tsaradia',
        fullName: 'Tsaradia Airlines',
        isActive: true
      }
    ]);
    console.log(`✅ ${airlines.length} compagnies aériennes créées`);

    // Créer quelques admins régionaux
    console.log('👥 Création des admins régionaux...');
    
    // Créer les admins un par un pour déclencher le hashing
    const admin1 = await User.create({
      email: 'admin.tana@aviation.mg',
      password: 'admin123',
      firstName: 'Rakoto',
      lastName: 'Jean',
      role: 'admin',
      airportCode: 'TNR',
      isActive: true
    });

    const admin2 = await User.create({
      email: 'admin.tamatave@aviation.mg',
      password: 'admin123',
      firstName: 'Rabe',
      lastName: 'Paul',
      role: 'admin',
      airportCode: 'TMM',
      isActive: true
    });

    const admin3 = await User.create({
      email: 'admin.diego@aviation.mg',
      password: 'admin123',
      firstName: 'Randria',
      lastName: 'Marie',
      role: 'admin',
      airportCode: 'DIE',
      isActive: true
    });

    console.log(`✅ 3 admins régionaux créés`);

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║      SEED TERMINÉ AVEC SUCCÈS ! 🎉        ║');
    console.log('╠════════════════════════════════════════════╣');
    console.log('║  Comptes créés:                            ║');
    console.log('║                                            ║');
    console.log('║  SuperAdmin:                               ║');
    console.log('║  📧 superadmin@aviation.mg                ║');
    console.log('║  🔑 admin123                              ║');
    console.log('║                                            ║');
    console.log('║  Admin Antananarivo (TNR):                 ║');
    console.log('║  📧 admin.tana@aviation.mg                ║');
    console.log('║  🔑 admin123                              ║');
    console.log('║                                            ║');
    console.log('║  Admin Toamasina (TMM):                    ║');
    console.log('║  📧 admin.tamatave@aviation.mg            ║');
    console.log('║  🔑 admin123                              ║');
    console.log('║                                            ║');
    console.log('║  Admin Antsiranana (DIE):                  ║');
    console.log('║  📧 admin.diego@aviation.mg               ║');
    console.log('║  🔑 admin123                              ║');
    console.log('╚════════════════════════════════════════════╝\n');

    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    process.exit(1);
  }
};

// Exécuter le seed
seedData();