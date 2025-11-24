import { createContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socket';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated, getEffectiveAirportCode, activeAirportCode } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const currentRoomRef = useRef(null);

  useEffect(() => {
    // Connexion toujours autorisée (pour les écrans publics)
    socketService.connect();

    // S'abonner aux événements de connexion
    const onConnect = () => {
      setIsConnected(true);
      console.log('✅ Socket connecté');
      
      // Si authentifié, rejoindre les rooms appropriées
      if (isAuthenticated && user) {
        socketService.joinGlobal();

        const effectiveAirportCode = getEffectiveAirportCode();
        if (effectiveAirportCode) {
          socketService.joinAirport(effectiveAirportCode);
          currentRoomRef.current = effectiveAirportCode;
          console.log(`📍 Rejoint la room: ${effectiveAirportCode}`);
        }
      }
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log('❌ Socket déconnecté');
    };

    socketService.socket.on('connect', onConnect);
    socketService.socket.on('disconnect', onDisconnect);

    // Si le socket était déjà connecté avant le montage (ex: navigation)
    if (socketService.socket.connected) {
      onConnect();
    }

    return () => {
      socketService.socket.off('connect', onConnect);
      socketService.socket.off('disconnect', onDisconnect);
      // Ne pas déconnecter ici pour garder la connexion active entre les pages
      // socketService.disconnect(); 
    };
  }, [isAuthenticated, user, getEffectiveAirportCode]);

  // Gérer le changement d'aéroport pour le superadmin (reste inchangé)
  useEffect(() => {
    if (isConnected && user) {
      const effectiveAirportCode = getEffectiveAirportCode();
      
      if (effectiveAirportCode !== currentRoomRef.current) {
        if (currentRoomRef.current) {
          socketService.leaveAirport(currentRoomRef.current);
        }
        
        if (effectiveAirportCode) {
          socketService.joinAirport(effectiveAirportCode);
          currentRoomRef.current = effectiveAirportCode;
        } else {
          currentRoomRef.current = null;
        }
      }
    }
  }, [isConnected, user, activeAirportCode, getEffectiveAirportCode]);

  // Exposer les méthodes pour les composants publics
  const joinAirportRoom = (code) => {
    if (isConnected) {
      socketService.joinAirport(code);
    }
  };

  const leaveAirportRoom = (code) => {
    if (isConnected) {
      socketService.leaveAirport(code);
    }
  };

  return (
    <SocketContext.Provider value={{ 
      socket: socketService, 
      isConnected,
      joinAirportRoom,
      leaveAirportRoom
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
