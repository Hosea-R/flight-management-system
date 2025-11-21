
import { useState, useEffect } from 'react';
import { UserPlus, Edit, Trash2, Power, Copy, Check, Users as UsersIcon, Shield, Mail, Building2 } from 'lucide-react';
import userService from '../../services/userService';
import airportService from '../../services/airportService';
import UserForm from '../../components/users/UserForm';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState(null);
  const [copiedPassword, setCopiedPassword] = useState(false);

  // Charger les utilisateurs et aéroports
  useEffect(() => {
    fetchUsers();
    fetchAirports();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers();
      setUsers(response.data.data);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAirports = async () => {
    try {
      const response = await airportService.getAirports();
      const airportsData = response.data.data || response.data;
      setAirports(airportsData);
    } catch (error) {
      console.error('Erreur lors du chargement des aéroports:', error);
    }
  };

  // Créer un admin
  const handleCreate = async (formData) => {
    try {
      const response = await userService.createUser(formData);
      setTemporaryPassword(response.data.data.temporaryPassword);
      setShowForm(false);
      fetchUsers();
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création de l\'admin');
    }
  };

  // Modifier un admin
  const handleUpdate = async (formData) => {
    try {
      await userService.updateUser(editingUser._id, formData);
      setShowForm(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert(error.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  // Supprimer un admin
  const handleDelete = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet admin ?')) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      fetchUsers();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // Activer/Désactiver un admin
  const handleToggleStatus = async (userId) => {
    try {
      await userService.toggleStatus(userId);
      fetchUsers();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      alert(error.response?.data?.message || 'Erreur lors du changement de statut');
    }
  };

  // Copier le mot de passe
  const copyPassword = () => {
    navigator.clipboard.writeText(temporaryPassword);
    setCopiedPassword(true);
    setTimeout(() => setCopiedPassword(false), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loading text="Chargement des utilisateurs..." />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <UsersIcon className="h-8 w-8 text-blue-600" />
            </div>
            Gestion des Admins
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Gérez les administrateurs et leurs accès aux aéroports
          </p>
        </div>
        <Button 
          variant="gradient" 
          icon={<UserPlus className="h-5 w-5 ml-2" />}
          onClick={() => {
            setEditingUser(null);
            setShowForm(true);
          }}
          className="shadow-lg shadow-blue-500/20"
        >
          Créer un admin
        </Button>
      </div>

      {/* Modal Mot de Passe Temporaire */}
      {temporaryPassword && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-md p-8 border border-white/50">
            <div className="text-center mb-6">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">
                Admin créé avec succès !
              </h2>
              <p className="text-slate-500 mt-2">
                Mot de passe temporaire généré. Veuillez le copier et le communiquer à l'admin.
                <span className="block mt-1 text-rose-500 font-bold">Il ne sera plus affiché.</span>
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl mb-6 flex items-center justify-between border border-slate-200">
              <code className="text-xl font-mono font-bold text-blue-600 tracking-wider">
                {temporaryPassword}
              </code>
              <button
                onClick={copyPassword}
                className="p-2 hover:bg-white rounded-lg transition-all duration-200 shadow-sm"
                title="Copier"
              >
                {copiedPassword ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Copy className="h-5 w-5 text-slate-400 hover:text-blue-500" />
                )}
              </button>
            </div>

            <Button
              onClick={() => setTemporaryPassword(null)}
              className="w-full"
            >
              Fermer
            </Button>
          </div>
        </div>
      )}

      {/* Grid Layout for Users */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div 
            key={user._id} 
            className="group bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{user.firstName} {user.lastName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={user.isActive ? 'success' : 'danger'} size="sm">
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => handleToggleStatus(user._id)}
                  className={`p-2 rounded-lg transition-colors ${
                    user.isActive 
                      ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50' 
                      : 'text-slate-400 hover:text-green-500 hover:bg-green-50'
                  }`}
                  title={user.isActive ? 'Désactiver' : 'Activer'}
                >
                  <Power className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingUser(user);
                    setShowForm(true);
                  }}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(user._id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-slate-600 bg-slate-50/50 p-3 rounded-xl">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 bg-slate-50/50 p-3 rounded-xl">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium">Aéroport: <span className="font-bold text-blue-600">{user.airportCode}</span></span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 bg-slate-50/50 p-3 rounded-xl">
                <Shield className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium capitalize">{user.role}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300">
          <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <UsersIcon className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Aucun administrateur</h3>
          <p className="mt-2 text-slate-500">Commencez par créer un administrateur régional.</p>
        </div>
      )}

      {/* Formulaire Modal */}
      {showForm && (
        <UserForm
          user={editingUser}
          airports={airports}
          onSubmit={editingUser ? handleUpdate : handleCreate}
          onClose={() => {
            setShowForm(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
};

export default Users;
