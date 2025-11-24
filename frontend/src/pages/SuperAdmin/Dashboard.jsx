import { useState, useEffect } from 'react';
import { Plane, AlertTriangle, XCircle, Building2, ArrowUpRight, ArrowDownRight, PlaneTakeoff, PlaneLanding } from 'lucide-react';
import statsService from '../../services/statsService';
import StatCard from '../../components/stats/StatCard';
import FlightChart from '../../components/stats/FlightChart';
import Card from '../../components/common/Card';
import Skeleton from '../../components/common/Skeleton';
import useSocket from '../../hooks/useSocket';

const SuperAdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Écouter les mises à jour temps réel globales
  useEffect(() => {
    if (socket) {
      const handleUpdate = () => {
        console.log('🔄 Mise à jour globale détectée, rechargement des stats...');
        fetchStats();
      };

      socket.on('flight:created:global', handleUpdate);
      socket.on('flight:updated:global', handleUpdate);
      socket.on('flight:statusChanged:global', handleUpdate);
      socket.on('flight:deleted:global', handleUpdate);
      socket.on('airport:created', handleUpdate); // Aussi pour les aéroports
      socket.on('airport:updated', handleUpdate);
      socket.on('airport:deleted', handleUpdate);

      return () => {
        socket.off('flight:created:global', handleUpdate);
        socket.off('flight:updated:global', handleUpdate);
        socket.off('flight:statusChanged:global', handleUpdate);
        socket.off('flight:deleted:global', handleUpdate);
        socket.off('airport:created', handleUpdate);
        socket.off('airport:updated', handleUpdate);
        socket.off('airport:deleted', handleUpdate);
      };
    }
  }, [socket]);

  const fetchStats = async () => {
    try {
      const response = await statsService.getGlobalStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton.Card key={i} className="h-40" />
          ))}
        </div>
        <Skeleton.Card className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-8 page-transition">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Global</h1>
          <p className="text-slate-500 mt-1">Vue d'ensemble de l'activité aérienne nationale</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Mise à jour en temps réel
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Vols Aujourd'hui"
          value={stats?.totalFlights || 0}
          icon={Plane}
          color="indigo"
          subtitle={`${stats?.totalDepartures || 0} départs • ${stats?.totalArrivals || 0} arrivées`}
        />
        <StatCard
          title="Départs"
          value={stats?.totalDepartures || 0}
          icon={PlaneTakeoff}
          color="blue"
        />
        <StatCard
          title="Arrivées"
          value={stats?.totalArrivals || 0}
          icon={PlaneLanding}
          color="purple"
        />
        <StatCard
          title="Vols Retardés"
          value={stats?.delayed || 0}
          icon={AlertTriangle}
          color="orange"
        />
        <StatCard
          title="Vols Annulés"
          value={stats?.cancelled || 0}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Aéroports Actifs"
          value={stats?.activeAirports || 0}
          icon={Building2}
          color="green"
        />
      </div>

      {/* Graphique historique */}
      <Card header={<h2 className="text-lg font-bold text-slate-900">Trafic des 7 derniers jours</h2>}>
        <div className="h-80 w-full">
          <FlightChart data={stats?.last7Days || []} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Vols par compagnie */}
        <Card header={<h2 className="text-lg font-bold text-slate-900">Top Compagnies</h2>} noPadding>
          <div className="divide-y divide-slate-100">
            {stats?.flightsByAirline && stats.flightsByAirline.length > 0 ? (
              stats.flightsByAirline.map((airline, index) => (
                <div key={airline._id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                      index === 1 ? 'bg-slate-100 text-slate-700' : 
                      index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-50 text-slate-500'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{airline.name}</p>
                      <p className="text-xs text-slate-500">{airline.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">{airline.count}</p>
                    <p className="text-xs text-slate-400">vols</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-8">Aucune donnée disponible</p>
            )}
          </div>
        </Card>

        {/* Répartition par statut */}
        <Card header={<h2 className="text-lg font-bold text-slate-900">État du Trafic</h2>}>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow">
              <p className="text-3xl font-bold text-blue-600">{stats?.statusBreakdown?.scheduled || 0}</p>
              <p className="text-sm font-medium text-blue-600/80 mt-1">Prévus</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 hover:shadow-md transition-shadow">
              <p className="text-3xl font-bold text-emerald-600">{stats?.statusBreakdown?.['in-flight'] || 0}</p>
              <p className="text-sm font-medium text-emerald-600/80 mt-1">En vol</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 hover:shadow-md transition-shadow">
              <p className="text-3xl font-bold text-purple-600">{stats?.statusBreakdown?.departed || 0}</p>
              <p className="text-sm font-medium text-purple-600/80 mt-1">Décollés</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
              <p className="text-3xl font-bold text-slate-600">{stats?.statusBreakdown?.arrived || 0}</p>
              <p className="text-sm font-medium text-slate-600/80 mt-1">Arrivés</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;

