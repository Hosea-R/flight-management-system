import { useState, useEffect } from 'react';
import advertisementService from '../../services/advertisementService';
import { BarChart3, TrendingUp, Eye, DollarSign, Download } from 'lucide-react';

const Reports = () => {
  const [ads, setAds] = useState([]);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalRevenue: 0,
    activeAds: 0,
    averageViews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await advertisementService.getAllAdvertisements();
      const adsData = response.data;
      setAds(adsData);

      // Calculer les stats
      const totalViews = adsData.reduce((sum, ad) => sum + (ad.viewCount || 0), 0);
      const activeAds = adsData.filter(ad => ad.isActive).length;
      
      // Calcul simplifié du revenu (peut être amélioré avec les data réelles du backend)
      const totalRevenue = adsData.reduce((sum, ad) => {
        if (ad.contract?.pricing?.amount) {
          return sum + ad.contract.pricing.amount;
        }
        return sum;
      }, 0);

      setStats({
        totalViews,
        totalRevenue,
        activeAds,
        averageViews: adsData.length > 0 ? Math.round(totalViews / adsData.length) : 0
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setLoading(false);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-purple-600" />
            Rapports & Statistiques
          </h1>
          <p className="text-slate-600 mt-1">
            Performance de vos publicités
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors">
          <Download className="w-4 h-4" />
          Exporter PDF
        </button>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Vues Totales</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.totalViews.toLocaleString()}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Pubs Actives</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.activeAds}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 rounded-lg">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Moyenne/Pub</p>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.averageViews.toLocaleString()}</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-slate-600">Revenus Estimés</p>
          </div>
          <p className="text-2xl font-bold text-slate-800">{stats.totalRevenue.toLocaleString()} MGA</p>
        </div>
      </div>

      {/* Tableau des performances */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Performance par Publicité</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Publicité</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Type</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Vues</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-slate-700">Durée</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">Statut</th>
              </tr>
            </thead>
            <tbody>
              {ads.map(ad => (
                <tr key={ad._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {ad.mediaUrl && (
                        <img 
                          src={ad.mediaUrl} 
                          alt={ad.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-slate-800">{ad.title}</p>
                        <p className="text-sm text-slate-500">
                          {ad.contract?.client?.name || 'Client non défini'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-600">{ad.type}</td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800">
                    {(ad.viewCount || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">{ad.duration}s</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                      ad.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {ad.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {ads.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            Aucune donnée à afficher
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
