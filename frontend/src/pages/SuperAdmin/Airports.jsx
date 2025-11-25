import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import airportService from '../../services/airportService';
import { Plus, Edit, Trash2, MapPin, Phone, Mail, Globe, Navigation, ExternalLink } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';

const Airports = () => {
  const navigate = useNavigate();
  const { setActiveAirport } = useAuth();
  const [airports, setAirports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAirport, setCurrentAirport] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    city: '',
    region: '',
    isCentral: false,
    latitude: '',
    longitude: '',
    phone: '',
    email: ''
  });

  // Handler pour accéder au dashboard d'un aéroport
  const handleAccessAirport = (airportCode) => {
    setActiveAirport(airportCode);
    // Ouvrir le dashboard dans un nouvel onglet
    window.open('/', '_blank');
  };

  useEffect(() => {
    fetchAirports();
  }, []);

  const fetchAirports = async () => {
    try {
      const data = await airportService.getAllAirports();
      setAirports(data.data);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement des aéroports');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        coordinates: {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude)
        },
        contact: {
          phone: formData.phone,
          email: formData.email
        }
      };

      if (currentAirport) {
        await airportService.updateAirport(currentAirport.code, payload);
      } else {
        await airportService.createAirport(payload);
      }
      
      setIsModalOpen(false);
      fetchAirports();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleEdit = (airport) => {
    setCurrentAirport(airport);
    setFormData({
      code: airport.code,
      name: airport.name,
      city: airport.city,
      region: airport.region,
      isCentral: airport.isCentral,
      latitude: airport.coordinates.latitude,
      longitude: airport.coordinates.longitude,
      phone: airport.contact?.phone || '',
      email: airport.contact?.email || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (code) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet aéroport ?')) {
      try {
        await airportService.deleteAirport(code);
        fetchAirports();
      } catch (err) {
        setError('Erreur lors de la suppression');
      }
    }
  };

  const resetForm = () => {
    setCurrentAirport(null);
    setFormData({
      code: '',
      name: '',
      city: '',
      region: '',
      isCentral: false,
      latitude: '',
      longitude: '',
      phone: '',
      email: ''
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loading text="Chargement des aéroports..." />
    </div>
  );

  return (
    <div className="space-y-8 page-transition">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Globe className="h-8 w-8 text-blue-600" />
            </div>
            Gestion des Aéroports
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Gérez le réseau aéroportuaire et les hubs
          </p>
        </div>
        <Button 
          variant="gradient" 
          icon={<Plus className="w-5 h-5 ml-2" />}
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="shadow-lg shadow-blue-500/20"
        >
          Ajouter un aéroport
        </Button>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-rose-500"></div>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {airports.map((airport, index) => (
          <div 
            key={airport._id} 
            className="stagger-item group bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1 card-lift cursor-pointer"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => handleAccessAirport(airport.code)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant={airport.isCentral ? 'primary' : 'default'}>
                    {airport.code}
                  </Badge>
                  <ExternalLink className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 leading-tight">{airport.name}</h3>
                <p className="text-slate-500 flex items-center mt-2 font-medium">
                  <MapPin className="w-4 h-4 mr-1.5 text-blue-500" />
                  {airport.city}, {airport.region}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEdit(airport); }}
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Modifier"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(airport.code); }}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="border-t border-slate-100 pt-4 space-y-3">
              {airport.contact?.phone && (
                <div className="flex items-center text-slate-600 bg-slate-50/50 p-2.5 rounded-lg">
                  <Phone className="w-4 h-4 mr-3 text-slate-400" />
                  <span className="text-sm font-medium">{airport.contact.phone}</span>
                </div>
              )}
              {airport.contact?.email && (
                <div className="flex items-center text-slate-600 bg-slate-50/50 p-2.5 rounded-lg">
                  <Mail className="w-4 h-4 mr-3 text-slate-400" />
                  <span className="text-sm font-medium truncate">{airport.contact.email}</span>
                </div>
              )}
              <div className="flex items-center text-slate-600 bg-slate-50/50 p-2.5 rounded-lg">
                <Navigation className="w-4 h-4 mr-3 text-slate-400" />
                <span className="text-xs font-mono text-slate-500">
                  {airport.coordinates.latitude.toFixed(4)}, {airport.coordinates.longitude.toFixed(4)}
                </span>
              </div>
            </div>

            {/* Indicateur d'accès au dashboard */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 group-hover:text-blue-600 transition-colors font-medium">
                  Accéder au dashboard
                </span>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </div>
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
                      {currentAirport ? <Edit className="h-5 w-5 text-blue-600" /> : <Plus className="h-5 w-5 text-blue-600" />}
                    </div>
                    {currentAirport ? 'Modifier l\'aéroport' : 'Ajouter un aéroport'}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Code IATA</label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all uppercase font-mono"
                        maxLength="3"
                        required
                        disabled={!!currentAirport}
                        placeholder="TNR"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'aéroport</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
                        required
                        placeholder="Aéroport International Ivato"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Ville</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
                        required
                        placeholder="Antananarivo"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Région</label>
                      <input
                        type="text"
                        name="region"
                        value={formData.region}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
                        required
                        placeholder="Analamanga"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
                        required
                        placeholder="-18.7969"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
                        required
                        placeholder="47.4788"
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
                        placeholder="+261..."
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full rounded-xl border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-200 transition-all"
                        placeholder="contact@..."
                      />
                    </div>

                    <div className="col-span-2 mt-2">
                      <label className="flex items-center p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          name="isCentral"
                          checked={formData.isCentral}
                          onChange={handleInputChange}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-all"
                        />
                        <span className="ml-3 text-sm font-medium text-slate-700">
                          Définir comme Aéroport Central (Hub)
                        </span>
                      </label>
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

export default Airports;
