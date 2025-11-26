import api from './api';

const systemSettingsService = {
  // Récupérer un paramètre système
  getSetting: async (key) => {
    const response = await api.get(`/system-settings/${key}`);
    return response.data.data;
  },

  // Mettre à jour un paramètre système
  updateSetting: async (key, value, description = null) => {
    const response = await api.put(`/system-settings/${key}`, {
      value,
      ...(description && { description })
    });
    return response.data.data;
  },

  // Basculer le mode urgence des publicités
  toggleAdsEmergency: async () => {
    const response = await api.post('/system-settings/ads-emergency/toggle');
    return response.data;
  }
};

export default systemSettingsService;
