import { Plane, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

const RecentFlights = ({ flights, type = 'departure', title }) => {
  if (!flights || flights.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8 text-gray-500">
          <Plane className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Aucun vol disponible</p>
        </div>
      </div>
    );
  }

  const isArrival = type === 'arrival';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {flights.map((flight) => {
          const scheduledTime = isArrival ? flight.scheduledArrival : flight.scheduledDeparture;
          const estimatedTime = isArrival ? flight.estimatedArrival : flight.estimatedDeparture;
          const location = isArrival ? flight.originAirportCode : flight.destinationAirportCode;

          return (
            <div
              key={flight._id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Logo et numéro de vol */}
              <div className="flex items-center space-x-3 flex-1">
                {flight.airlineId?.logo ? (
                  <img
                    src={flight.airlineId.logo}
                    alt={flight.airlineId.name}
                    className="h-8 w-8 object-contain bg-white rounded p-1"
                  />
                ) : (
                  <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center">
                    <Plane className="h-4 w-4 text-blue-600" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900">
                    {flight.airlineId?.code}{flight.flightNumber}
                  </p>
                  <p className="text-xs text-gray-500">{flight.airlineId?.name}</p>
                </div>
              </div>

              {/* Destination */}
              <div className="flex items-center space-x-2 flex-1">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="font-semibold text-gray-700">{location}</span>
              </div>

              {/* Heure */}
              <div className="flex items-center space-x-2 flex-1 justify-center">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="font-mono text-sm font-medium text-gray-900">
                  {format(new Date(estimatedTime || scheduledTime), 'HH:mm')}
                </span>
              </div>

              {/* Statut */}
              <div className="flex-1 text-right">
                <span
                  className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                    flight.status === 'delayed'
                      ? 'bg-orange-100 text-orange-800'
                      : flight.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : flight.status === 'boarding'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {flight.status === 'delayed'
                    ? 'Retardé'
                    : flight.status === 'cancelled'
                    ? 'Annulé'
                    : flight.status === 'boarding'
                    ? 'Embarquement'
                    : 'À l\'heure'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentFlights;
