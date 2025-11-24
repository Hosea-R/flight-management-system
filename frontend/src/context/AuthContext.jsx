import { createContext, useState, useEffect, useContext } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeAirportCode, setActiveAirportCode] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = sessionStorage.getItem('token');
      if (token) {
        try {
          const storedUser = authService.getCurrentUser();
          if (storedUser) {
            setUser(storedUser);
            setIsAuthenticated(true);
            
            // Restaurer le contexte d'aéroport pour superadmin si présent
            if (storedUser.role === 'superadmin') {
              const savedAirportCode = sessionStorage.getItem('activeAirportCode');
              if (savedAirportCode) {
                setActiveAirportCode(savedAirportCode);
              }
            }
          } else {
            // Si pas d'user stocké mais un token, on le récupère
            const response = await authService.getMe();
            if (response.success) {
              setUser(response.data.user);
              setIsAuthenticated(true);
              sessionStorage.setItem('user', JSON.stringify(response.data.user));
              
              // Restaurer le contexte d'aéroport pour superadmin si présent
              if (response.data.user.role === 'superadmin') {
                const savedAirportCode = sessionStorage.getItem('activeAirportCode');
                if (savedAirportCode) {
                  setActiveAirportCode(savedAirportCode);
                }
              }
            }
          }
        } catch (error) {
          console.error('Erreur init auth:', error);
          authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erreur de connexion'
      };
    }
  };

  const logout = () => {
    authService.logout();
    sessionStorage.removeItem('activeAirportCode');
    setUser(null);
    setActiveAirportCode(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  // Définir l'aéroport actif pour un superadmin
  const setActiveAirport = (airportCode) => {
    if (user?.role === 'superadmin') {
      setActiveAirportCode(airportCode);
      sessionStorage.setItem('activeAirportCode', airportCode);
    }
  };

  // Retourner à la vue superadmin globale
  const clearActiveAirport = () => {
    setActiveAirportCode(null);
    sessionStorage.removeItem('activeAirportCode');
  };

  // Obtenir le code d'aéroport effectif (pour superadmin en contexte ou admin normal)
  const getEffectiveAirportCode = () => {
    if (user?.role === 'superadmin') {
      return activeAirportCode;
    }
    return user?.airportCode || null;
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    activeAirportCode,
    setActiveAirport,
    clearActiveAirport,
    getEffectiveAirportCode
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
};

export default AuthContext;
