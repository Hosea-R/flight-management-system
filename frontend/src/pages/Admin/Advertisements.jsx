import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import advertisementService from '../../services/advertisementService';
import airportService from '../../services/airportService';
import { Plus, Edit, Trash2, Image as ImageIcon, Video, Type, ExternalLink, Calendar, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import AdvertisementModal from '../../components/admin/AdvertisementModal';

import { useLocation, useNavigate } from 'react-router-dom';

const Advertisements = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [advertisements, setAdvertisements] = useState([]);
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [filter, setFilter] = useState({ type: 'all', isActive: 'all' });

  useEffect(() => {
    fetchData();
  }, [filter]);

  // Gérer l'action via URL (ex: depuis le dashboard)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'new') {
      handleCreate();
      // Nettoyer l'URL sans recharger la page
      navigate(location.pathname, { replace: true });
    }
  }, [location]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [adsData, airportsData] = await Promise.all([
        advertisementService.getAllAdvertisements({
          ...(filter.type !== 'all' && { type: filter.type }),
          ...(filter.isActive !== 'all' && { isActive: filter.isActive })
        }),
        airportService.getAllAirports()
      ]);
      
      setAdvertisements(adsData.data);
      setAirports(airportsData.data);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setCurrentAd(null);
    setIsModalOpen(true);
  };

  const handleEdit = (ad) => {
    setCurrentAd(ad);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette publicité ?')) {
      try {
        await advertisementService.deleteAdvertisement(id);
        fetchData();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  const handleToggleActive = async (ad) => {
    try {
      const formData = new FormData();
      formData.append('isActive', !ad.isActive);
      await advertisementService.updateAdvertisement(ad._id, formData);
      fetchData();
    } catch (err) {
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'text': return <Type className="w-5 h-5" />;
      default: return null;
    }
  };

  const getTypeBadge = (type) => {
    const variants = {
      image: 'primary',
      video: 'warning',
      text: 'default'
    };
    return variants[type] || 'default';
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loading text="Chargement des publicités..." />
    </div>
  );

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-xl">
              <ImageIcon className="h-8 w-8 text-purple-600" />
            </div>
            Gestion des Publicités
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Gérez les publicités pour les affichages publics
          </p>
        </div>
        <Button 
          variant="gradient" 
          icon={<Plus className="w-5 h-5 ml-2" />}
          onClick={handleCreate}
          className="shadow-lg shadow-purple-500/20"
        >
          Nouvelle publicité
        </Button>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-rose-500"></div>
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl border border-white/50 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all"
            >
              <option value="all">Tous</option>
              <option value="image">Images</option>
              <option value="video">Vidéos</option>
              <option value="text">Textes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Statut</label>
            <select
              value={filter.isActive}
              onChange={(e) => setFilter({ ...filter, isActive: e.target.value })}
              className="rounded-xl border-slate-200 focus:border-purple-500 focus:ring focus:ring-purple-200 transition-all"
            >
              <option value="all">Tous</option>
              <option value="true">Actifs</option>
              <option value="false">Inactifs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid des publicités */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {advertisements.map((ad, index) => (
          <div 
            key={ad._id} 
            className="stagger-item group bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Preview */}
            <div className="relative h-48 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
              {ad.type === 'image' && ad.mediaUrl && (
                <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover" />
              )}
              {ad.type === 'video' && ad.mediaUrl && (
                <video src={ad.mediaUrl} className="w-full h-full object-cover" muted />
              )}
              {ad.type === 'text' && (
                <div className="p-6 text-center">
                  <Type className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-700 font-medium line-clamp-3">{ad.textContent}</p>
                </div>
              )}
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => handleEdit(ad)}
                  className="p-3 bg-white rounded-lg hover:bg-blue-50 transition-colors"
                  title="Modifier"
                >
                  <Edit className="w-5 h-5 text-blue-600" />
                </button>
                <button
                  onClick={() => handleToggleActive(ad)}
                  className="p-3 bg-white rounded-lg hover:bg-green-50 transition-colors"
                  title={ad.isActive ? 'Désactiver' : 'Activer'}
                >
                  {ad.isActive ? 
                    <ToggleRight className="w-5 h-5 text-green-600" /> :
                    <ToggleLeft className="w-5 h-5 text-slate-400" />
                  }
                </button>
                <button
                  onClick={() => handleDelete(ad._id)}
                  className="p-3 bg-white rounded-lg hover:bg-rose-50 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </button>
              </div>

              {/* Type badge */}
              <div className="absolute top-3 left-3">
                <Badge variant={getTypeBadge(ad.type)}>
                  <div className="flex items-center gap-1.5">
                    {getTypeIcon(ad.type)}
                    {ad.type}
                  </div>
                </Badge>
              </div>

              {/* Status badge */}
              <div className="absolute top-3 right-3">
                <Badge variant={ad.isActive ? 'success' : 'default'}>
                  {ad.isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>

            {/* Info */}
            <div className="p-5 space-y-3">
              <h3 className="text-lg font-bold text-slate-800 truncate">{ad.title}</h3>
              
              <div className="flex items-center justify-between text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{ad.duration}s</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>{ad.viewCount || 0} vues</span>
                </div>
              </div>

              {ad.showOnAllAirports ? (
                <div className="text-sm text-slate-500">
                  <Badge variant="default">Tous les aéroports</Badge>
                </div>
              ) : (
                <div className="text-sm text-slate-500">
                  {ad.airports.length} aéroport(s)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {advertisements.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-lg">Aucune publicité pour le moment</p>
          <Button onClick={handleCreate} className="mt-4">
            Créer votre première publicité
          </Button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <AdvertisementModal
          advertisement={currentAd}
          airports={airports}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
};

export default Advertisements;
