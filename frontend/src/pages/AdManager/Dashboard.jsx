import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import advertisementService from '../../services/advertisementService';
import { TrendingUp, Eye, DollarSign, AlertCircle, Calendar, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdManagerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAds: 0,
    activeAds: 0,
    totalViews: 0,
    expiringSoon: 0
  });
  const [recentAds, setRecentAds] = useState([]);
  const [viewEvolution, setViewEvolution] = useState({
    labels: [],
    datasets: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching advertisement data...');
      const ads = await advertisementService.getAllAdvertisements();
      console.log('Advertisements fetched:', ads);

      // Calculer les stats
      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const newStats = {
        totalAds: ads.length,
        activeAds: ads.filter(ad => ad.isActive).length,
        totalViews: ads.reduce((sum, ad) => sum + (ad.viewCount || 0), 0),
        expiringSoon: ads.filter(ad => 
          ad.endDate && new Date(ad.endDate) <= thirtyDaysFromNow && new Date(ad.endDate) > now
        ).length
      };

      console.log('Stats calculated:', newStats);
      setStats(newStats);

      // Calculer l'évolution des vues (7 derniers jours)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return d;
      });

      const viewsPerDay = last7Days.map(date => {
        let count = 0;
        ads.forEach(ad => {
          if (ad.viewHistory) {
            const historyEntry = ad.viewHistory.find(h => 
              new Date(h.date).getTime() === date.getTime()
            );
            if (historyEntry) {
              count += historyEntry.count;
            }
          }
        });
        return count;
      });

      setViewEvolution({
        labels: last7Days.map(d => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })),
        datasets: [
          {
            label: 'Vues Quotidiennes',
            data: viewsPerDay,
            fill: true,
            backgroundColor: 'rgba(147, 51, 234, 0.1)',
            borderColor: 'rgb(147, 51, 234)',
            tension: 0.4,
            pointBackgroundColor: 'rgb(147, 51, 234)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgb(147, 51, 234)'
          }
        ]
      });

      // Publicités récentes (5 dernières)
      setRecentAds(ads.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      console.error('Error details:', error.response?.data || error.message);
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
            <div key={index} className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {stat.alert && (
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
                {stat.total && (
                  <p className="text-xs text-slate-400 mt-1">sur {stat.total} total</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphique Évolution */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Évolution des Vues (7 derniers jours)
        </h2>
        <div className="h-80">
          <Line 
            data={viewEvolution}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                  }
                },
                x: {
                  grid: {
                    display: false
                  }
                }
              }
            }}
          />
        </div>
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
