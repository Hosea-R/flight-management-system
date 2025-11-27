import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import useSocket from '../../hooks/useSocket';
import useFlightFiltering from '../../hooks/useFlightFiltering';
import BoardHeader from '../../components/displays/BoardHeader';
import FlightBoardRow from '../../components/displays/FlightBoardRow';
import AdCarousel from '../../components/displays/AdCarousel';
import { Plane } from 'lucide-react';
import { formatAirportName } from '../../utils/formatters';
import '../../styles/display.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DepartureBoard = () => {
  const { airportCode } = useParams();
  const { socket } = useSocket();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [airportName, setAirportName] = useState('');
  const [currentAdMode, setCurrentAdMode] = useState(null);

  const visibleFlights = useFlightFiltering(flights);

  useEffect(() => {
    fetchDepartures();
    const interval = setInterval(fetchDepartures, 30000);
    return () => clearInterval(interval);
  }, [airportCode]);

  useEffect(() => {
    if (socket && airportCode) {
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
      };
    }
  }, [socket, airportCode]);

  const fetchDepartures = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/public/flights/${airportCode.toUpperCase()}/departures`
      );
      setFlights(response.data.data);
      
      if (response.data.airport) {
        setAirportName(formatAirportName(response.data.airport));
      }

      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement départs:', error);
      setLoading(false);
    }
  };

  const renderFlightsList = () => (
    <div className="display-scroll-container">
      <div className="display-table-header">
        <div className="col-span-3">VOL</div>
        <div className="col-span-3">DESTINATION</div>
        <div className="col-span-2">PROGRAMMÉ</div>
        <div className="col-span-2">DÉPART PRÉVU</div>
        <div className="col-span-2">STATUT</div>
      </div>

      {visibleFlights.length === 0 ? (
        <div className="display-empty">
          <Plane className="h-24 w-24 mb-4 opacity-50" />
          <p className="text-2xl">Aucun départ prévu pour aujourd'hui</p>
        </div>
      ) : (
        <div>
          {visibleFlights.map((flight, index) => (
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
  );

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
      {/* En-tête caché en mode full-screen */}
      {currentAdMode !== 'full-screen' && (
        <BoardHeader
          airportCode={airportCode.toUpperCase()}
          airportName={airportName}
          type="departures"
        />
      )}

      <div className={
        currentAdMode === 'full-screen' 
          ? "fixed inset-0 z-50" // Full-screen : occupe tout l'écran
          : currentAdMode === 'half-screen'
          ? "flex h-[calc(100vh-80px)]"
          : "flex flex-col"
      }>
        {/* Zone publicitaire unique */}
        <div className={
          currentAdMode === 'full-screen'
            ? "w-full h-full"
            : currentAdMode === 'half-screen'
            ? "w-1/2 flex items-center justify-center bg-slate-900"
            : "px-6 py-3"
        }>
          <AdCarousel 
            className={currentAdMode === 'full-screen' ? 'w-full h-full' : currentAdMode === 'half-screen' ? 'w-full h-full' : 'h-48'}
            airportCode={airportCode} 
            onDisplayModeChange={setCurrentAdMode}
          />
        </div>

        {/* Zone des vols (cachée en mode full-screen) */}
        {currentAdMode !== 'full-screen' && (
          <div className={currentAdMode === 'half-screen' ? "w-1/2 overflow-auto" : "flex-1"}>
            {renderFlightsList()}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartureBoard;
