import { useState, useEffect } from 'react';
import { Play, Pause, AlertOctagon, ExternalLink, Image as ImageIcon, Video, Type } from 'lucide-react';
import { Link } from 'react-router-dom';
import advertisementService from '../../services/advertisementService';
import Card from '../common/Card';
import Button from '../common/Button';

const LiveAdsWidget = ({ airportCode }) => {
  const [activeAds, setActiveAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveAds();
  }, [airportCode]);

  const fetchActiveAds = async () => {
    try {
      // Récupérer toutes les pubs actives
      const ads = await advertisementService.getActiveAdvertisements();
      
      // Filtrer pour l'aéroport actuel (si spécifié)
      const filtered = airportCode 
        ? ads.filter(ad => ad.showOnAllAirports || ad.airports.includes(airportCode))
        : ads;
        
      setActiveAds(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching active ads:', error);
      setLoading(false);
    }
  };

  const handleEmergencyStop = async (adId, title) => {
    if (window.confirm(`Êtes-vous sûr de vouloir arrêter d'urgence la publicité "${title}" ?\nElle sera désactivée immédiatement.`)) {
      try {
        await advertisementService.updateAdvertisement(adId, { isActive: false });
        // Rafraîchir la liste
        fetchActiveAds();
      } catch (error) {
        console.error('Error stopping ad:', error);
        alert('Erreur lors de l\'arrêt de la publicité');
      }
    }
  };

  if (loading) {
    return (
      <Card header={<h2 className="text-lg font-bold text-slate-900">Diffusion Publicitaire</h2>}>
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-slate-100 rounded-xl"></div>
          <div className="h-16 bg-slate-100 rounded-xl"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
            </div>
            <h2 className="text-lg font-bold text-slate-900">En Direct</h2>
          </div>
          <Link to="/ad-manager" className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
            Gérer <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      }
    >
      <div className="space-y-4">
        {activeAds.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500 text-sm">Aucune publicité en cours de diffusion</p>
            <Link to="/ad-manager/advertisements?action=new" className="text-purple-600 text-sm font-medium mt-2 inline-block hover:underline">
              Planifier une campagne
            </Link>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {activeAds.map(ad => (
              <div key={ad._id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all group">
                {/* Preview */}
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center border border-slate-200">
                  {ad.type === 'image' && ad.mediaUrl ? (
                    <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover" />
                  ) : ad.type === 'video' && ad.mediaUrl ? (
                    <video src={ad.mediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <Type className="w-6 h-6 text-slate-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 truncate">{ad.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      {ad.type === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                      {ad.duration}s
                    </span>
                    <span>•</span>
                    <span>Prio: {ad.priority}</span>
                  </div>
                </div>

                {/* Actions */}
                <button
                  onClick={() => handleEmergencyStop(ad._id, ad.title)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Arrêt d'urgence"
                >
                  <AlertOctagon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {activeAds.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-400 text-center">
              {activeAds.length} publicité{activeAds.length > 1 ? 's' : ''} en rotation automatique
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default LiveAdsWidget;
