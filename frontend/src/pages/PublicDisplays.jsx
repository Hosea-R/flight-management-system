import { useAuth } from '../context/AuthContext';
import { Plane, Monitor, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const PublicDisplays = () => {
  const { getEffectiveAirportCode } = useAuth();
  const airportCode = getEffectiveAirportCode() || 'TNR';

  const displays = [
    {
      title: 'Écran Départs',
      description: 'Affichage des vols au départ',
      icon: Plane,
      path: `/display/${airportCode}/departures`,
      color: 'blue'
    },
    {
      title: 'Écran Arrivées',
      description: 'Affichage des vols à l\'arrivée',
      icon: Plane,
      path: `/display/${airportCode}/arrivals`,
      color: 'green'
    },
    {
      title: 'Écran Général',
      description: 'Affichage arrivées et départs',
      icon: Monitor,
      path: `/display/${airportCode}/general`,
      color: 'purple'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
      green: 'bg-green-500 hover:bg-green-600 border-green-600',
      purple: 'bg-purple-500 hover:bg-purple-600 border-purple-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Écrans Publics d'Affichage</h1>
        <p className="text-gray-600 mt-2">
          Accédez aux écrans FIDS (Flight Information Display System) pour l'aéroport {airportCode}
        </p>
      </div>

      {/* Grille des écrans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {displays.map((display) => {
          const Icon = display.icon;
          return (
            <Link
              key={display.path}
              to={display.path}
              target="_blank"
              rel="noopener noreferrer"
              className={`
                ${getColorClasses(display.color)}
                text-white rounded-lg p-6 shadow-lg
                transform transition-all duration-200 hover:scale-105
                border-2 flex flex-col items-center text-center
              `}
            >
              <Icon className="h-16 w-16 mb-4" />
              <h3 className="text-xl font-bold mb-2">{display.title}</h3>
              <p className="text-sm opacity-90 mb-4">{display.description}</p>
              <div className="flex items-center text-sm font-semibold">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ouvrir dans un nouvel onglet
              </div>
            </Link>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">📋 Instructions d'utilisation</h2>
        <div className="space-y-3 text-gray-700">
          <div className="flex items-start">
            <span className="font-bold mr-2">1.</span>
            <p>Cliquez sur l'écran que vous souhaitez afficher (Départs, Arrivées ou Général)</p>
          </div>
          <div className="flex items-start">
            <span className="font-bold mr-2">2.</span>
            <p>L'écran s'ouvrira dans un nouvel onglet en mode plein écran</p>
          </div>
          <div className="flex items-start">
            <span className="font-bold mr-2">3.</span>
            <p>Appuyez sur <kbd className="px-2 py-1 bg-gray-200 rounded text-sm font-mono">F11</kbd> pour activer le mode plein écran</p>
          </div>
          <div className="flex items-start">
            <span className="font-bold mr-2">4.</span>
            <p>Les écrans se mettent à jour automatiquement en temps réel via Socket.io</p>
          </div>
        </div>
      </div>

      {/* Informations techniques */}
      <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-3">ℹ️ Informations Techniques</h3>
        <div className="space-y-2 text-blue-800 text-sm">
          <p><strong>Aéroport :</strong> {airportCode}</p>
          <p><strong>Mise à jour :</strong> Temps réel (Socket.io + Polling 30s)</p>
          <p><strong>Résolution recommandée :</strong> 1920x1080 ou supérieur</p>
          <p><strong>URLs directes :</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1 font-mono text-xs">
            <li>{window.location.origin}/display/{airportCode}/departures</li>
            <li>{window.location.origin}/display/{airportCode}/arrivals</li>
            <li>{window.location.origin}/display/{airportCode}/general</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PublicDisplays;
