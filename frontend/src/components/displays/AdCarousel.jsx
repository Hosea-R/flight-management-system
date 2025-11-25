import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import advertisementService from '../../services/advertisementService';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const AdCarousel = ({ className = '' }) => {
  const { activeAirport } = useAuth();
  const [advertisements, setAdvertisements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetchAdvertisements();
  }, [activeAirport]);

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
      const response = await advertisementService.getActiveAdvertisements(activeAirport);
      setAdvertisements(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
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

  return (
    <div className={`relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg ${className}`}>
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
              <p className="text-white text-2xl md:text-4xl font-bold leading-relaxed animate-pulse">
                {currentAd.textContent}
              </p>
            </div>
          </div>
        )}

        {/* Overlay avec titre et contrôles */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg">{currentAd.title}</h3>
              {advertisements.length > 1 && ( <div className="flex items-center gap-2 mt-2">
                {advertisements.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-8 bg-white'
                        : 'w-4 bg-white/40'
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
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                  title="Précédent"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={nextSlide}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                  title="Suivant"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-white/20 rounded-full overflow-hidden">
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
