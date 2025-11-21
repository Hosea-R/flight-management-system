import api from './api';

const airlineService = {
  // Récupérer toutes les compagnies
  getAllAirlines: async () => {
    const response = await api.get('/airlines');
    return response.data;
  },

  // Récupérer une compagnie par son ID
  getAirlineById: async (id) => {
    const response = await api.get(`/airlines/${id}`);
    return response.data;
  },

  // Créer une compagnie (SuperAdmin)
  createAirline: async (airlineData) => {
    const response = await api.post('/airlines', airlineData);
    return response.data;
  },

  // Mettre à jour une compagnie (SuperAdmin)
  updateAirline: async (id, airlineData) => {
    const response = await api.put(`/airlines/${id}`, airlineData);
    return response.data;
  },

  // Supprimer une compagnie (SuperAdmin)
  deleteAirline: async (id) => {
    const response = await api.delete(`/airlines/${id}`);
    return response.data;
  }
};

export default airlineService;
