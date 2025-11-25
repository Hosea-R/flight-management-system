import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import advertisementService from '../../services/advertisementService';
import { TrendingUp, Eye, DollarSign, AlertCircle, Calendar, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdManagerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAds: 0,
    activeAds: 0,
    totalViews: 0,
    expiringSoon: 0
  });
  const [recentAds, setRecentAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const ads = await advertisementService.getAllAdvertisements();

      // Calculer les stats
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      setStats({
        totalAds: ads.length,
        activeAds: ads.filter(ad => ad.isActive).length,
        totalViews: ads.reduce((sum, ad) => sum + (ad.viewCount || 0), 0),
        expiringSoon: ads.filter(ad => 
          ad.endDate && new Date(ad.endDate) <= thirtyDaysFromNow && new Date(ad.endDate) > now
        ).length
      });

      // Publicités récentes (5 dernières)
      setRecentAds(ads.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Publicités Actives',
      value: stats.activeAds,
      total: stats.totalAds,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600'
    },
    {
      title: 'Vues Totales',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: 'Expirent Bientôt',
      value: stats.expiringSoon,
      icon: AlertCircle,
      color: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      alert: stats.expiringSoon > 0
    }
  ];

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
        <h1 className="text-3xl font-bold text-slate-800">
          Bienvenue, {user.firstName} !
        </h1>
        <p className="text-slate-600 mt-1">
          Voici un aperçu de vos publicités
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm hover:shadow-lg transition-all p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-800">
                    {stat.value}
                    {stat.total && <span className="text-lg text-slate-400 ml-2">/ {stat.total}</span>}
                  </p>
                  {stat.alert && (
                    <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Nécessite votre attention
                    </p>
                  )}
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color}`}></div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/ad-manager/advertisements?action=new"
            className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all group"
          >
            <div className="p-3 bg-white/20 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Nouvelle Publicité</h3>
              <p className="text-sm text-white/80">Créer une nouvelle campagne</p>
            </div>
            <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </Link>

          <Link
            to="/ad-manager/reports"
            className="flex items-center gap-4 p-4 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all group"
          >
            <div className="p-3 bg-white rounded-lg">
              <DollarSign className="w-6 h-6 text-slate-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800">Voir Rapports</h3>
              <p className="text-sm text-slate-600">Statistiques et performances</p>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-600 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Recent Ads */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800">Publicités Récentes</h2>
          <Link
            to="/ad-manager/advertisements"
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            Voir tout
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {recentAds.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Aucune publicité pour le moment</p>
            <Link
              to="/ad-manager/advertisements?action=new"
              className="text-purple-600 hover:text-purple-700 font-medium mt-2 inline-block"
            >
              Créer votre première publicité
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAds.map(ad => (
              <div
                key={ad._id}
                className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center overflow-hidden">
                  {ad.mediaUrl ? (
                    <img src={ad.mediaUrl} alt={ad.title} className="w-full h-full object-cover" />
                  ) : (
                    <Calendar className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 truncate">{ad.title}</h3>
                  <p className="text-sm text-slate-600">
                    {ad.viewCount || 0} vues • {ad.isActive ? 'Actif' : 'Inactif'}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    ad.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {ad.isActive ? 'Actif' : 'Inactif'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdManagerDashboard;
