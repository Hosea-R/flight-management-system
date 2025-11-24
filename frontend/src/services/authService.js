import api from './api';

const authService = {
  // Connexion
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      sessionStorage.setItem('token', response.data.data.token);
      sessionStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  // Déconnexion
  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('activeAirportCode'); // Nettoyer aussi le contexte
    // Optionnel: appeler l'API pour invalider le token côté serveur si nécessaire
    // api.post('/auth/logout');
  },

  // Récupérer l'utilisateur courant
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    return !!sessionStorage.getItem('token');
  },

  // Récupérer le rôle de l'utilisateur
  getUserRole: () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    return user ? user.role : null;
  },

  // Récupérer l'utilisateur stocké
  getCurrentUser: () => {
    return JSON.parse(sessionStorage.getItem('user'));
  }
};

export default authService;
