import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import flightService from '../../services/flightService';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Plane, 
  Clock, 
  ArrowRight, 
  Plus,
  Filter,
  Search,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  ChevronDown,
  X
} from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';

const Flights = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, departure, arrival
  
  // States pour les actions CRUD
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [flightToDelete, setFlightToDelete] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  useEffect(() => {
    fetchFlights();
  }, [filter, user.airportCode]);

  // Écouter les mises à jour en temps réel
  useEffect(() => {
    if (socket) {
      const handleFlightUpdate = (updatedFlight) => {
        if (updatedFlight.originAirportCode === user.airportCode || 
            updatedFlight.destinationAirportCode === user.airportCode) {
          
          setFlights(prevFlights => {
            const exists = prevFlights.find(f => f._id === updatedFlight._id);
            if (exists) {
              return prevFlights.map(f => f._id === updatedFlight._id ? updatedFlight : f);
            } else {
              if (filter === 'all' || 
                 (filter === 'departure' && updatedFlight.type === 'departure') ||
                 (filter === 'arrival' && updatedFlight.type === 'arrival')) {
                return [updatedFlight, ...prevFlights];
              }
              return prevFlights;
            }
          });
        }
      };

      const handleFlightDelete = (deletedFlightId) => {
        setFlights(prevFlights => prevFlights.filter(f => f._id !== deletedFlightId));
      };

      socket.on('flight:created', handleFlightUpdate);
      socket.on('flight:updated', handleFlightUpdate);
      socket.on('flight:statusChanged', handleFlightUpdate);
      socket.on('flight:deleted', handleFlightDelete);

      return () => {
        socket.off('flight:created', handleFlightUpdate);
        socket.off('flight:updated', handleFlightUpdate);
        socket.off('flight:statusChanged', handleFlightUpdate);
        socket.off('flight:deleted', handleFlightDelete);
      };
    }
  }, [socket, user.airportCode, filter]);

  const fetchFlights = async () => {
    try {
      setLoading(true);
      const data = await flightService.getFlightsByAirport(user.airportCode, filter);
      setFlights(data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'boarding': return 'warning';
      case 'departed': return 'purple';
      case 'in-flight': return 'primary';
      case 'landed': return 'success';
      case 'cancelled': return 'danger';
      case 'delayed': return 'warning';
      default: return 'default';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      scheduled: 'Programmé',
      boarding: 'Embarquement',
      departed: 'Décollé',
      'in-flight': 'En vol',
      landed: 'Atterri',
      cancelled: 'Annulé',
      delayed: 'Retardé',
      arrived: 'Arrivé'
    };
    return labels[status] || status;
  };

  // Gérer la suppression
  const handleDeleteClick = (flight) => {
    setFlightToDelete(flight);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!flightToDelete) return;
    
    try {
      setIsDeleting(true);
      await flightService.deleteFlight(flightToDelete._id);
      setShowDeleteModal(false);
      setFlightToDelete(null);
      // Socket.io mettra à jour la liste automatiquement
    } catch (error) {
      console.error('Erreur suppression vol:', error);
      alert('Erreur lors de la suppression du vol');
    } finally {
      setIsDeleting(false);
    }
  };

  // Gérer le changement de statut
  const handleStatusChange = async (flightId, newStatus, currentStatus) => {
    // Ne rien faire si le statut est identique
    if (newStatus === currentStatus) {
      alert('Le vol possède déjà ce statut.');
      return;
    }
    // Vérifier que la transition est autorisée côté client
    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      alert(`Transition de statut invalide: ${currentStatus} → ${newStatus}`);
      return;
    }
    try {
      setIsChangingStatus(true);
      await flightService.updateFlightStatus(flightId, newStatus);
      setShowStatusMenu(null);
    } catch (error) {
      console.error('Erreur changement statut:', error);
      const errorMsg = error.response?.data?.message || 'Erreur lors du changement de statut';
      alert(errorMsg);
    } finally {
      setIsChangingStatus(false);
    }
  };

  // Transitions valides (identiques à celles du backend)
  const validTransitions = {
    'scheduled': ['on-time', 'delayed', 'cancelled'],
    'on-time': ['delayed', 'boarding', 'cancelled'],
    'delayed': ['on-time', 'boarding', 'cancelled'],
    'boarding': ['departed', 'delayed', 'cancelled'],
    'departed': ['in-flight'],
    'in-flight': ['landed'],
    'landed': [],
    'cancelled': []
  };

  // Options de statut filtrées selon le statut actuel du vol
  const getAllowedStatusOptions = (currentStatus) => {
    const allowed = validTransitions[currentStatus] || [];
    // Toujours inclure l'option actuelle pour affichage, même si aucune transition
    const allOptions = [
      { value: 'scheduled', label: 'Prévu' },
      { value: 'on-time', label: 'À l\'heure' },
      { value: 'boarding', label: 'Embarquement' },
      { value: 'departed', label: 'Décollé' },
      { value: 'in-flight', label: 'En vol' },
      { value: 'landed', label: 'Atterri' },
      { value: 'arrived', label: 'Arrivé' },
      { value: 'delayed', label: 'Retardé' },
      { value: 'cancelled', label: 'Annulé' }
    ];
    return allOptions.filter(opt => opt.value === currentStatus || allowed.includes(opt.value));
  };

  return (
    <div className="space-y-8 page-transition">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Vols</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Aéroport de <span className="font-bold text-blue-600">{user.airportCode}</span>
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
          <button
            onClick={() => setFilter('all')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap touch-manipulation ${
              filter === 'all' 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('departure')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap touch-manipulation ${
              filter === 'departure'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            Départs
          </button>
          <button
            onClick={() => setFilter('arrival')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap touch-manipulation ${
              filter === 'arrival'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            Arrivées
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loading text="Chargement des vols..." />
        </div>
      ) : flights.length === 0 ? (
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
              className="group bg-white/80 backdrop-blur-xl p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
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
                        {flight.flightNumber}
                      </h3>
                      <Badge variant={getStatusVariant(flight.status)}>
                        {getStatusLabel(flight.status)}
                      </Badge>
                    </div>
                    <p className="text-slate-500 font-medium">
                      {flight.airlineId?.name}
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
                      {flight.aircraftType || 'Avion'}
                    </p>
                  </div>

                  <div className="text-center">
                    <p className="text-2xl font-bold text-slate-700">{flight.destinationAirportCode}</p>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mt-1">Destination</p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex flex-col items-end min-w-[140px]">
                  <div className="flex items-center gap-2 text-slate-600 mb-1">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="font-bold text-lg">
                      {format(new Date(flight.scheduledDeparture || flight.scheduledArrival), 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium capitalize">
                    {format(new Date(flight.scheduledDeparture || flight.scheduledArrival), 'EEEE d MMMM', { locale: fr })}
                  </p>
                  
                  {flight.estimatedDeparture && (
                    <div className="mt-2 px-2 py-1 bg-amber-50 text-amber-600 text-xs font-bold rounded-lg border border-amber-100">
                      Est: {format(new Date(flight.estimatedDeparture), 'HH:mm')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-6">
                  <Link to={`/flights/edit/${flight._id}`}>
                    <Button size="sm" variant="secondary">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <Button 
                    size="sm" 
                    variant="danger"
                    onClick={() => handleDeleteClick(flight)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <div className="relative">
                    <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setShowStatusMenu(showStatusMenu === flight._id ? null : flight._id)}
                >
                  Statut <ChevronDown className="h-4 w-4 ml-1" />
                </Button>

                {showStatusMenu === flight._id && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    {getAllowedStatusOptions(flight.status).map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusChange(flight._id, option.value, flight.status)}
                        disabled={isChangingStatus || flight.status === option.value}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition ${
                          flight.status === option.value 
                            ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                            : 'text-slate-700'
                        } ${isChangingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {option.label}
                        {flight.status === option.value && ' ✓'}
                      </button>
                    ))}
                  </div>
                )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && flightToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => !isDeleting && setShowDeleteModal(false)}
          title="Confirmer la suppression"
        >
          <div className="py-4">
            <p className="text-slate-700 mb-4">
              Êtes-vous sûr de vouloir supprimer le vol <span className="font-bold text-slate-900">{flightToDelete.flightNumber}</span> ?
            </p>
            <p className="text-sm text-slate-500 mb-2">
              {flightToDelete.originAirportCode} → {flightToDelete.destinationAirportCode}
            </p>
            <p className="text-sm text-amber-600">
              ⚠️ Cette action est irréversible.
            </p>
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
            >
              {isDeleting ? 'Suppression...' : 'Supprimer'}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default Flights;
