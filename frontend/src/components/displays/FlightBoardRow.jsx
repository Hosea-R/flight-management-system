import { format } from 'date-fns';
import { PlaneTakeoff, PlaneLanding } from 'lucide-react';
import StatusIndicator from './StatusIndicator';

const FlightBoardRow = ({ flight, type = 'departure', index }) => {
  const isArrival = type === 'arrival';
  
  const getTime = () => {
    if (isArrival) {
      return flight.actualArrival || flight.estimatedArrival || flight.scheduledArrival;
    }
    return flight.actualDeparture || flight.estimatedDeparture || flight.scheduledDeparture;
  };

  const getScheduledTime = () => {
    return isArrival ? flight.scheduledArrival : flight.scheduledDeparture;
  };

  const getEstimatedTime = () => {
    return isArrival ? flight.estimatedArrival : flight.estimatedDeparture;
  };

  const location = isArrival ? flight.originAirportCode : flight.destinationAirportCode;
  const locationCity = isArrival 
    ? (flight.originAirport?.city || flight.originAirportCode) 
    : (flight.destinationAirport?.city || flight.destinationAirportCode);
  
  const isDelayed = flight.status === 'delayed';
  const isCancelled = flight.status === 'cancelled';

  return (
    <div
      className="display-row"
      style={{
        animationDelay: `${index * 0.04}s`
      }}
    >
      <div className="display-row-content">
        {/* 1. Vol & Compagnie + Icône Type */}
        <div className="flex items-center space-x-4">
          {/* Icône Départ/Arrivée */}
          <div className={`flex-shrink-0 p-2 rounded-lg border ${
            isArrival 
              ? 'bg-emerald-50 border-emerald-100' 
              : 'bg-blue-50 border-blue-100'
          }`}>
            {isArrival ? (
              <PlaneLanding className={`h-6 w-6 ${isArrival ? 'text-emerald-600' : 'text-blue-600'}`} strokeWidth={2} />
            ) : (
              <PlaneTakeoff className={`h-6 w-6 ${isArrival ? 'text-emerald-600' : 'text-blue-600'}`} strokeWidth={2} />
            )}
          </div>

          {flight.airlineId?.logo ? (
            <div className="h-20 w-20 bg-white rounded-lg border border-slate-100 p-1 flex items-center justify-center shadow-sm">
              <img
                src={flight.airlineId.logo}
                alt={flight.airlineId.name}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="h-20 w-20 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
              <span className="text-xl font-bold text-slate-500 font-mono">
                {flight.airlineId?.code || 'XX'}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-flight-number text-slate-900 text-2xl tracking-wider">
              {flight.airlineId?.code}{flight.flightNumber}
            </span>
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider leading-tight">
              {flight.airlineId?.name}
            </span>
          </div>
        </div>

        {/* 2. Destination / Origine - Nom de Ville */}
        <div>
          <div className="text-airport-code text-slate-900">
            {locationCity}
          </div>
          <div className="text-city-name mt-1">
            {isArrival ? 'Provenance' : 'Destination'}
          </div>
        </div>

        {/* 3. Heure Prévue */}
        <div className="text-time text-slate-500">
          {format(new Date(getScheduledTime()), 'HH:mm')}
        </div>

        {/* 4. Heure Estimée/Réelle */}
        <div className={`text-time font-bold ${
          isDelayed ? 'text-amber-600' : 
          isCancelled ? 'text-rose-600 line-through decoration-2' : 
          'text-slate-900'
        }`}>
          {isCancelled ? '--:--' : 
           getEstimatedTime() ? format(new Date(getTime()), 'HH:mm') : 
           format(new Date(getScheduledTime()), 'HH:mm')}
        </div>

        {/* 5. Statut */}
        <div>
          <StatusIndicator status={flight.status} />
        </div>
      </div>
    </div>
  );
};

export default FlightBoardRow;
