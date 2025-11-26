import { useState, useEffect } from 'react';
import { AlertTriangle, PowerOff, Power, Loader2 } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import systemSettingsService from '../../services/systemSettingsService';

const AirportAdsControl = () => {
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEmergencyMode();
  }, []);

  const fetchEmergencyMode = async () => {
    try {
      const setting = await systemSettingsService.getSetting('adsEmergencyDisabled');
      setEmergencyMode(setting.value || false);
      setLoading(false);
    } catch (err) {
      // Si le paramètre n'existe pas encore, considérer comme false
      setEmergencyMode(false);
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    setError('');
    try {
      const response = await systemSettingsService.toggleAdsEmergency();
      setEmergencyMode(response.data.value);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors du basculement');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <Card header={<h2 className="text-lg font-bold text-slate-900">Contrôle des Publicités</h2>}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </Card>
    );
  }

  return (
    <Card 
      header={
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <h2 className="text-lg font-bold text-slate-900">Contrôle d'Urgence</h2>
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100 text-sm">
            {error}
          </div>
        )}

        <div className={`p-4 rounded-xl border-2 ${emergencyMode ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className={`font-bold text-lg ${emergencyMode ? 'text-rose-700' : 'text-emerald-700'}`}>
                Publicités: {emergencyMode ? 'DÉSACTIVÉES' : 'Actives'}
              </h3>
              <p className={`text-sm mt-1 ${emergencyMode ? 'text-rose-600' : 'text-emerald-600'}`}>
                {emergencyMode 
                  ? 'Toutes les publicités sont masquées sur les écrans publics'
                  : 'Les publicités s\'affichent normalement sur les écrans publics'}
              </p>
            </div>
            {emergencyMode ? (
              <PowerOff className="h-10 w-10 text-rose-500" />
            ) : (
              <Power className="h-10 w-10 text-emerald-500" />
            )}
          </div>
        </div>

        <Button
          variant={emergencyMode ? 'success' : 'danger'}
          onClick={handleToggle}
          disabled={toggling}
          className="w-full"
        >
          {toggling ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Basculement...
            </>
          ) : (
            <>
              {emergencyMode ? (
                <>
                  <Power className="h-4 w-4 mr-2" />
                  Réactiver les publicités
                </>
              ) : (
                <>
                  <PowerOff className="h-4 w-4 mr-2" />
                  Désactiver les publicités (urgence)
                </>
              )}
            </>
          )}
        </Button>

        <div className="bg-slate-50 p-3 rounded-xl">
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Mode urgence:</strong> Désactivez toutes les publicités instantanément sur tous les écrans publics. 
            Utilisez cette fonction en cas d'urgence ou d'événement exceptionnel.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AirportAdsControl;
