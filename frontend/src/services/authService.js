import api from './api';

const authService = {
  // Connexion
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  // Déconnexion
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
    return !!localStorage.getItem('token');
  },

  // Récupérer le rôle de l'utilisateur
  getUserRole: () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user.role : null;
  },

  // Récupérer l'utilisateur stocké
  getCurrentUser: () => {
    return JSON.parse(localStorage.getItem('user'));
  }
};

export default authService;
