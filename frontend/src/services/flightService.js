import api from './api';

const flightService = {
  // Récupérer tous les vols (avec filtres optionnels)
  getAllFlights: async (params = {}) => {
    const response = await api.get('/flights', { params });
    return response.data;
  },

  // Récupérer un vol par son ID
  getFlightById: async (id) => {
    const response = await api.get(`/flights/${id}`);
    return response.data;
  },

  // Récupérer les vols d'un aéroport
  getFlightsByAirport: async (airportCode, type = 'all') => {
    const response = await api.get(`/flights/airport/${airportCode}`, {
      params: { type }
    });
    return response.data;
  },

  // Créer un vol (Admin aéroport)
  createFlight: async (flightData) => {
    const response = await api.post('/flights', flightData);
    return response.data;
  },

  // Mettre à jour le statut d'un vol
  updateFlightStatus: async (id, status, remarks) => {
    const response = await api.patch(`/flights/${id}/status`, {
      status,
      remarks
    });
    return response.data;
  },

  // Mettre à jour les détails d'un vol
  updateFlightDetails: async (id, flightData) => {
    const response = await api.put(`/flights/${id}`, flightData);
    return response.data;
  },

  // Supprimer un vol (et son lié)
  deleteFlight: async (id) => {
    const response = await api.delete(`/flights/${id}`);
    return response.data;
  }
};

export default flightService;
