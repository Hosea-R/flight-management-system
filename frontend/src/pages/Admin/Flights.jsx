import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import flightService from '../../services/flightService';
import { useAuth } from '../../context/AuthContext';
import airportService from '../../services/airportService';
import useSocket from '../../hooks/useSocket';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Plane, 
  Clock, 
  Plus,
  MapPin,
  Edit,
  Trash2,
  ChevronDown,
  X,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const Flights = () => {
  const navigate = useNavigate();
  const { user, getEffectiveAirportCode, activeAirportCode, clearActiveAirport } = useAuth();
  const { socket } = useSocket();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [airportInfo, setAirportInfo] = useState(null);
  
  const effectiveAirportCode = getEffectiveAirportCode();
  
  // States pour les actions
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [flightToDelete, setFlightToDelete] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  useEffect(() => {
    fetchFlights();
    fetchAirportInfo();
  }, [filter, effectiveAirportCode]);

  // Socket.io real-time updates
  useEffect(() => {
    if (socket?.socket) {
      const handleFlightCreated = (data) => {
        console.log('✈️ Vol créé:', data);
        const newFlight = data.flight || data;
        
        // Vérifier si ce vol concerne cet aéroport EN FONCTION DE SON TYPE
        let concernsThisAirport = false;
        
        if (newFlight.type === 'departure' && newFlight.originAirportCode === effectiveAirportCode) {
          concernsThisAirport = true; // C'est un départ de notre aéroport
        } else if (newFlight.type === 'arrival' && newFlight.destinationAirportCode === effectiveAirportCode) {
          concernsThisAirport = true; // C'est une arrivée vers notre aéroport
        }
        
        if (concernsThisAirport) {
          setFlights(prevFlights => {
            const exists = prevFlights.find(f => f._id === newFlight._id);
            if (!exists && shouldShowFlight(newFlight)) {
              return [newFlight, ...prevFlights];
            }
            return prevFlights;
          });
          toast.success('Nouveau vol créé');
        }
      };

      const handleFlightUpdated = (data) => {
        console.log('🔄 Vol mis à jour:', data);
        const updatedFlight = data.flight || data;
        
        setFlights(prevFlights => 
          prevFlights.map(f => f._id === updatedFlight._id ? updatedFlight : f)
        );
      };

      const handleFlightStatusChanged = (data) => {
        console.log('📊 Statut changé:', data);
        const updatedFlight = data.flight || data;
        
        setFlights(prevFlights => 
          prevFlights.map(f => f._id === updatedFlight._id ? updatedFlight : f)
        );
        toast.success(`Statut mis à jour: ${getStatusLabel(updatedFlight.status)}`);
      };

      const handleFlightDeleted = (data) => {
        console.log('🗑️ Vol supprimé:', data);
        const deletedId = data.flightId || data._id;
        
        setFlights(prevFlights => prevFlights.filter(f => f._id !== deletedId));
        toast.success('Vol supprimé');
      };

      socket.socket.on('flight:created', handleFlightCreated);
      socket.socket.on('flight:updated', handleFlightUpdated);
      socket.socket.on('flight:statusChanged', handleFlightStatusChanged);
      socket.socket.on('flight:deleted', handleFlightDeleted);

      return () => {
        socket.socket.off('flight:created', handleFlightCreated);
        socket.socket.off('flight:updated', handleFlightUpdated);
        socket.socket.off('flight:statusChanged', handleFlightStatusChanged);
        socket.socket.off('flight:deleted', handleFlightDeleted);
      };
    }
  }, [socket, effectiveAirportCode, filter]);

  const shouldShowFlight = (flight) => {
    if (filter === 'all') return true;
    if (filter === 'departure') return flight.type === 'departure';
    if (filter === 'arrival') return flight.type === 'arrival';
    return true;
  };

  const fetchFlights = async () => {
    if (!effectiveAirportCode) return;
    
    try {
      setLoading(true);
      const params = {
        airportCode: effectiveAirportCode,
        type: filter === 'all' ? undefined : filter
      };
      const data = await flightService.getAllFlights(params);
      setFlights(data.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Erreur chargement vols:', err);
      toast.error('Erreur lors du chargement des vols');
      setLoading(false);
    }
  };

  const fetchAirportInfo = async () => {
    if (user?.role === 'superadmin' && activeAirportCode) {
      try {
        const response = await airportService.getAllAirports();
        const airport = response.data.find(a => a.code === activeAirportCode);
        setAirportInfo(airport);
      } catch (error) {
        console.error('Erreur chargement info aéroport:', error);
      }
    }
  };

  const handleReturnToSuperAdmin = () => {
    clearActiveAirport();
    navigate('/');
  };

  const getStatusVariant = (status) => {
    const variants = {
      'scheduled': 'info',
      'on-time': 'success',
      'boarding': 'warning',
      'departed': 'purple',
      'in-flight': 'primary',
      'landed': 'success',
      'arrived': 'success',
      'cancelled': 'danger',
      'delayed': 'warning'
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'scheduled': 'Programmé',
      'on-time': 'À l\'heure',
      'boarding': 'Embarquement',
      'departed': 'Décollé',
      'in-flight': 'En vol',
      'landed': 'Atterri',
      'arrived': 'Arrivé',
      'cancelled': 'Annulé',
      'delayed': 'Retardé'
    };
    return labels[status] || status;
  };

  // Transitions de statut valides
  const validTransitions = {
    'scheduled': ['on-time', 'delayed', 'cancelled'],
    'on-time': ['delayed', 'boarding', 'cancelled'],
    'delayed': ['on-time', 'boarding', 'cancelled'],
    'boarding': ['departed', 'delayed', 'cancelled'],
    'departed': ['in-flight'],
    'in-flight': ['landed'],
    'landed': ['arrived'],
    'arrived': [],
    'cancelled': []
  };

  const getAllowedStatusOptions = (currentStatus) => {
    const allowed = validTransitions[currentStatus] || [];
    const allOptions = [
      { value: 'scheduled', label: 'Programmé', icon: '📅' },
      { value: 'on-time', label: 'À l\'heure', icon: '✅' },
      { value: 'boarding', label: 'Embarquement', icon: '🚶' },
      { value: 'departed', label: 'Décollé', icon: '🛫' },
      { value: 'in-flight', label: 'En vol', icon: '✈️' },
      { value: 'landed', label: 'Atterri', icon: '🛬' },
      { value: 'arrived', label: 'Arrivé', icon: '✓' },
      { value: 'delayed', label: 'Retardé', icon: '⏰' },
      { value: 'cancelled', label: 'Annulé', icon: '❌' }
    ];
    
    return allOptions.filter(opt => opt.value === currentStatus || allowed.includes(opt.value));
  };

  const handleStatusChange = async (flightId, newStatus, currentStatus) => {
    if (newStatus === currentStatus) {
      toast.error('Le vol possède déjà ce statut');
      setShowStatusMenu(null);
      return;
    }

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      toast.error(`Transition invalide: ${getStatusLabel(currentStatus)} → ${getStatusLabel(newStatus)}`);
      setShowStatusMenu(null);
      return;
    }

    try {
      setIsChangingStatus(true);
      const response = await flightService.updateFlightStatus(flightId, newStatus);
      
      // Mise à jour immédiate de l'état local
      setFlights(prevFlights => 
        prevFlights.map(f => 
          f._id === flightId 
            ? { ...f, status: newStatus }
            : f
        )
      );
      
      setShowStatusMenu(null);
      toast.success(`Statut changé: ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error('Erreur changement statut:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors du changement de statut';
      toast.error(errorMsg);
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleDeleteClick = (flight) => {
    setFlightToDelete(flight);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!flightToDelete) return;
    
    try {
      setIsDeleting(true);
      await flightService.deleteFlight(flightToDelete._id);
      
      // Mise à jour immédiate de l'état local
      setFlights(prevFlights => prevFlights.filter(f => f._id !== flightToDelete._id));
      
      setShowDeleteModal(false);
      setFlightToDelete(null);
      toast.success('Vol supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression vol:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors de la suppression du vol';
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading text="Chargement des vols..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 page-transition">
      {/* Bandeau de contexte pour SuperAdmin */}
      {user?.role === 'superadmin' && activeAirportCode && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium opacity-90">Mode Administrateur</p>
              <p className="text-lg font-bold">
                {airportInfo ? `${airportInfo.name} (${airportInfo.code})` : `Aéroport ${activeAirportCode}`}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={handleReturnToSuperAdmin}
            icon={<ArrowLeft className="h-4 w-4" />}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            Retour à la vue globale
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Vols</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Aéroport de <span className="font-bold text-blue-600">{effectiveAirportCode || user.airportCode}</span>
          </p>
        </div>
        <Link to="/flights/create">
          <Button 
            variant="gradient" 
            icon={<Plus className="w-5 h-5 ml-2" />}
            className="shadow-lg shadow-blue-500/20"
          >
            Nouveau Vol
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="overflow-x-auto pb-2 -mx-4 sm:mx-0">
        <div className="bg-white/80 backdrop-blur-xl p-2 rounded-2xl shadow-sm border border-slate-100 inline-flex min-w-min mx-4 sm:mx-0">
          {['all', 'departure', 'arrival'].map(filterType => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap touch-manipulation ${
                filter === filterType
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {filterType === 'all' ? 'Tous' : filterType === 'departure' ? 'Départs' : 'Arrivées'}
            </button>
          ))}
        </div>
      </div>

      {/* Flights List */}
      {flights.length === 0 ? (
        <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300">
          <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Plane className="h-10 w-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Aucun vol trouvé</h3>
          <p className="mt-2 text-slate-500 max-w-sm mx-auto">
            Il n'y a pas de vols correspondant à vos critères pour le moment.
          </p>
          <Link to="/flights/create" className="mt-6 inline-block">
            <Button variant="secondary">Créer un vol</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {flights.map((flight) => (
            <div 
              key={flight._id}
              className={`group bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1 ${
                showStatusMenu === flight._id ? 'relative z-50' : 'relative z-0'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Flight Info */}
                <div className="flex items-center gap-6">
                  <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-inner ${
                    flight.type === 'departure' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    <Plane className={`h-8 w-8 transform transition-transform duration-500 group-hover:scale-110 ${
                      flight.type === 'departure' ? '-rotate-45' : 'rotate-45'
                    }`} />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-slate-800">
                        {flight.airlineId?.code || ''}{flight.flightNumber}
                      </h3>
                      <Badge variant={getStatusVariant(flight.status)}>
                        {getStatusLabel(flight.status)}
                      </Badge>
                    </div>
                    <p className="text-slate-500 font-medium">
                      {flight.airlineId?.name || 'Compagnie inconnue'}
                    </p>
                  </div>
                </div>

                {/* Route */}
                <div className="flex items-center gap-8 flex-1 justify-center max-w-md">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-700">{flight.originAirportCode}</p>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Origine</p>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-center px-4">
                    <div className="w-full h-0.5 bg-slate-200 relative">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                        <Plane className="h-4 w-4 text-slate-300 transform rotate-90" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 font-medium">
                      {flight.aircraft?.type || 'Avion'}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-700">{flight.destinationAirportCode}</p>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Destination</p>
                  </div>
                </div>


                {/* Horaires */}
                <div className="flex flex-col items-end min-w-[200px] space-y-3">
                  {/* Départ */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Départ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="font-bold text-lg text-slate-700">
                        {format(new Date(flight.scheduledDeparture), 'HH:mm')}
                      </span>
                    </div>
                    {flight.estimatedDeparture && (
                      <div className="mt-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-md border border-amber-100 inline-block">
                        Est: {format(new Date(flight.estimatedDeparture), 'HH:mm')}
                      </div>
                    )}
                  </div>

                  {/* Arrivée */}
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <div className="h-2 w-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Arrivée</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-emerald-500" />
                      <span className="font-bold text-lg text-slate-700">
                        {format(new Date(flight.scheduledArrival), 'HH:mm')}
                      </span>
                    </div>
                    {flight.estimatedArrival && (
                      <div className="mt-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-bold rounded-md border border-amber-100 inline-block">
                        Est: {format(new Date(flight.estimatedArrival), 'HH:mm')}
                      </div>
                    )}
                  </div>

                  {/* Date et Durée */}
                  <div className="pt-2 border-t border-slate-100 w-full">
                    <p className="text-xs text-slate-400 font-medium capitalize text-right mb-1">
                      {format(new Date(flight.scheduledDeparture), 'EEEE d MMMM', { locale: fr })}
                    </p>
                    <p className="text-xs text-blue-600 font-bold text-right">
                      Durée: {(() => {
                        const duration = Math.round((new Date(flight.scheduledArrival) - new Date(flight.scheduledDeparture)) / 60000);
                        const hours = Math.floor(duration / 60);
                        const minutes = duration % 60;
                        return `${hours}h${minutes.toString().padStart(2, '0')}`;
                      })()}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-6">
                  <Link to={`/flights/edit/${flight._id}`}>
                    <Button size="sm" variant="secondary" title="Modifier">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <Button 
                    size="sm" 
                    variant="danger"
                    onClick={() => handleDeleteClick(flight)}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <div className={`relative ${showStatusMenu === flight._id ? 'z-[100]' : ''}`}>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setShowStatusMenu(showStatusMenu === flight._id ? null : flight._id)}
                      disabled={isChangingStatus}
                      title="Changer le statut"
                    >
                      {isChangingStatus && showStatusMenu === flight._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          Statut <ChevronDown className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>

                    {showStatusMenu === flight._id && (
                      <>
                        {/* Backdrop pour fermer le menu */}
                        <div 
                          className="fixed inset-0 z-[90]"
                          onClick={() => setShowStatusMenu(null)}
                        />
                        
                        {/* Menu dropdown */}
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 py-2 z-[100] animate-slide-in-bottom">
                          <div className="px-3 py-2 border-b border-slate-100">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                              Changer le statut
                            </p>
                          </div>
                          {getAllowedStatusOptions(flight.status).map(option => (
                            <button
                              key={option.value}
                              onClick={() => handleStatusChange(flight._id, option.value, flight.status)}
                              disabled={isChangingStatus || flight.status === option.value}
                              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 transition flex items-center gap-3 ${
                                flight.status === option.value 
                                  ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                                  : 'text-slate-700'
                              } ${isChangingStatus ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <span className="text-lg">{option.icon}</span>
                              <span className="flex-1">{option.label}</span>
                              {flight.status === option.value && (
                                <span className="text-indigo-600">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && flightToDelete && (
        <Modal
          open={showDeleteModal}
          onClose={() => !isDeleting && setShowDeleteModal(false)}
          title="Confirmer la suppression"
          size="md"
        >
          <div className="py-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 bg-rose-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <p className="text-slate-700 font-medium">
                  Voulez-vous vraiment supprimer le vol <span className="font-bold text-slate-900">{flightToDelete.airlineId?.code}{flightToDelete.flightNumber}</span> ?
                </p>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 space-y-2 mb-4">
              <p className="text-sm text-slate-600">
                <span className="font-bold">Route :</span> {flightToDelete.originAirportCode} → {flightToDelete.destinationAirportCode}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-bold">Départ :</span> {format(new Date(flightToDelete.scheduledDeparture), 'PPpp', { locale: fr })}
              </p>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <p className="text-sm text-amber-800">
                Cette action supprimera <span className="font-bold">à la fois le vol de départ et d'arrivée</span>. Cette opération est irréversible.
              </p>
            </div>
          </div>
          
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button 
              variant="danger" 
              onClick={confirmDelete}
              disabled={isDeleting}
              loading={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default Flights;