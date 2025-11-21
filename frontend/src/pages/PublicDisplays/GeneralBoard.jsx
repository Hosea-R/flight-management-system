import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import useSocket from '../../hooks/useSocket';
import BoardHeader from '../../components/displays/BoardHeader';
import FlightBoardRow from '../../components/displays/FlightBoardRow';
import { Plane } from 'lucide-react';
import Loading from '../../components/common/Loading';
import '../../styles/display.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const GeneralBoard = () => {
  const { airportCode } = useParams();
  const { socket } = useSocket();
  const [departures, setDepartures] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [airportName, setAirportName] = useState('');

  useEffect(() => {
    fetchAllFlights();
    const interval = setInterval(fetchAllFlights, 30000);
    return () => clearInterval(interval);
  }, [airportCode]);

  // Écouter les mises à jour temps réel
  useEffect(() => {
    if (socket && airportCode) {
      const handleFlightUpdate = (updatedFlight) => {
        const code = airportCode.toUpperCase();
        
        // Mise à jour des départs
        if (updatedFlight.originAirportCode === code && updatedFlight.type === 'departure') {
          setDepartures(prevFlights => {
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
        
        // Mise à jour des arrivées
        if (updatedFlight.destinationAirportCode === code && updatedFlight.type === 'arrival') {
          setArrivals(prevFlights => {
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
        setDepartures(prev => prev.filter(f => f._id !== deletedFlightId));
        setArrivals(prev => prev.filter(f => f._id !== deletedFlightId));
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

  const fetchAllFlights = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/public/flights/${airportCode.toUpperCase()}/all`
      );
      setDepartures(response.data.data.departures);
      setArrivals(response.data.data.arrivals);
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement vols:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen text="Chargement des vols..." />;
  }

  return (
    <div className="display-container">
      <BoardHeader
        airportCode={airportCode.toUpperCase()}
        airportName={airportName}
        type="general"
      />

      <div className="display-scroll-container">
        {/* Section Départs */}
        <div className="display-section">
          <h2 className="display-section-title">DÉPARTS / DEPARTURES</h2>
          
          <div className="display-table-header">
            <div className="col-span-2">VOL</div>
            <div className="col-span-2">DESTINATION</div>
            <div className="col-span-2">HEURE PRÉVUE</div>
            <div className="col-span-2">HEURE ESTIMÉE</div>
            <div className="col-span-3">STATUT</div>
            <div className="col-span-1">INFO</div>
          </div>

          {departures.length === 0 ? (
            <div className="display-empty py-10">
              <p className="text-xl">Aucun départ prévu</p>
            </div>
          ) : (
            <div>
              {departures.slice(0, 10).map((flight, index) => (
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

        {/* Section Arrivées */}
        <div className="display-section">
          <h2 className="display-section-title">ARRIVÉES / ARRIVALS</h2>
          
          <div className="display-table-header">
            <div className="col-span-2">VOL</div>
            <div className="col-span-2">ORIGINE</div>
            <div className="col-span-2">HEURE PRÉVUE</div>
            <div className="col-span-2">HEURE ESTIMÉE</div>
            <div className="col-span-3">STATUT</div>
            <div className="col-span-1">INFO</div>
          </div>

          {arrivals.length === 0 ? (
            <div className="display-empty py-10">
              <p className="text-xl">Aucune arrivée prévue</p>
            </div>
          ) : (
            <div>
              {arrivals.slice(0, 10).map((flight, index) => (
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
    </div>
  );
};

export default GeneralBoard;
