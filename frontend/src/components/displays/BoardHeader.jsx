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
        <div className="flex items-center space-x-6">
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 shadow-sm">
            <Plane className="h-8 w-8 text-blue-600" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none font-mono">
              {airportCode}
            </h1>
            <p className="text-base text-slate-500 font-medium mt-1 tracking-widest uppercase">
              {airportName || 'Aéroport International'}
            </p>
          </div>
        </div>

        {/* Titre */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h2 className="text-3xl font-bold text-slate-800 tracking-[0.2em] uppercase border-b-2 border-blue-500/30 pb-1">
            {getTitle()}
          </h2>
        </div>

        {/* Horloge */}
        <div className="text-right">
          <Clock />
        </div>
      </div>
    </div>
  );
};

export default BoardHeader;
