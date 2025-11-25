import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import advertisementService from '../../services/advertisementService';
import { AlertTriangle, Clock, TrendingUp, XCircle, ExternalLink } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

const Alerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState({
    expiring: [],
    quotaReached: [],
    expired: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const alertsData = await advertisementService.getAlerts();
      setAlerts(alertsData || { expiring: [], quotaReached: [], expired: [] });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setLoading(false);
    }
  };

  const totalAlerts = alerts.expiring.length + alerts.quotaReached.length + alerts.expired.length;

  const handleViewAd = (adId) => {
    navigate(`/ad-manager/advertisements?edit=${adId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-xl">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          Alertes & Notifications
        </h1>
        <p className="text-slate-500 mt-2 text-lg">
          {totalAlerts === 0 ? 'Aucune alerte pour le moment' : `${totalAlerts} publicité(s) nécessitent votre attention`}
        </p>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Expiration proche</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{alerts.expiring.length}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Quota atteint</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{alerts.quotaReached.length}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-rose-50 rounded-lg">
              <XCircle className="w-5 h-5 text-rose-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Expirées</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{alerts.expired.length}</p>
        </div>
      </div>

      {/* Expiring Soon */}
      {alerts.expiring.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-orange-600" />
            Expiration proche ({alerts.expiring.length})
          </h2>
          <div className="space-y-3">
            {alerts.expiring.map((ad) => (
              <div
                key={ad._id}
                className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 flex-1">
                  {ad.mediaUrl && (
                    <img
                      src={ad.mediaUrl}
                      alt={ad.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{ad.title}</h3>
                    <p className="text-sm text-slate-600">
                      {ad.client?.name || 'Client non défini'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="warning">
                        Expire dans {ad.daysRemaining} jour(s)
                      </Badge>
                      {ad.contract?.number && (
                        <span className="text-xs text-slate-500">
                          Contrat: {ad.contract.number}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleViewAd(ad._id)}
                  icon={<ExternalLink className="w-4 h-4" />}
                >
                  Modifier
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quota Reached */}
      {alerts.quotaReached.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-yellow-600" />
            Quota atteint ({alerts.quotaReached.length})
          </h2>
          <div className="space-y-3">
            {alerts.quotaReached.map((ad) => (
              <div
                key={ad._id}
                className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 flex-1">
                  {ad.mediaUrl && (
                    <img
                      src={ad.mediaUrl}
                      alt={ad.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{ad.title}</h3>
                    <p className="text-sm text-slate-600">
                      {ad.client?.name || 'Client non défini'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="warning">
                        {ad.quotaPercentage}% du quota utilisé
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {ad.viewCount} / {ad.contract?.maxViews} vues
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleViewAd(ad._id)}
                  icon={<ExternalLink className="w-4 h-4" />}
                >
                  Modifier
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expired */}
      {alerts.expired.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <XCircle className="w-6 h-6 text-rose-600" />
            Expirées ({alerts.expired.length})
          </h2>
          <div className="space-y-3">
            {alerts.expired.map((ad) => (
              <div
                key={ad._id}
                className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-xl hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4 flex-1">
                  {ad.mediaUrl && (
                    <img
                      src={ad.mediaUrl}
                      alt={ad.title}
                      className="w-16 h-16 rounded-lg object-cover opacity-60"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">{ad.title}</h3>
                    <p className="text-sm text-slate-600">
                      {ad.client?.name || 'Client non défini'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="danger">
                        Expirée le {new Date(ad.endDate).toLocaleDateString('fr-FR')}
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleViewAd(ad._id)}
                  icon={<ExternalLink className="w-4 h-4" />}
                >
                  Renouveler
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalAlerts === 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-12 text-center">
          <div className="p-4 bg-green-50 rounded-full inline-block mb-4">
            <AlertTriangle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Tout va bien !
          </h3>
          <p className="text-slate-600">
            Aucune publicité ne nécessite votre attention pour le moment.
          </p>
        </div>
      )}
    </div>
  );
};

export default Alerts;
