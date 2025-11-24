import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes de timeout
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Erreur réseau (pas de réponse du serveur)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        toast.error('La requête a pris trop de temps. Veuillez réessayer.');
      } else if (error.message === 'Network Error') {
        toast.error('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
      } else {
        toast.error('Une erreur inattendue s\'est produite.');
      }
      return Promise.reject(error);
    }

    const status = error.response.status;
    const message = error.response.data?.message || 'Une erreur est survenue';

    switch (status) {
      case 401:
        // Token expiré ou invalide
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expirée. Veuillez vous reconnecter.');
        if (window.location.pathname !== '/login') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
        break;

      case 403:
        // Accès interdit
        toast.error('Vous n\'avez pas les permissions nécessaires pour cette action.');
        break;

      case 404:
        // Ressource non trouvée
        toast.error('Ressource non trouvée.');
        break;

      case 429:
        // Rate limit dépassé
        toast.error('Trop de requêtes. Veuillez patienter quelques instants.');
        console.warn('Rate limit atteint:', error.response.data);
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Erreurs serveur
        toast.error('Erreur serveur. Veuillez réessayer plus tard.');
        console.error('Erreur serveur:', error.response.data);
        break;

      default:
        // Other errors
        if (message) {
          toast.error(message);
        }
        break;
    }

    return Promise.reject(error);
  }
);

export default api;
