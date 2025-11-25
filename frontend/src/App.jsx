import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

// Lazy load des pages pour le code splitting
const DepartureBoard = lazy(() => import('./pages/PublicDisplays/DepartureBoard'));
const ArrivalBoard = lazy(() => import('./pages/PublicDisplays/ArrivalBoard'));
const GeneralBoard = lazy(() => import('./pages/PublicDisplays/GeneralBoard'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Airports = lazy(() => import('./pages/SuperAdmin/Airports'));
const Airlines = lazy(() => import('./pages/SuperAdmin/Airlines'));
const Users = lazy(() => import('./pages/SuperAdmin/Users'));
const Flights = lazy(() => import('./pages/Admin/Flights'));
const CreateFlight = lazy(() => import('./pages/Admin/CreateFlight'));
const PublicDisplays = lazy(() => import('./pages/PublicDisplays'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdmin/Dashboard'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));

// Ad-Manager
const AdManagerLayout = lazy(() => import('./layouts/AdManagerLayout'));
const AdManagerDashboard = lazy(() => import('./pages/AdManager/Dashboard'));
const AdManagerAdvertisements = lazy(() => import('./pages/AdManager/Advertisements'));
const AdManagerReports = lazy(() => import('./pages/AdManager/Reports'));
const AdManagerAlerts = lazy(() => import('./pages/AdManager/Alerts'));

// Composant de chargement
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      <p className="text-gray-600">Chargement...</p>
    </div>
  </div>
);

// Pages temporaires (placeholders)
const DashboardByRole = () => {
  const { user, activeAirportCode } = useAuth();
  // Si superadmin avec contexte d'aéroport actif, afficher le dashboard Admin
  // Sinon, afficher selon le rôle
  if (user?.role === 'superadmin' && activeAirportCode) {
    return <AdminDashboard />;
  }
  return user?.role === 'superadmin' ? <SuperAdminDashboard /> : <AdminDashboard />;
};

const NotFound = () => (
  <div className="flex flex-col items-center justify-center h-screen">
    <h1 className="text-4xl font-bold text-gray-900">404</h1>
    <p className="text-gray-600 mt-2">Page non trouvée</p>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <SocketProvider>
            <Toaster position="top-right" />
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Routes publiques (écrans FIDS) */}
                <Route path="/display/:airportCode/departures" element={<DepartureBoard />} />
                <Route path="/display/:airportCode/arrivals" element={<ArrivalBoard />} />
                <Route path="/display/:airportCode/general" element={<GeneralBoard />} />
                
                {/* Authentification */}
                <Route path="/login" element={<Login />} />

                {/* Routes protégées avec Layout */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  {/* Dashboard selon le rôle */}
                  <Route index element={<DashboardByRole />} />
                  
                  {/* Routes Admin */}
                  <Route path="flights" element={
                    <ProtectedRoute roles={['admin']}>
                      <Flights />
                    </ProtectedRoute>
                  } />
                  <Route path="flights/create" element={
                    <ProtectedRoute roles={['admin']}>
                      <CreateFlight />
                    </ProtectedRoute>
                  } />
                  <Route path="flights/edit/:id" element={
                    <ProtectedRoute roles={['admin']}>
                      <CreateFlight />
                    </ProtectedRoute>
                  } />

                  {/* Routes SuperAdmin */}
                  <Route path="airports" element={
                    <ProtectedRoute roles={['superadmin']}>
                      <Airports />
                    </ProtectedRoute>
                  } />
                  <Route path="airlines" element={
                    <ProtectedRoute roles={['superadmin']}>
                      <Airlines />
                    </ProtectedRoute>
                  } />
                  <Route path="users" element={
                    <ProtectedRoute roles={['superadmin']}>
                      <Users />
                    </ProtectedRoute>
                  } />

                  {/* Routes Communes */}
                  <Route path="public-displays" element={<PublicDisplays />} />
                </Route>

                {/* Routes Ad-Manager */}
                <Route path="/ad-manager" element={
                  <ProtectedRoute roles={['ad-manager']}>
                    <AdManagerLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<AdManagerDashboard />} />
                  <Route path="advertisements" element={<AdManagerAdvertisements />} />
                  <Route path="reports" element={<AdManagerReports />} />
                  <Route path="alerts" element={<AdManagerAlerts />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </SocketProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
