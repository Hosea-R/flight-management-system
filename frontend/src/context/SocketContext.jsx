import { createContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialiser la connexion
      socketService.connect();

      // S'abonner aux événements de connexion
      socketService.socket.on('connect', () => {
        setIsConnected(true);
        console.log('Socket connecté');
        
        // Rejoindre la room globale
        socketService.joinGlobal();

        // Rejoindre la room de l'aéroport si l'utilisateur en a un
        if (user.airportCode) {
          socketService.joinAirport(user.airportCode);
          console.log(`Rejoint la room: ${user.airportCode}`);
        }
      });

      socketService.socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket déconnecté');
      });

      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket: socketService, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
