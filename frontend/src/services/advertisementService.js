import api from './api';

const advertisementService = {
  // Récupérer toutes les publicités (admin)
  getAllAdvertisements: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/advertisements${params ? `?${params}` : ''}`);
    return response.data;
  },

  // Récupérer les publicités actives pour un aéroport (public)
  getActiveAdvertisements: async (airportCode) => {
    const response = await api.get(`/advertisements/active/${airportCode}`);
    return response.data;
  },

  // Récupérer une publicité par ID
  getAdvertisementById: async (id) => {
    const response = await api.get(`/advertisements/${id}`);
    return response.data;
  },

  // Créer une publicité avec upload de média
  createAdvertisement: async (formData) => {
    const response = await api.post('/advertisements', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Mettre à jour une publicité
  updateAdvertisement: async (id, formData) => {
    const response = await api.put(`/advertisements/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Supprimer une publicité
  deleteAdvertisement: async (id) => {
    const response = await api.delete(`/advertisements/${id}`);
    return response.data;
  },

  // Incrémenter le compteur de vues
  incrementViewCount: async (id) => {
    const response = await api.post(`/advertisements/${id}/view`);
    return response.data;
  }
};

export default advertisementService;
