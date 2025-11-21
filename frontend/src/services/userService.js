import api from './api';

const userService = {
  // Liste tous les admins
  getUsers: () => api.get('/users'),

  // Détails d'un admin
  getUserById: (id) => api.get(`/users/${id}`),

  // Créer un admin régional
  createUser: (data) => api.post('/users', data),

  // Modifier un admin
  updateUser: (id, data) => api.put(`/users/${id}`, data),

  // Supprimer un admin
  deleteUser: (id) => api.delete(`/users/${id}`),

  // Activer/Désactiver un admin
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`)
};

export default userService;
