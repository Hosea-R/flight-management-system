import { useState, useEffect } from 'react';
import airlineService from '../../services/airlineService';
import { Plus, Edit, Trash2, Plane, Globe, Link as LinkIcon } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';

const Airlines = () => {
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAirline, setCurrentAirline] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    logo: ''
  });

  useEffect(() => {
    fetchAirlines();
  }, []);

  const fetchAirlines = async () => {
    try {
      const data = await airlineService.getAllAirlines();
      setAirlines(data.data);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement des compagnies');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentAirline) {
        await airlineService.updateAirline(currentAirline._id, formData);
      } else {
        await airlineService.createAirline(formData);
      }
      
      setIsModalOpen(false);
      fetchAirlines();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (airline) => {
    setCurrentAirline(airline);
    setFormData({
      code: airline.code,
      name: airline.name,
      logo: airline.logo || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette compagnie ?')) {
      try {
        await airlineService.deleteAirline(id);
        fetchAirlines();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  const resetForm = () => {
    setCurrentAirline(null);
    setFormData({
      code: '',
      name: '',
      logo: ''
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loading text="Chargement des compagnies..." />
    </div>
  );

  return (
    <div className="space-y-8 page-transition">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Plane className="h-8 w-8 text-blue-600" />
            </div>
            Gestion des Compagnies
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Gérez les compagnies aériennes partenaires
          </p>
        </div>
        <Button 
          variant="gradient" 
          icon={<Plus className="w-5 h-5 ml-2" />}
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="shadow-lg shadow-blue-500/20"
        >
          Ajouter une compagnie
        </Button>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-rose-500"></div>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {airlines.map((airline, index) => (
          <div 
            key={airline._id} 
            className="stagger-item group bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1 card-lift"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start gap-5">
              <div className="h-20 w-20 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100 shadow-inner p-2">
                {airline.logo ? (
                  <img src={airline.logo} alt={airline.name} className="h-full w-full object-contain" />
                ) : (
                  <Plane className="h-8 w-8 text-slate-300" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 truncate">{airline.name}</h3>
                    <Badge variant="info" className="mt-2">
                      {airline.code}
                    </Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                      onClick={() => handleEdit(airline)}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(airline._id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {airline.logo && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-slate-500 text-sm">
                <LinkIcon className="w-4 h-4 mr-2 text-slate-400" />
                <span className="truncate">{airline.logo}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Formulaire */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-slate-100">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      {currentAirline ? <Edit className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                    </div>
                    {currentAirline ? 'Modifier la compagnie' : 'Ajouter une compagnie'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Code IATA (2 caractères)</label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all uppercase font-mono"
                        maxLength="2"
                        required
                        disabled={!!currentAirline}
                        placeholder="AF"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nom de la compagnie</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
                        required
                        placeholder="Air France"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">URL du Logo (optionnel)</label>
                      <input
                        type="text"
                        name="logo"
                        value={formData.logo}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse gap-3 border-t border-slate-100">
                  <Button type="submit" className="w-full sm:w-auto">
                    Enregistrer
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsModalOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Airlines;
