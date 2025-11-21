import { useState, useEffect } from 'react';
import { Plane, AlertTriangle, PlaneTakeoff, PlaneLanding, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import statsService from '../../services/statsService';
import StatCard from '../../components/stats/StatCard';
import FlightChart from '../../components/stats/FlightChart';
import RecentFlights from '../../components/stats/RecentFlights';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.airportCode) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await statsService.getAirportStats(user.airportCode);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard {user?.airportCode}</h1>
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
        <StatCard
          title="Départs"
          value={stats?.today?.departures || 0}
          icon={PlaneTakeoff}
          color="blue"
          change={5}
          changeType="increase"
        />
        <StatCard
          title="Arrivées"
          value={stats?.today?.arrivals || 0}
          icon={PlaneLanding}
          color="green"
          change={2}
          changeType="increase"
        />
        <StatCard
          title="Total Vols"
          value={stats?.today?.total || 0}
          icon={Plane}
          color="indigo"
        />
        <StatCard
          title="Retards"
          value={stats?.delayedFlights || 0}
          icon={AlertTriangle}
          color="orange"
          change={-1}
          changeType="decrease"
        />
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

