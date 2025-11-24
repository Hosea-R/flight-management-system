import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import useSocket from '../../hooks/useSocket';
import useFlightFiltering from '../../hooks/useFlightFiltering';
import BoardHeader from '../../components/displays/BoardHeader';
import FlightBoardRow from '../../components/displays/FlightBoardRow';
import {  Plane } from 'lucide-react';
import Loading from '../../components/common/Loading';
import { formatAirportName } from '../../utils/formatters';
import '../../styles/display.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const GeneralBoard = () => {
  const { airportCode } = useParams();
  const { socket } = useSocket();
  const [departures, setDepartures] = useState([]);
  const [arrivals, setArrivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [airportName, setAirportName] = useState('');

  // Appliquer le filtrage et le tri
  const visibleDepartures = useFlightFiltering(departures);
  const visibleArrivals = useFlightFiltering(arrivals);

  useEffect(() => {
    fetchAllFlights();
    const interval = setInterval(fetchAllFlights, 30000);
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
        const code = airportCode.toUpperCase();
        
        // Mise à jour des départs
        if (updatedFlight.originAirportCode === code && updatedFlight.type === 'departure') {
          setDepartures(prev => {
            const exists = prev.find(f => f._id === updatedFlight._id);
            if (exists) {
              return prev.map(f => f._id === updatedFlight._id ? updatedFlight : f);
            } else {
              return [updatedFlight, ...prev];
            }
          });
        }
        
        // Mise à jour des arrivées
        if (updatedFlight.destinationAirportCode === code && updatedFlight.type === 'arrival') {
          setArrivals(prev => {
            const exists = prev.find(f => f._id === updatedFlight._id);
            if (exists) {
              return prev.map(f => f._id === updatedFlight._id ? updatedFlight : f);
            } else {
              return [updatedFlight, ...prev];
            }
          });
        }
      };

      const handleFlightDelete = (data) => {
        const flightId = data.flightId || data;
        setDepartures(prev => prev.filter(f => f._id !== flightId));
        setArrivals(prev => prev.filter(f => f._id !== flightId));
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
      
      if (response.data.airport) {
        setAirportName(formatAirportName(response.data.airport));
      }
      
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
        {/* Header unique pour tous les vols */}
        <div className="display-table-header">
          <div className="col-span-3">VOL</div>
          <div className="col-span-3">DESTINATION / ORIGINE</div>
          <div className="col-span-2">PROGRAMMÉ</div>
          <div className="col-span-2">PRÉVU</div>
          <div className="col-span-2">STATUT</div>
        </div>

        {/* Départs */}
        <div>
          <div className="display-section-header">
            <Plane className="h-6 w-6" />
            <span>Départs</span>
          </div>

          {visibleDepartures.length === 0 ? (
            <div className="display-empty py-8">
              <p className="text-lg">Aucun départ</p>
            </div>
          ) : (
            <div>
              {visibleDepartures.map((flight, index) => (
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

        {/* Arrivées */}
        <div>
          <div className="display-section-header">
            <Plane className="h-6 w-6 transform rotate-180" />
            <span>Arrivées</span>
          </div>

          {visibleArrivals.length === 0 ? (
            <div className="display-empty py-8">
              <p className="text-lg">Aucune arrivée</p>
            </div>
          ) : (
            <div>
              {visibleArrivals.map((flight, index) => (
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
