# 🛫 Système de Gestion de Vols - Madagascar 🇲🇬

Application web complète de gestion de vols pour les aéroports nationaux de Madagascar.

## 📋 Description

Ce système permet de :
- Gérer les vols entrants et sortants de plusieurs aéroports
- Créer automatiquement les arrivées lors de la création d'un départ
- Synchroniser les données en temps réel entre tous les aéroports
- Afficher les informations de vol sur des écrans publics dans les halls d'aéroport
- Gérer les compagnies aériennes et les administrateurs

## 🏗️ Architecture

- **Frontend** : React + Vite + Tailwind CSS
- **Backend** : Node.js + Express + Socket.io
- **Base de données** : MongoDB Atlas
- **Temps réel** : Socket.io pour la synchronisation

## 📂 Structure du Projet

```
flight-management-system/
├── backend/                # API Node.js + Express
│   ├── src/
│   │   ├── config/        # Configuration (DB, Socket.io)
│   │   ├── models/        # Modèles Mongoose
│   │   ├── controllers/   # Contrôleurs
│   │   ├── routes/        # Routes API
│   │   ├── middleware/    # Middlewares
│   │   ├── services/      # Logique métier
│   │   ├── utils/         # Utilitaires
│   │   └── server.js      # Point d'entrée
│   ├── .env               # Variables d'environnement
│   └── package.json
│
├── frontend/              # Application React
│   ├── src/
│   │   ├── components/    # Composants React
│   │   ├── pages/         # Pages
│   │   ├── services/      # Services API
│   │   ├── context/       # Contexts React
│   │   ├── hooks/         # Hooks personnalisés
│   │   ├── utils/         # Utilitaires
│   │   └── App.jsx        # Composant principal
│   ├── .env               # Variables d'environnement
│   └── package.json
│
└── README.md              # Ce fichier
```

## 🚀 Installation

### Prérequis

- Node.js >= 18.0.0
- npm >= 9.0.0
- Compte MongoDB Atlas (gratuit)

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd flight-management-system
```

### 2. Configuration Backend

```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos configurations
npm run dev
```

### 3. Configuration Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Éditer .env si nécessaire
npm run dev
```

## 🔐 Configuration MongoDB Atlas

1. Créer un compte sur https://www.mongodb.com/cloud/atlas
2. Créer un cluster gratuit (M0)
3. Créer un utilisateur de base de données
4. Configurer l'accès réseau (0.0.0.0/0 pour développement)
5. Copier l'URI de connexion dans `backend/.env`

## 📦 Scripts Disponibles

### Backend

```bash
npm start          # Démarrer en production
npm run dev        # Démarrer en développement (nodemon)
npm run seed       # Peupler la base avec des données de test
```

### Frontend

```bash
npm run dev        # Démarrer le serveur de développement
npm run build      # Créer le build de production
npm run preview    # Prévisualiser le build
```

## 🎯 Fonctionnalités

### SuperAdmin
- ✅ Vue d'ensemble de tous les aéroports
- ✅ Gestion des aéroports
- ✅ Gestion des compagnies aériennes
- ✅ Gestion des administrateurs régionaux
- ✅ Vue globale de tous les vols
- ✅ Accès aux écrans publics de tous les aéroports

### Admin Régional
- ✅ Dashboard de son aéroport
- ✅ Création de vols de départ
- ✅ Visualisation des arrivées attendues
- ✅ Gestion des statuts de vol
- ✅ Gestion des retards
- ✅ Accès aux écrans publics de son aéroport

### Écrans Publics
- ✅ Hall Arrivées (vols entrants uniquement)
- ✅ Hall Départs (vols sortants uniquement)
- ✅ Hall Général (tous les vols)
- ✅ Mise à jour en temps réel
- ✅ Design lisible à distance

## 🔄 Flux de Données

1. **Création de vol** : Admin crée un départ → Arrivée créée automatiquement
2. **Mise à jour statut** : Changement de statut → Synchronisation automatique
3. **Temps réel** : Socket.io diffuse les changements → Tous les clients se mettent à jour

## 👥 Aéroports de Madagascar

- **TNR** - Antananarivo (Central)
- **TMM** - Toamasina
- **DIE** - Antsiranana
- **MJN** - Mahajanga
- **FTU** - Toliara
- Et 10+ autres aéroports régionaux

## 📱 URLs de l'Application

- **Backend API** : http://localhost:5000
- **Frontend** : http://localhost:5173
- **Health Check** : http://localhost:5000/api/health

## 🤝 Contribution

Ce projet est en développement actif. Les phases de développement sont :

1. ✅ Phase 0 : Setup & Préparation
2. 🔄 Phase 1 : Authentification & Modèles
3. ⏳ Phase 2 : Gestion Aéroports & Compagnies
4. ⏳ Phase 3 : Gestion des Vols
5. ⏳ Phase 4 : Temps Réel
6. ⏳ Phase 5 : Écrans Publics
7. ⏳ Phase 6-14 : Voir documentation complète

## 📄 Licence

MIT License

## 👨‍💻 Auteur

Votre Nom

## 📞 Support

Pour toute question ou problème : support@flights.aviation.mg

---

**Statut du Projet** : 🟢 Phase 0 Complétée | 🔄 Phase 1 En Cours