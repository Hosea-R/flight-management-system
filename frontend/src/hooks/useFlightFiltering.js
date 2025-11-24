import { useMemo } from 'react';

/**
 * Hook personnalisé pour filtrer et trier les vols sur les écrans publics
 * Applique le filtrage côté client et le tri par priorité
 */
const useFlightFiltering = (flights = []) => {
  
  const filteredAndSortedFlights = useMemo(() => {
    if (!Array.isArray(flights) || flights.length === 0) {
      return [];
    }

    const now = new Date();

    // 1. FILTRAGE : Masquer les vols terminés selon les règles
    const visibleFlights = flights.filter(flight => {
      const status = flight.status;
      
      // departed : masquer après 30min
      if (status === 'departed' && flight.actualDeparture) {
        const minutesSinceDeparture = (now - new Date(flight.actualDeparture)) / (1000 * 60);
        if (minutesSinceDeparture > 30) return false;
      }

      // landed : masquer après 30min
      if (status === 'landed' && flight.actualArrival) {
        const minutesSinceLanding = (now - new Date(flight.actualArrival)) / (1000 * 60);
        if (minutesSinceLanding > 30) return false;
      }

      // cancelled : masquer après 2h
      if (status === 'cancelled') {
        const scheduledTime = flight.type === 'departure' 
          ? new Date(flight.scheduledDeparture)
          : new Date(flight.scheduledArrival);
        const hoursSinceScheduled = (now - scheduledTime) / (1000 * 60 * 60);
        if (hoursSinceScheduled > 2) return false;
      }

      return true;
    });

    // 2. TRI : Par priorité puis par heure
    const sortedFlights = [...visibleFlights].sort((a, b) => {
      // Priorité 1 : BOARDING en premier
      if (a.status === 'boarding' && b.status !== 'boarding') return -1;
      if (b.status === 'boarding' && a.status !== 'boarding') return 1;

      // Priorité 2 : DELAYED ensuite
      if (a.status === 'delayed' && b.status !== 'delayed' && b.status !== 'boarding') return -1;
      if (b.status === 'delayed' && a.status !== 'delayed' && a.status !== 'boarding') return 1;

      // Priorité 3 : Trier par heure programmée (croissant)
      const timeA = a.type === 'departure'
        ? new Date(a.scheduledDeparture)
        : new Date(a.scheduledArrival);
      
      const timeB = b.type === 'departure'
        ? new Date(b.scheduledDeparture)
        : new Date(b.scheduledArrival);

      return timeA - timeB;
    });

    return sortedFlights;
  }, [flights]);

  return filteredAndSortedFlights;
};

export default useFlightFiltering;
