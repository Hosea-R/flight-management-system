import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import useSocket from '../../hooks/useSocket';
import BoardHeader from '../../components/displays/BoardHeader';
import FlightBoardRow from '../../components/displays/FlightBoardRow';
import { Plane } from 'lucide-react';
import '../../styles/display.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ArrivalBoard = () => {
  const { airportCode } = useParams();
  const { socket } = useSocket();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [airportName, setAirportName] = useState('');

  useEffect(() => {
    fetchArrivals();
    const interval = setInterval(fetchArrivals, 30000);
    return () => clearInterval(interval);
  }, [airportCode]);

  // Écouter les mises à jour temps réel
  useEffect(() => {
    if (socket && airportCode) {
      const handleFlightUpdate = (updatedFlight) => {
        if (updatedFlight.destinationAirportCode === airportCode.toUpperCase() && 
            updatedFlight.type === 'arrival') {
          setFlights(prevFlights => {
            const exists = prevFlights.find(f => f._id === updatedFlight._id);
            if (exists) {
              return prevFlights.map(f => 
                f._id === updatedFlight._id ? updatedFlight : f
              );
            } else {
              return [updatedFlight, ...prevFlights].sort((a, b) => 
                new Date(a.scheduledArrival) - new Date(b.scheduledArrival)
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
      };
    }
  }, [socket, airportCode]);

  const fetchArrivals = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/public/flights/${airportCode.toUpperCase()}/arrivals`
      );
      setFlights(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement arrivées:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="display-container">
        <div className="display-loading">
          <div>
            <div className="display-loading-spinner"></div>
            <p>Chargement des arrivées...</p>
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
        type="arrivals"
      />

      <div className="display-scroll-container">
        {/* En-têtes de colonnes */}
        <div className="display-table-header">
          <div className="col-span-2">VOL</div>
          <div className="col-span-3">ORIGINE</div>
          <div className="col-span-2">HEURE PRÉVUE</div>
          <div className="col-span-2">HEURE ESTIMÉE</div>
          <div className="col-span-2">STATUT</div>
        </div>

        {/* Lignes de vols */}
        {flights.length === 0 ? (
          <div className="display-empty">
            <Plane className="h-24 w-24 mb-4 opacity-50" />
            <p className="text-2xl">Aucune arrivée prévue pour aujourd'hui</p>
          </div>
        ) : (
          <div>
            {flights.map((flight, index) => (
              <FlightBoardRow
                key={flight._id}
                flight={flight}
                type="arrival"
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArrivalBoard;
