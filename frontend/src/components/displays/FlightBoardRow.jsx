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
        <div className="flex items-center space-x-3">
          {/* Icône Départ/Arrivée */}
          <div className={`flex-shrink-0 p-2 rounded-lg ${
            isArrival 
              ? 'bg-gradient-to-br from-emerald-500 to-teal-500' 
              : 'bg-gradient-to-br from-indigo-500 to-violet-500'
          }`}>
            {isArrival ? (
              <PlaneLanding className="h-5 w-5 text-white" strokeWidth={2.5} />
            ) : (
              <PlaneTakeoff className="h-5 w-5 text-white" strokeWidth={2.5} />
            )}
          </div>

          {flight.airlineId?.logo ? (
            <div className="h-10 w-10 bg-white rounded-md border border-slate-200 p-1.5 flex items-center justify-center">
              <img
                src={flight.airlineId.logo}
                alt={flight.airlineId.name}
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="h-10 w-10 bg-slate-100 rounded-md flex items-center justify-center">
              <span className="text-xs font-bold text-slate-600">
                {flight.airlineId?.code || 'XX'}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-flight-number">
              {flight.airlineId?.code}{flight.flightNumber}
            </span>
            <span className="text-xs text-slate-500 font-medium truncate max-w-[140px]">
              {flight.airlineId?.name}
            </span>
          </div>
        </div>

        {/* 2. Destination / Origine - Nom de Ville */}
        <div>
          <div className="text-airport-code">
            {locationCity}
          </div>
        </div>

        {/* 3. Heure Prévue */}
        <div className="text-time text-slate-500">
          {format(new Date(getScheduledTime()), 'HH:mm')}
        </div>

        {/* 4. Heure Estimée/Réelle */}
        <div className={`text-time font-bold ${
          isDelayed ? 'text-orange-600' : 
          isCancelled ? 'text-red-600 line-through' : 
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
