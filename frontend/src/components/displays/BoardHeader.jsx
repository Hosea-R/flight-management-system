import { Plane } from 'lucide-react';
import Clock from './Clock';

const BoardHeader = ({ airportCode, airportName, type }) => {
  const getTitle = () => {
    switch (type) {
      case 'arrivals':
        return 'Arrivées';
      case 'departures':
        return 'Départs';
      case 'general':
        return 'Vols';
      default:
        return 'Vols';
    }
  };

  return (
    <div className="display-header">
      <div className="flex items-center justify-between px-10 py-6">
        {/* Logo et Nom */}
        <div className="flex items-center space-x-5">
          <div className="bg-blue-500 p-2.5 rounded-lg">
            <Plane className="h-7 w-7 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight leading-none">
              {airportCode}
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-0.5">
              {airportName || 'Aéroport International'}
            </p>
          </div>
        </div>

        {/* Titre */}
        <div>
          <h2 className="text-2xl font-semibold text-slate-700">
            {getTitle()}
          </h2>
        </div>

        {/* Horloge */}
        <Clock />
      </div>
    </div>
  );
};

export default BoardHeader;
