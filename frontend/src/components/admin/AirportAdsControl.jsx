import { useState, useEffect } from 'react';
import { Play, Pause, Calendar, Clock, Image as ImageIcon, Video, Type, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import advertisementService from '../../services/advertisementService';
import Card from '../common/Card';
import Button from '../common/Button';

const AirportAdsControl = ({ airportCode }) => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editDates, setEditDates] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchAds();
  }, [airportCode]);

  const fetchAds = async () => {
    try {
      // showExpired=true permet de récupérer TOUTES les pubs (futures, passées, inactives)
      // On filtre ensuite par aéroport si nécessaire
      const allAds = await advertisementService.getAllAdvertisements({ 
        airport: airportCode,
        showExpired: 'true' 
      });
      setAds(allAds);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ads:', error);
      setLoading(false);
    }
  };

  const toggleStatus = async (ad) => {
    try {
      await advertisementService.updateAdvertisement(ad._id, { isActive: !ad.isActive });
      fetchAds();
    } catch (error) {
      console.error('Error toggling status:', error);
      alert('Erreur lors de la modification du statut');
    }
  };

  const startEditing = (ad) => {
    setEditingId(ad._id);
    setEditDates({
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : '',
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : ''
    });
  };

  const saveDates = async (adId) => {
    try {
      await advertisementService.updateAdvertisement(adId, {
        startDate: editDates.startDate,
        endDate: editDates.endDate || null
      });
      setEditingId(null);
      fetchAds();
    } catch (error) {
      console.error('Error saving dates:', error);
      alert('Erreur lors de la sauvegarde des dates');
    }
  };

  const getStatus = (ad) => {
    if (!ad.isActive) return { label: 'Désactivé', color: 'text-slate-400', bg: 'bg-slate-100', icon: XCircle };
    
    const now = new Date();
    const start = new Date(ad.startDate);
    const end = ad.endDate ? new Date(ad.endDate) : null;

    if (start > now) return { label: 'Planifié', color: 'text-blue-600', bg: 'bg-blue-50', icon: Calendar };
    if (end && end < now) return { label: 'Expiré', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertCircle };
    
    return { label: 'En cours', color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle };
  };

  if (loading) {
    return (
      <Card header={<h2 className="text-lg font-bold text-slate-900">Contrôle Publicitaire</h2>}>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
          <div className="h-12 bg-slate-100 rounded-xl"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card header={<h2 className="text-lg font-bold text-slate-900">Contrôle Publicitaire ({ads.length})</h2>}>
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {ads.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-slate-500 text-sm">Aucune publicité assignée à cet aéroport</p>
          </div>
        ) : (
          ads.map(ad => {
            const status = getStatus(ad);
            const StatusIcon = status.icon;
            const isEditing = editingId === ad._id;

            return (
              <div key={ad._id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-16 h-16 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center border border-slate-200">
                    {ad.type === 'image' && ad.mediaUrl ? (
                      <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover" />
                    ) : ad.type === 'video' && ad.mediaUrl ? (
                      <video src={ad.mediaUrl} className="w-full h-full object-cover" />
                    ) : (
                      <Type className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-slate-900 truncate">{ad.title}</h4>
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color} mt-1`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </div>
                      </div>
                      
                      {/* Toggle Switch */}
                      <button
                        onClick={() => toggleStatus(ad)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                          ad.isActive ? 'bg-purple-600' : 'bg-slate-200'
                        }`}
                        title={ad.isActive ? "Désactiver" : "Activer"}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            ad.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Dates Management */}
                    {isEditing ? (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">Début</label>
                            <input
                              type="date"
                              value={editDates.startDate}
                              onChange={(e) => setEditDates({...editDates, startDate: e.target.value})}
                              className="w-full text-xs rounded-md border-slate-300"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-slate-500 block mb-1">Fin</label>
                            <input
                              type="date"
                              value={editDates.endDate}
                              onChange={(e) => setEditDates({...editDates, endDate: e.target.value})}
                              className="w-full text-xs rounded-md border-slate-300"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="text-xs text-slate-500 hover:text-slate-700">Annuler</button>
                          <button onClick={() => saveDates(ad._id)} className="text-xs bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700">Sauvegarder</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(ad.startDate).toLocaleDateString()} 
                            {ad.endDate ? ` - ${new Date(ad.endDate).toLocaleDateString()}` : ' - Illimité'}
                          </span>
                        </div>
                        <button 
                          onClick={() => startEditing(ad)}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" />
                          Planifier
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default AirportAdsControl;
