import { useEffect, useRef, useCallback } from 'react';
import socketService from '@/services/socket';

/**
 * HOOK PERSONNALISÉ : useSocket
 * 
 * Facilite l'utilisation de Socket.io dans les composants React
 * Gère automatiquement la connexion, déconnexion et nettoyage
 * 
 * @param {string} airportCode - Code de l'aéroport à rejoindre (optionnel)
 * @param {boolean} global - Rejoindre la room globale (SuperAdmin)
 * @returns {object} - Fonctions et état du socket
 */
const useSocket = (airportCode = null, global = false) => {
  const socketRef = useRef(null);
  const listenersRef = useRef(new Map());

  // Initialiser la connexion
  useEffect(() => {
    // Connecter le socket
    socketRef.current = socketService.connect();

    // Rejoindre les rooms appropriées
    if (global) {
      socketService.joinGlobal();
    }

    if (airportCode) {
      socketService.joinAirport(airportCode);
    }

    // Nettoyage à la déconnexion du composant
    return () => {
      // Quitter les rooms
      if (airportCode) {
        socketService.leaveAirport(airportCode);
      }

      // Retirer tous les listeners enregistrés par ce hook
      listenersRef.current.forEach((callback, event) => {
        socketService.off(event, callback);
      });
      listenersRef.current.clear();

      // Note: On ne déconnecte pas complètement le socket
      // car d'autres composants peuvent l'utiliser
    };
  }, [airportCode, global]);

  /**
   * Écouter un événement
   */
  const on = useCallback((event, callback) => {
    socketService.on(event, callback);
    listenersRef.current.set(event, callback);
  }, []);

  /**
   * Arrêter d'écouter un événement
   */
  const off = useCallback((event, callback) => {
    socketService.off(event, callback);
    listenersRef.current.delete(event);
  }, []);

  /**
   * Émettre un événement
   */
  const emit = useCallback((event, data) => {
    socketService.emit(event, data);
  }, []);

  /**
   * Rejoindre une room d'aéroport
   */
  const joinAirport = useCallback((code) => {
    socketService.joinAirport(code);
  }, []);

  /**
   * Quitter une room d'aéroport
   */
  const leaveAirport = useCallback((code) => {
    socketService.leaveAirport(code);
  }, []);

  /**
   * Ping le serveur
   */
  const ping = useCallback((callback) => {
    socketService.ping(callback);
  }, []);

  /**
   * Obtenir le statut de connexion
   */
  const getStatus = useCallback(() => {
    return socketService.getConnectionStatus();
  }, []);

  return {
    socket: socketRef.current,
    on,
    off,
    emit,
    joinAirport,
    leaveAirport,
    ping,
    getStatus
  };
};

export default useSocket;