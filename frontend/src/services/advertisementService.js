import api from './api';

const advertisementService = {
  // Récupérer toutes les publicités (admin)
  getAllAdvertisements: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/advertisements${params ? `?${params}` : ''}`);
    // L'API retourne { success, data, count }, on retourne directement data
    return response.data.data || [];
  },

  // Récupérer les publicités actives pour un aéroport (public)
  getActiveAdvertisements: async (airportCode) => {
    const response = await api.get(`/advertisements/active/${airportCode}`);
    // Retourner l'objet complet pour permettre la vérification de emergencyMode
    return response.data;
  },

  // Récupérer une publicité par ID
  getAdvertisementById: async (id) => {
    const response = await api.get(`/advertisements/${id}`);
    // L'API retourne { success, data }, on retourne directement data
    return response.data.data;
  },

  // Créer une publicité avec upload de média
  createAdvertisement: async (formData) => {
    const response = await api.post('/advertisements', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    // L'API retourne { success, data, message }, on retourne directement data
    return response.data.data;
  },

  // Mettre à jour une publicité
  updateAdvertisement: async (id, formData) => {
    const response = await api.put(`/advertisements/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    // L'API retourne { success, data, message }, on retourne directement data
    return response.data.data;
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
  },

  // Récupérer les alertes
  getAlerts: async () => {
    const response = await api.get('/advertisements/alerts');
    // L'API retourne { success, data: { expiring, quotaReached, expired }, count }
    return response.data.data;
  },

  // Upload un PDF de contrat
  uploadContractPDF: async (adId, pdfFile, name) => {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    if (name) formData.append('name', name);
    
    const response = await api.post(`/advertisements/${adId}/contract/pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data; // Retourne liste attachments
  },

  // Supprimer un PDF de contrat
  deleteContractPDF: async (adId, attachmentId) => {
    const response = await api.delete(`/advertisements/${adId}/contract/pdf/${attachmentId}`);
    return response.data;
  }
};

export default advertisementService;
