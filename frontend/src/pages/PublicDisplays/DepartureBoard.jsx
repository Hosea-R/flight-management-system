import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import useSocket from '../../hooks/useSocket';
import BoardHeader from '../../components/displays/BoardHeader';
import FlightBoardRow from '../../components/displays/FlightBoardRow';
import { Plane } from 'lucide-react';
import '../../styles/display.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DepartureBoard = () => {
  const { airportCode } = useParams();
  const { socket } = useSocket();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [airportName, setAirportName] = useState('');

  useEffect(() => {
    fetchDepartures();
    // Rafraîchir toutes les 30 secondes (fallback si Socket.io échoue)
    const interval = setInterval(fetchDepartures, 30000);
    return () => clearInterval(interval);
  }, [airportCode]);

  // Écouter les mises à jour temps réel
  useEffect(() => {
    if (socket && airportCode) {
      // Rejoindre la room de l'aéroport
      if (socket.isConnected) {
        socket.joinAirport(airportCode.toUpperCase());
      }

      const handleFlightUpdate = (updatedFlight) => {
        if (updatedFlight.originAirportCode === airportCode.toUpperCase() && 
            updatedFlight.type === 'departure') {
          setFlights(prevFlights => {
            const exists = prevFlights.find(f => f._id === updatedFlight._id);
            if (exists) {
              return prevFlights.map(f => 
                f._id === updatedFlight._id ? updatedFlight : f
              );
            } else {
              return [updatedFlight, ...prevFlights].sort((a, b) => 
                new Date(a.scheduledDeparture) - new Date(b.scheduledDeparture)
              );
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
        // Ne pas quitter la room ici si on navigue vers une autre page du même aéroport
        // Mais pour l'instant c'est plus sûr de quitter
        // socket.leaveAirport(airportCode.toUpperCase());
      };
    }
  }, [socket, airportCode]);

  const fetchDepartures = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/public/flights/${airportCode.toUpperCase()}/departures`
      );
      setFlights(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement départs:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="display-container">
        <div className="display-loading">
          <div>
            <div className="display-loading-spinner"></div>
            <p>Chargement des départs...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="display-container">
      <BoardHeader
        airportCode={airportCode.toUpperCase()}
        airportName={airportName}
        type="departures"
      />

      <div className="display-scroll-container">
        {/* En-têtes de colonnes */}
        <div className="display-table-header">
          <div className="col-span-3">VOL</div>
          <div className="col-span-3">DESTINATION</div>
          <div className="col-span-2">PROGRAMMÉ</div>
          <div className="col-span-2">DÉPART PRÉVU</div>
          <div className="col-span-2">STATUT</div>
        </div>

        {/* Lignes de vols */}
        {flights.length === 0 ? (
          <div className="display-empty">
            <Plane className="h-24 w-24 mb-4 opacity-50" />
            <p className="text-2xl">Aucun départ prévu pour aujourd'hui</p>
          </div>
        ) : (
          <div>
            {flights.map((flight, index) => (
              <FlightBoardRow
                key={flight._id}
                flight={flight}
                type="departure"
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartureBoard;
