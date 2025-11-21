import api from './api';

const airportService = {
  // Récupérer tous les aéroports
  getAllAirports: async () => {
    const response = await api.get('/airports');
    return response.data;
  },

  // Récupérer un aéroport par son code
  getAirportByCode: async (code) => {
    const response = await api.get(`/airports/${code}`);
    return response.data;
  },

  // Créer un aéroport (SuperAdmin)
  createAirport: async (airportData) => {
    const response = await api.post('/airports', airportData);
    return response.data;
  },

  // Mettre à jour un aéroport (SuperAdmin)
  updateAirport: async (code, airportData) => {
    const response = await api.put(`/airports/${code}`, airportData);
    return response.data;
  },

  // Supprimer un aéroport (SuperAdmin)
  deleteAirport: async (code) => {
    const response = await api.delete(`/airports/${code}`);
    return response.data;
  },

  // Obtenir les statistiques d'un aéroport
  getAirportStats: async (code) => {
    const response = await api.get(`/airports/${code}/stats`);
    return response.data;
  }
};

// Alias pour compatibilité
airportService.getAirports = airportService.getAllAirports;

export default airportService;
