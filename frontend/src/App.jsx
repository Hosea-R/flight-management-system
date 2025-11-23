import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import { Toaster } from 'react-hot-toast';

// Pages publiques FIDS
import DepartureBoard from './pages/PublicDisplays/DepartureBoard';
import ArrivalBoard from './pages/PublicDisplays/ArrivalBoard';
import GeneralBoard from './pages/PublicDisplays/GeneralBoard';
import Login from './pages/Auth/Login';
import Airports from './pages/SuperAdmin/Airports';
import Airlines from './pages/SuperAdmin/Airlines';
import Users from './pages/SuperAdmin/Users';
import Flights from './pages/Admin/Flights';
import CreateFlight from './pages/Admin/CreateFlight';
import PublicDisplays from './pages/PublicDisplays';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import AdminDashboard from './pages/Admin/Dashboard';

// Pages temporaires (placeholders)
const DashboardByRole = () => {
  const { user } = useAuth();
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
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-right" />
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

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
