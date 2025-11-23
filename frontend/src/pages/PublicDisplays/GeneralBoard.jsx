import React, { useState, useEffect } from 'react';
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

  // Fusionner et trier tous les vols par ordre chronologique
  const allFlights = React.useMemo(() => {
    const combined = [
      ...departures.map(f => ({ ...f, displayType: 'departure' })),
      ...arrivals.map(f => ({ ...f, displayType: 'arrival' }))
    ];
    
    // Trier par heure (départ ou arrivée selon le type)
    return combined.sort((a, b) => {
      const timeA = a.displayType === 'departure' 
        ? new Date(a.scheduledDeparture) 
        : new Date(a.scheduledArrival);
      const timeB = b.displayType === 'departure'
        ? new Date(b.scheduledDeparture)
        : new Date(b.scheduledArrival);
      return timeA - timeB;
    });
  }, [departures, arrivals]);

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
        {/* Header unique pour tous les vols */}
        <div className="display-table-header">
          <div className="col-span-2">VOL</div>
          <div className="col-span-3">DESTINATION / ORIGINE</div>
          <div className="col-span-2">HEURE PRÉVUE</div>
          <div className="col-span-2">HEURE ESTIMÉE</div>
          <div className="col-span-2">STATUT</div>
        </div>

        {/* Tous les vols mélangés */}
        {allFlights.length === 0 ? (
          <div className="display-empty">
            <Plane className="h-24 w-24 mb-4 opacity-50" />
            <p className="text-2xl">Aucun vol prévu pour aujourd'hui</p>
          </div>
        ) : (
          <div>
            {allFlights.slice(0, 20).map((flight, index) => (
              <FlightBoardRow
                key={flight._id}
                flight={flight}
                type={flight.displayType}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GeneralBoard;
