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
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const prevDisplayModeRef = useRef(null);
  const lastDisplayTimeRef = useRef({}); // Stocke la dernière fois que chaque pub a été affichée

  useEffect(() => {
    if (!airportCode) {
      console.warn('⚠️  AdCarousel: airportCode manquant');
      setLoading(false);
      return;
    }

    fetchAdvertisements();

    socketService.joinAirport(airportCode);

    const handleAdUpdate = () => {
      console.log('🔄 Mise à jour des publicités reçue via Socket.io');
      fetchAdvertisements();
    };

    socketService.on('advertisement:created', handleAdUpdate);
    socketService.on('advertisement:updated', handleAdUpdate);
    socketService.on('advertisement:deleted', handleAdUpdate);

    const pollInterval = setInterval(() => {
      console.log('🔄 Vérification périodique des publicités (plage horaire, quotas...)');
      fetchAdvertisements();
    }, 60000);

    return () => {
      socketService.off('advertisement:created', handleAdUpdate);
      socketService.off('advertisement:updated', handleAdUpdate);
      socketService.off('advertisement:deleted', handleAdUpdate);
      socketService.leaveAirport(airportCode);
      clearInterval(pollInterval);
    };
  }, [airportCode]);

  useEffect(() => {
    if (!onDisplayModeChange) return;

    let newMode = null;
    if (advertisements.length > 0 && !isResting) {
      const currentAd = advertisements[currentIndex];
      newMode = currentAd?.displayMode || 'half-screen';
    }

    if (prevDisplayModeRef.current !== newMode) {
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
    const adDuration = currentAd?.duration || 10;
    setTimeLeft(adDuration);

    // Marquer le temps d'affichage pour cette pub
    if (currentAd?._id) {
      lastDisplayTimeRef.current[currentAd._id] = Date.now();
      advertisementService.incrementViewCount(currentAd._id).catch(() => {});
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (advertisements.length === 1) {
            // Calculer le temps de repos selon minDisplayInterval
            const minInterval = (currentAd?.minDisplayInterval || 0) * 1000; // Convertir en ms
            const restDuration = Math.max(minInterval, 10000); // Minimum 10s
            
            console.log(`💤 Publicité unique terminée - repos de ${restDuration/1000} secondes (minDisplayInterval: ${currentAd?.minDisplayInterval || 0}s)`);
            
            setRestTimeLeft(Math.floor(restDuration / 1000));
            setIsResting(true);
            
            setTimeout(() => {
              console.log('🔄 Fin du repos - réaffichage de la publicité');
              setIsResting(false);
              setRestTimeLeft(0);
            }, restDuration);
          } else {
            nextSlide();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, advertisements, isResting]);

  // Timer pour le temps de repos
  useEffect(() => {
    if (!isResting || restTimeLeft <= 0) return;

    const restTimer = setInterval(() => {
      setRestTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(restTimer);
  }, [isResting, restTimeLeft]);

  const fetchAdvertisements = async () => {
    if (!airportCode) return;

    try {
      console.log('📢 Fetch publicités pour:', airportCode);
      
      const response = await advertisementService.getActiveAdvertisements(airportCode);
      
      console.log('📢 Réponse API complète:', response);
      
      if (response.emergencyMode) {
        console.warn('⚠️ Mode urgence activé - publicités désactivées');
        setAdvertisements([]);
        setLoading(false);
        return;
      }
      
      const ads = response.data || [];
      
      console.log(`📢 ${ads.length} publicité(s) reçue(s) pour ${airportCode}`);
      
      // NE PLUS FILTRER PAR displayMode ICI - Afficher toutes les pubs actives
      console.log('🔍 Publicités avant filtrage:', ads.map(ad => ({
        title: ad.title,
        displayMode: ad.displayMode,
        isActive: ad.isActive,
        displayLimit: ad.displayLimit,
        currentDisplays: ad.currentDisplays
      })));

      // Vérifier si les pubs respectent leurs contraintes de planification
      const now = new Date();
      const validAds = ads.filter(ad => {
        // Vérifier le quota d'affichages
        if (ad.displayLimit && ad.currentDisplays >= ad.displayLimit) {
          console.log(`❌ Pub "${ad.title}" a atteint son quota (${ad.currentDisplays}/${ad.displayLimit})`);
          return false;
        }

        // Vérifier l'intervalle minimum entre affichages
        if (ad.minDisplayInterval && lastDisplayTimeRef.current[ad._id]) {
          const timeSinceLastDisplay = (Date.now() - lastDisplayTimeRef.current[ad._id]) / 1000; // En secondes
          if (timeSinceLastDisplay < ad.minDisplayInterval) {
            const remaining = Math.ceil(ad.minDisplayInterval - timeSinceLastDisplay);
            console.log(`❌ Pub "${ad.title}" doit attendre ${remaining}s avant réaffichage (minDisplayInterval: ${ad.minDisplayInterval}s)`);
            return false;
          }
        }

        // Vérifier les heures d'affichage
        if (ad.displayHours && ad.displayHours.startHour !== undefined && ad.displayHours.endHour !== undefined) {
          const currentHour = now.getHours();
          const { startHour, endHour } = ad.displayHours;
          
          if (startHour <= endHour) {
            // Plage normale (ex: 8h-18h)
            if (currentHour < startHour || currentHour >= endHour) {
              console.log(`❌ Pub "${ad.title}" hors plage horaire (${startHour}h-${endHour}h, actuellement ${currentHour}h)`);
              return false;
            }
          } else {
            // Plage qui traverse minuit (ex: 22h-6h)
            if (currentHour < startHour && currentHour >= endHour) {
              console.log(`❌ Pub "${ad.title}" hors plage horaire nocturne (${startHour}h-${endHour}h, actuellement ${currentHour}h)`);
              return false;
            }
          }
        }

        console.log(`✅ Pub "${ad.title}" valide pour affichage`);
        return true;
      });

      console.log(`📢 ${validAds.length} publicité(s) valide(s) après filtrage`);
      
      validAds.forEach((ad, index) => {
        console.log(`  Pub ${index + 1}: "${ad.title}" - displayMode: "${ad.displayMode}"`);
      });
      
      setAdvertisements(validAds);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erreur chargement publicités:', error);
      console.error('Error details:', error.response?.data || error.message);
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

  if (loading) {
    console.log('⏳ AdCarousel: Chargement en cours...');
    return null;
  }

  if (advertisements.length === 0) {
    console.log('📢 AdCarousel: Aucune publicité à afficher');
    // Notifier le parent qu'il n'y a pas de pub
    if (onDisplayModeChange && prevDisplayModeRef.current !== null) {
      prevDisplayModeRef.current = null;
      onDisplayModeChange(null);
    }
    return null;
  }

  // Pendant le repos, masquer la publicité
  if (isResting) {
    console.log(`💤 Mode repos actif (${restTimeLeft}s restantes)`);
    // Notifier le parent qu'il n'y a pas de pub temporairement
    if (onDisplayModeChange && prevDisplayModeRef.current !== null) {
      prevDisplayModeRef.current = null;
      onDisplayModeChange(null);
    }
    return null;
  }

  const currentAd = advertisements[currentIndex];
  console.log('📢 Publicité actuelle:', currentAd?.title, 'displayMode:', currentAd?.displayMode);
  
  const adDisplayMode = currentAd?.displayMode || 'half-screen';
  const containerClasses = adDisplayMode === 'full-screen'
    ? `w-full h-full ${className}`
    : `relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg ${className}`;

  return (
    <div className={containerClasses}>
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
              {advertisements.length > 1 && (
                <div className={`flex items-center gap-2 ${
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