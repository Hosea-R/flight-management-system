// Aéroports de Madagascar
export const AIRPORTS = [
  { code: 'TNR', name: 'Ivato International Airport', city: 'Antananarivo', isCentral: true },
  { code: 'TMM', name: 'Toamasina Airport', city: 'Toamasina', isCentral: false },
  { code: 'DIE', name: 'Arrachart Airport', city: 'Antsiranana (Diego Suarez)', isCentral: false },
  { code: 'MJN', name: 'Amborovy Airport', city: 'Mahajanga', isCentral: false },
  { code: 'FTU', name: 'Toliara Airport', city: 'Toliara (Tuléar)', isCentral: false },
  { code: 'WVK', name: 'Manakara Airport', city: 'Manakara', isCentral: false },
  { code: 'MOQ', name: 'Morondava Airport', city: 'Morondava', isCentral: false },
  { code: 'WMN', name: 'Maroantsetra Airport', city: 'Maroantsetra', isCentral: false },
  { code: 'ILK', name: 'Atsinanana Airport', city: 'Ilaka', isCentral: false },
  { code: 'WAM', name: 'Ambatondrazaka Airport', city: 'Ambatondrazaka', isCentral: false },
  { code: 'SMS', name: 'Sainte Marie Airport', city: 'Sainte Marie', isCentral: false },
  { code: 'SVB', name: 'Sambava Airport', city: 'Sambava', isCentral: false },
  { code: 'WMP', name: 'Mampikony Airport', city: 'Mampikony', isCentral: false },
  { code: 'ZVA', name: 'Miandrivazo Airport', city: 'Miandrivazo', isCentral: false },
  { code: 'WAK', name: 'Antsohihy Airport', city: 'Antsohihy', isCentral: false },
];

// Compagnies aériennes
export const AIRLINES = [
  { code: 'MD', name: 'Air Madagascar' },
  { code: 'TS', name: 'Tsaradia' },
  { code: 'MY', name: 'Madagascar Airlines' },
];

// Statuts de vol
export const FLIGHT_STATUSES = {
  SCHEDULED: { value: 'scheduled', label: 'Programmé', color: 'gray' },
  ON_TIME: { value: 'on-time', label: 'À l\'heure', color: 'green' },
  DELAYED: { value: 'delayed', label: 'Retardé', color: 'orange' },
  BOARDING: { value: 'boarding', label: 'Embarquement', color: 'blue' },
  DEPARTED: { value: 'departed', label: 'Décollé', color: 'purple' },
  IN_FLIGHT: { value: 'in-flight', label: 'En vol', color: 'indigo' },
  LANDED: { value: 'landed', label: 'Atterri', color: 'green' },
  CANCELLED: { value: 'cancelled', label: 'Annulé', color: 'red' },
};

// Types de vol
export const FLIGHT_TYPES = {
  DEPARTURE: 'departure',
  ARRIVAL: 'arrival',
};

// Rôles utilisateur
export const USER_ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  
  // SuperAdmin
  SUPERADMIN_DASHBOARD: '/superadmin/dashboard',
  SUPERADMIN_AIRPORTS: '/superadmin/airports',
  SUPERADMIN_AIRLINES: '/superadmin/airlines',
  SUPERADMIN_FLIGHTS: '/superadmin/flights',
  SUPERADMIN_USERS: '/superadmin/users',
  
  // Admin
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_CREATE_FLIGHT: '/admin/create-flight',
  ADMIN_DEPARTURES: '/admin/departures',
  ADMIN_ARRIVALS: '/admin/arrivals',
  
  // Affichages publics
  PUBLIC_ARRIVALS: '/display/:airportCode/arrivals',
  PUBLIC_DEPARTURES: '/display/:airportCode/departures',
  PUBLIC_GENERAL: '/display/:airportCode/general',
};

// Messages
export const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Connexion réussie',
    LOGOUT: 'Déconnexion réussie',
    CREATED: 'Créé avec succès',
    UPDATED: 'Mis à jour avec succès',
    DELETED: 'Supprimé avec succès',
  },
  ERROR: {
    LOGIN: 'Email ou mot de passe incorrect',
    UNAUTHORIZED: 'Non autorisé',
    NETWORK: 'Erreur de connexion au serveur',
    UNKNOWN: 'Une erreur est survenue',
  },
};

// Configuration
export const CONFIG = {
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  TOKEN_KEY: 'flight_management_token',
  USER_KEY: 'flight_management_user',
  REFRESH_INTERVAL: 30000, // 30 secondes
};