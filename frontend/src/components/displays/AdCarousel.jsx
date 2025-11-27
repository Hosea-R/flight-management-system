import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import advertisementService from '../../services/advertisementService';
import socketService from '../../services/socket';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AdCarousel = ({ className = '', airportCode, onDisplayModeChange }) => {
  const [advertisements, setAdvertisements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isResting, setIsResting] = useState(false); // État de repos entre affichages
  const prevDisplayModeRef = useRef(null);

  useEffect(() => {
    if (!airportCode) {
      console.warn('⚠️  AdCarousel: airportCode manquant');
      setLoading(false);
      return;
    }

    fetchAdvertisements();

    // Rejoindre la room de l'aéroport
    socketService.joinAirport(airportCode);

    // Écouter les mises à jour
    const handleAdUpdate = () => {
      console.log('🔄 Mise à jour des publicités reçue via Socket.io');
      fetchAdvertisements();
    };

    socketService.on('advertisement:created', handleAdUpdate);
    socketService.on('advertisement:updated', handleAdUpdate);
    socketService.on('advertisement:deleted', handleAdUpdate);

    // Vérification périodique toutes les 60 secondes pour les plages horaires
    const pollInterval = setInterval(() => {
      console.log('🔄 Vérification périodique des publicités (plage horaire, quotas...)');
      fetchAdvertisements();
    }, 60000); // 60 secondes

    return () => {
      socketService.off('advertisement:created', handleAdUpdate);
      socketService.off('advertisement:updated', handleAdUpdate);
      socketService.off('advertisement:deleted', handleAdUpdate);
      socketService.leaveAirport(airportCode);
      clearInterval(pollInterval);
    };
  }, [airportCode]);

  // Notifier le parent du displayMode de la pub actuelle
  useEffect(() => {
    if (!onDisplayModeChange) return;

    let newMode = null;
    // Pendant la période de repos, considérer qu'il n'y a pas de pub à afficher
    if (advertisements.length > 0 && !isResting) {
      const currentAd = advertisements[currentIndex];
      newMode = currentAd?.displayMode || 'half-screen';
    }

    // Appeler onDisplayModeChange UNIQUEMENT si le mode a changé
    // Ne pas appeler avec null si on n'avait pas encore de mode (évite de cacher pendant le chargement initial)
    if (prevDisplayModeRef.current !== newMode) {
      // Si on passe de null à null (chargement initial sans pubs), ne rien faire
      if (prevDisplayModeRef.current === null && newMode === null) {
        return;
      }
      
      console.log(`🎨 Changement de mode d'affichage: ${prevDisplayModeRef.current} → ${newMode}`);
      prevDisplayModeRef.current = newMode;
      onDisplayModeChange(newMode);
    }
  }, [currentIndex, advertisements, onDisplayModeChange, isResting]);

  useEffect(() => {
    if (advertisements.length === 0 || isResting) return;

    const currentAd = advertisements[currentIndex];
    setTimeLeft(currentAd?.duration || 10);

    // Incrémenter le compteur de vues
    if (currentAd?._id) {
      advertisementService.incrementViewCount(currentAd._id).catch(() => {});
    }

    // Timer pour passer à la pub suivante
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Si une seule pub, entrer en période de repos
          if (advertisements.length === 1) {
            console.log('💤 Publicité unique terminée - repos de 10 secondes');
            setIsResting(true);
            // Réafficher après 10 secondes
            setTimeout(() => {
              console.log('🔄 Fin du repos - réaffichage de la publicité');
              setIsResting(false);
            }, 10000);
          } else {
            // Plusieurs pubs : passer à la suivante
            nextSlide();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, advertisements, isResting]);

  const fetchAdvertisements = async () => {
    if (!airportCode) return;

    try {
      // Le service retourne maintenant { success, data, count, emergencyMode }
      const response = await advertisementService.getActiveAdvertisements(airportCode);
      
      console.log('📢 Réponse API publicités:', response);
      
      // Vérifier le mode urgence
      if (response.emergencyMode) {
        console.warn('⚠️ Mode urgence activé - publicités désactivées');
        setAdvertisements([]);
        setLoading(false);
        return;
      }
      
      // Récupérer TOUTES les pubs (ne plus filtrer par displayMode)
      const ads = response.data || [];
      
      console.log(`📢 ${ads.length} publicité(s) reçue(s) pour ${airportCode}`);
      
      // Log détaillé de chaque pub
      ads.forEach((ad, index) => {
        console.log(`  Pub ${index + 1}: "${ad.title}" - displayMode: "${ad.displayMode}"`);
      });
      
      setAdvertisements(ads);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur chargement publicités:', error);
      setAdvertisements([]);
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % advertisements.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + advertisements.length) % advertisements.length);
  };

  if (loading || advertisements.length === 0) {
    return null;
  }

  const currentAd = advertisements[currentIndex];
  
  // Classes CSS adaptatives selon le mode de la pub actuelle
  const adDisplayMode = currentAd?.displayMode || 'half-screen';
  const containerClasses = adDisplayMode === 'full-screen'
    ? `w-full h-full ${className}` // Full-screen
    : `relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg ${className}`; // Half-screen ou normal

  return (
    <div className={containerClasses}>
      {/* Contenu de la publicité */}
      <div className="relative h-full">
        {currentAd.type === 'image' && (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <img 
              src={currentAd.mediaUrl} 
              alt={currentAd.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {currentAd.type === 'video' && (
          <video
            key={currentAd._id}
            src={currentAd.mediaUrl}
            autoPlay
            muted
            loop
            className="w-full h-full object-cover"
          />
        )}

        {currentAd.type === 'text' && (
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-8">
            <div className="text-center">
              <p className={`text-white font-bold leading-relaxed animate-pulse ${
                adDisplayMode === 'full-screen' ? 'text-5xl md:text-7xl' : 'text-2xl md:text-4xl'
              }`}>
                {currentAd.textContent}
              </p>
            </div>
          </div>
        )}

        {/* Overlay avec titre et contrôles */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent ${
          adDisplayMode === 'full-screen' ? 'p-8' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className={`text-white font-bold ${
                adDisplayMode === 'full-screen' ? 'text-3xl' : 'text-lg'
              }`}>{currentAd.title}</h3>
              {advertisements.length > 1 && ( <div className={`flex items-center gap-2 ${
                adDisplayMode === 'full-screen' ? 'mt-4' : 'mt-2'
              }`}>
                {advertisements.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all ${
                      index === currentIndex
                        ? adDisplayMode === 'full-screen' ? 'w-12 bg-white' : 'w-8 bg-white'
                        : adDisplayMode === 'full-screen' ? 'w-6 bg-white/40' : 'w-4 bg-white/40'
                    }`}
                  />
                ))}
              </div>
              )}
            </div>

            {advertisements.length > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={prevSlide}
                  className={`bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors ${
                    adDisplayMode === 'full-screen' ? 'p-4' : 'p-2'
                  }`}
                  title="Précédent"
                >
                  <ChevronLeft className={adDisplayMode === 'full-screen' ? 'w-8 h-8 text-white' : 'w-5 h-5 text-white'} />
                </button>
                <button
                  onClick={nextSlide}
                  className={`bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors ${
                    adDisplayMode === 'full-screen' ? 'p-4' : 'p-2'
                  }`}
                  title="Suivant"
                >
                  <ChevronRight className={adDisplayMode === 'full-screen' ? 'w-8 h-8 text-white' : 'w-5 h-5 text-white'} />
                </button>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className={`bg-white/20 rounded-full overflow-hidden ${
            adDisplayMode === 'full-screen' ? 'mt-4 h-2' : 'mt-3 h-1'
          }`}>
            <div
              className="h-full bg-white transition-all duration-1000 ease-linear"
              style={{ width: `${((currentAd.duration - timeLeft) / currentAd.duration) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdCarousel;
