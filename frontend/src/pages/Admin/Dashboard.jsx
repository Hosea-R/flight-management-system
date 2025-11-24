import { useState, useEffect } from 'react';
import { Plane, AlertTriangle, PlaneTakeoff, PlaneLanding, Plus, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useSocket from '../../hooks/useSocket';
import statsService from '../../services/statsService';
import airportService from '../../services/airportService';
import StatCard from '../../components/stats/StatCard';
import FlightChart from '../../components/stats/FlightChart';
import RecentFlights from '../../components/stats/RecentFlights';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import { formatAirportName } from '../../utils/formatters';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, getEffectiveAirportCode, activeAirportCode, clearActiveAirport } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [airportInfo, setAirportInfo] = useState(null);

  const { socket } = useSocket();
  const effectiveAirportCode = getEffectiveAirportCode();

  useEffect(() => {
    if (effectiveAirportCode) {
      fetchStats();
      fetchAirportInfo();
      // Garder le polling comme fallback
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [effectiveAirportCode]);

  // Écouter les mises à jour temps réel
  useEffect(() => {
    if (socket && effectiveAirportCode) {
      const handleUpdate = () => {
        console.log('🔄 Mise à jour détectée, rechargement des stats...');
        fetchStats();
      };

      socket.on('flight:created', handleUpdate);
      socket.on('flight:updated', handleUpdate);
      socket.on('flight:statusChanged', handleUpdate);
      socket.on('flight:deleted', handleUpdate);

      return () => {
        socket.off('flight:created', handleUpdate);
        socket.off('flight:updated', handleUpdate);
        socket.off('flight:statusChanged', handleUpdate);
        socket.off('flight:deleted', handleUpdate);
      };
    }
  }, [socket, effectiveAirportCode]);

  const fetchStats = async () => {
    try {
      const response = await statsService.getAirportStats(effectiveAirportCode);
      setStats(response.data.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAirportInfo = async () => {
    if (effectiveAirportCode) {
      try {
        // Utiliser getAirportByCode pour être plus efficace et supporter tous les rôles
        const response = await airportService.getAirportByCode(effectiveAirportCode);
        setAirportInfo(response.data);
      } catch (error) {
        console.error('Erreur chargement info aéroport:', error);
      }
    }
  };

  const handleReturnToSuperAdmin = () => {
    clearActiveAirport();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton.Card key={i} className="h-40" />
          ))}
        </div>
        <Skeleton.Card className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-8 page-transition">
      {/* Bandeau de contexte pour SuperAdmin */}
      {user?.role === 'superadmin' && activeAirportCode && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Plane className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium opacity-90">Mode Administrateur</p>
              <p className="text-lg font-bold">
                {airportInfo ? `${formatAirportName(airportInfo)} (${airportInfo.code})` : `Aéroport ${activeAirportCode}`}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={handleReturnToSuperAdmin}
            icon={<ArrowLeft className="h-4 w-4" />}
            className="bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            Retour à la vue globale
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {airportInfo ? formatAirportName(airportInfo) : `Dashboard ${effectiveAirportCode || user?.airportCode}`}
          </h1>
          <p className="text-slate-500 mt-1">Vue d'ensemble de votre aéroport</p>
        </div>
        <Link to="/flights/create">
          <Button variant="gradient" icon={<Plus className="h-5 w-5" />}>
            Créer un vol
          </Button>
        </Link>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Départs",
            value: stats?.today?.departures || 0,
            icon: PlaneTakeoff,
            color: "blue",
            change: 5,
            changeType: "increase"
          },
          {
            title: "Arrivées",
            value: stats?.today?.arrivals || 0,
            icon: PlaneLanding,
            color: "green",
            change: 2,
            changeType: "increase"
          },
          {
            title: "Total Vols",
            value: stats?.today?.total || 0,
            icon: Plane,
            color: "indigo"
          },
          {
            title: "Retards",
            value: stats?.delayedFlights || 0,
            icon: AlertTriangle,
            color: "orange",
            change: -1,
            changeType: "decrease"
          }
        ].map((stat, index) => (
          <div key={stat.title} className="stagger-item" style={{ animationDelay: `${index * 50}ms` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Graphique historique */}
      <Card header={<h2 className="text-lg font-bold text-slate-900">Trafic Hebdomadaire</h2>}>
        <div className="h-80 w-full">
          <FlightChart data={stats?.last7Days || []} />
        </div>
      </Card>

      {/* Prochains vols */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentFlights
          flights={stats?.upcomingDepartures || []}
          type="departure"
          title="Prochains Départs"
        />
        <RecentFlights
          flights={stats?.upcomingArrivals || []}
          type="arrival"
          title="Prochaines Arrivées"
        />
      </div>

      {/* Liens rapides */}
      <Card header={<h2 className="text-lg font-bold text-slate-900">Accès Rapides</h2>}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            to="/flights"
            className="group p-6 bg-blue-50 hover:bg-blue-100 rounded-2xl border border-blue-100 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1"
          >
            <div className="w-14 h-14 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
              <Plane className="h-7 w-7 text-blue-600" />
            </div>
            <p className="font-bold text-blue-900 text-lg">Gérer les Vols</p>
            <p className="text-sm text-blue-600/80 mt-1">Modifier, annuler, voir</p>
          </Link>
          
          <Link
            to="/public-displays"
            className="group p-6 bg-purple-50 hover:bg-purple-100 rounded-2xl border border-purple-100 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1"
          >
            <div className="w-14 h-14 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
              <ArrowRight className="h-7 w-7 text-purple-600" />
            </div>
            <p className="font-bold text-purple-900 text-lg">Écrans Publics</p>
            <p className="text-sm text-purple-600/80 mt-1">FIDS Départs & Arrivées</p>
          </Link>
          
          <Link
            to="/flights/create"
            className="group p-6 bg-emerald-50 hover:bg-emerald-100 rounded-2xl border border-emerald-100 text-center transition-all duration-300 hover:shadow-md hover:-translate-y-1"
          >
            <div className="w-14 h-14 mx-auto bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
              <Plus className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="font-bold text-emerald-900 text-lg">Créer un Vol</p>
            <p className="text-sm text-emerald-600/80 mt-1">Nouveau vol planifié</p>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;

