import api from './api';

const statsService = {
  // Stats globales (SuperAdmin)
  getGlobalStats: () => api.get('/stats/global'),

  // Stats d'un aéroport
  getAirportStats: (airportCode) => api.get(`/stats/airport/${airportCode}`)
};

export default statsService;
