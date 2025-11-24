import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, isAuthenticated, loading, activeAirportCode } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Rediriger vers login en gardant l'URL d'origine
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Vérification des rôles si spécifiés
  if (roles.length > 0) {
    // SuperAdmin a TOUJOURS accès aux routes Admin (hiérarchie de permissions)
    const isSuperAdmin = user.role === 'superadmin';
    const hasAdminAccess = isSuperAdmin && roles.includes('admin');
    const hasDirectAccess = roles.includes(user.role);
    
    if (!hasDirectAccess && !hasAdminAccess) {
      // Rediriger vers dashboard par défaut si pas autorisé
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
