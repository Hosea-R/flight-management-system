import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import flightService from '../../services/flightService';
import airportService from '../../services/airportService';
import airlineService from '../../services/airlineService';
import { useAuth } from '../../context/AuthContext';
import { Plane, Calendar, Clock, MapPin, Users, Hash, ArrowLeft, Sparkles } from 'lucide-react';
import Button from '../../components/common/Button';

const CreateFlight = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [airports, setAirports] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    flightNumber: '',
    airlineId: '',
    destinationAirportCode: '',
    scheduledDeparture: '',
    aircraftType: '',
    aircraftRegistration: '',
    capacity: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [airportsData, airlinesData] = await Promise.all([
          airportService.getAllAirports(),
          airlineService.getAllAirlines()
        ]);
        // Filtrer pour ne pas montrer l'aéroport d'origine dans les destinations
        const destinations = airportsData.data.filter(a => a.code !== user.airportCode);
        setAirports(destinations);
        setAirlines(airlinesData.data);
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };
    fetchData();
  }, [user.airportCode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await flightService.createFlight({
        ...formData,
        originAirportCode: user.airportCode, // L'origine est toujours l'aéroport de l'admin
        type: 'departure' // On crée toujours un départ (l'arrivée est auto-générée)
      });
      navigate('/flights');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création du vol');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Plane className="h-8 w-8 text-blue-600" />
            </div>
            Nouveau Vol
          </h2>
          <p className="mt-2 text-slate-500 text-lg">
            Départ de <span className="font-bold text-blue-600">{user.airportCode}</span>
          </p>
        </div>
        <Button 
          variant="secondary" 
          onClick={() => navigate('/flights')}
          icon={<ArrowLeft className="h-4 w-4 mr-2" />}
        >
          Retour
        </Button>
      </div>

      <div className="bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/50 rounded-3xl border border-white/50 overflow-hidden">
        {/* Decorative Header */}
        <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500"></div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl flex items-center gap-3 animate-shake">
              <div className="p-2 bg-rose-100 rounded-full">
                <span className="text-xl">⚠️</span>
              </div>
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {/* Compagnie Aérienne */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Compagnie Aérienne</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Plane className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <select
                  name="airlineId"
                  value={formData.airlineId}
                  onChange={handleInputChange}
                  className="block w-full pl-11 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium appearance-none cursor-pointer hover:bg-slate-100"
                  required
                >
                  <option value="">Sélectionner une compagnie</option>
                  {airlines.map(airline => (
                    <option key={airline._id} value={airline._id}>
                      {airline.name} ({airline.code})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <div className="h-5 w-5 text-slate-400">▼</div>
                </div>
              </div>
            </div>

            {/* Numéro de Vol */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Numéro de Vol</label>
              <div className="relative group flex rounded-2xl shadow-sm">
                <span className="inline-flex items-center px-4 rounded-l-2xl border border-r-0 border-slate-200 bg-slate-100 text-slate-500 font-bold">
                  {airlines.find(a => a._id === formData.airlineId)?.code || 'XX'}
                </span>
                <input
                  type="text"
                  name="flightNumber"
                  value={formData.flightNumber}
                  onChange={handleInputChange}
                  className="flex-1 min-w-0 block w-full px-4 py-4 rounded-none rounded-r-2xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium placeholder-slate-400"
                  placeholder="123"
                  required
                />
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Destination</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <select
                  name="destinationAirportCode"
                  value={formData.destinationAirportCode}
                  onChange={handleInputChange}
                  className="block w-full pl-11 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium appearance-none cursor-pointer hover:bg-slate-100"
                  required
                >
                  <option value="">Sélectionner la destination</option>
                  {airports.map(airport => (
                    <option key={airport._id} value={airport.code}>
                      {airport.city} ({airport.code})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <div className="h-5 w-5 text-slate-400">▼</div>
                </div>
              </div>
            </div>

            {/* Date et Heure de Départ */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Départ Prévu</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Calendar className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="datetime-local"
                  name="scheduledDeparture"
                  value={formData.scheduledDeparture}
                  onChange={handleInputChange}
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium placeholder-slate-400"
                  required
                />
              </div>
            </div>

            {/* Type d'avion */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Type d'avion</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Plane className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="aircraftType"
                  value={formData.aircraftType}
                  onChange={handleInputChange}
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium placeholder-slate-400"
                  placeholder="ex: ATR 72-500"
                  required
                />
              </div>
            </div>

            {/* Immatriculation */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Immatriculation</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Hash className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="aircraftRegistration"
                  value={formData.aircraftRegistration}
                  onChange={handleInputChange}
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium placeholder-slate-400"
                  placeholder="ex: 5R-MGD"
                  required
                />
              </div>
            </div>

            {/* Capacité */}
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Capacité</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Users className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 font-medium placeholder-slate-400"
                  placeholder="ex: 70"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-8 flex justify-end gap-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/flights')}
              className="px-8"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="px-8 shadow-lg shadow-blue-500/20"
              icon={<Sparkles className="h-4 w-4 ml-2" />}
            >
              Créer le vol
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFlight;
