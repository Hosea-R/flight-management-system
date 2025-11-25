import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import advertisementService from '../../services/advertisementService';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AdCarousel = ({ className = '', displayMode = 'half-screen' }) => {
  const { activeAirport } = useAuth();
  const [advertisements, setAdvertisements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetchAdvertisements();
  }, [activeAirport, displayMode]);

  useEffect(() => {
    if (advertisements.length === 0) return;

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
          nextSlide();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, advertisements]);

  const fetchAdvertisements = async () => {
    try {
      const ads = await advertisementService.getActiveAdvertisements(activeAirport);
      
      // Filtrer les pubs selon le displayMode
      const filteredAds = ads.filter(ad => 
        (ad.displayMode || 'half-screen') === displayMode
      );
      
      // advertisementService retourne maintenant directement le tableau
      setAdvertisements(filteredAds || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
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
  
  // Classes CSS adaptatives selon le mode
  const containerClasses = displayMode === 'full-screen'
    ? `fixed inset-0 z-50 ${className}` // Full-screen occupe tout l'écran
    : `relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg ${className}`; // Half-screen

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
                displayMode === 'full-screen' ? 'text-5xl md:text-7xl' : 'text-2xl md:text-4xl'
              }`}>
                {currentAd.textContent}
              </p>
            </div>
          </div>
        )}

        {/* Overlay avec titre et contrôles */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent ${
          displayMode === 'full-screen' ? 'p-8' : 'p-4'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className={`text-white font-bold ${
                displayMode === 'full-screen' ? 'text-3xl' : 'text-lg'
              }`}>{currentAd.title}</h3>
              {advertisements.length > 1 && ( <div className={`flex items-center gap-2 ${
                displayMode === 'full-screen' ? 'mt-4' : 'mt-2'
              }`}>
                {advertisements.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all ${
                      index === currentIndex
                        ? displayMode === 'full-screen' ? 'w-12 bg-white' : 'w-8 bg-white'
                        : displayMode === 'full-screen' ? 'w-6 bg-white/40' : 'w-4 bg-white/40'
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
                    displayMode === 'full-screen' ? 'p-4' : 'p-2'
                  }`}
                  title="Précédent"
                >
                  <ChevronLeft className={displayMode === 'full-screen' ? 'w-8 h-8 text-white' : 'w-5 h-5 text-white'} />
                </button>
                <button
                  onClick={nextSlide}
                  className={`bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors ${
                    displayMode === 'full-screen' ? 'p-4' : 'p-2'
                  }`}
                  title="Suivant"
                >
                  <ChevronRight className={displayMode === 'full-screen' ? 'w-8 h-8 text-white' : 'w-5 h-5 text-white'} />
                </button>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className={`bg-white/20 rounded-full overflow-hidden ${
            displayMode === 'full-screen' ? 'mt-4 h-2' : 'mt-3 h-1'
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
