import { io } from 'socket.io-client';
import { CONFIG } from '@/utils/constants';

/**
 * SERVICE SOCKET.IO CLIENT
 * 
 * Gère la connexion WebSocket avec le backend pour les mises à jour en temps réel
 */

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  /**
   * Initialiser et connecter le socket
   */
  connect() {
    if (this.socket?.connected) {
      console.log('🔌 Socket déjà connecté');
      return this.socket;
    }

    console.log('🔌 Connexion au serveur Socket.io...');

    this.socket = io(CONFIG.SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    // Événements de connexion
    this.socket.on('connect', () => {
      console.log('✅ Socket connecté:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket déconnecté:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erreur de connexion Socket:', error.message);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket reconnecté après ${attemptNumber} tentatives`);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Erreur de reconnexion:', error.message);
    });

    return this.socket;
  }

  /**
   * Rejoindre la room d'un aéroport
   */
  joinAirport(airportCode) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️  Socket non connecté, tentative de connexion...');
      this.connect();
    }

    console.log(`📍 Rejoindre la room: ${airportCode}`);
    this.socket.emit('join:airport', airportCode);

    // Écouter la confirmation
    this.socket.once('joined:airport', (data) => {
      console.log('✅ Room rejointe:', data);
    });
  }

  /**
   * Quitter la room d'un aéroport
   */
  leaveAirport(airportCode) {
    if (!this.socket || !this.isConnected) return;

    console.log(`📍 Quitter la room: ${airportCode}`);
    this.socket.emit('leave:airport', airportCode);
  }

  /**
   * Rejoindre la room globale (SuperAdmin)
   */
  joinGlobal() {
    if (!this.socket || !this.isConnected) {
      this.connect();
    }

    console.log('🌍 Rejoindre la room globale');
    this.socket.emit('join:global');
  }

  /**
   * Écouter un événement
   */
  on(event, callback) {
    if (!this.socket) {
      console.warn('⚠️  Socket non initialisé');
      return;
    }

    console.log(`👂 Écoute de l'événement: ${event}`);
    this.socket.on(event, callback);

    // Stocker le listener pour pouvoir le retirer plus tard
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Arrêter d'écouter un événement
   */
  off(event, callback) {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
      
      // Retirer du registre
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    } else {
      // Retirer tous les listeners de cet événement
      this.socket.off(event);
      this.listeners.delete(event);
    }

    console.log(`🔇 Arrêt de l'écoute: ${event}`);
  }

  /**
   * Émettre un événement
   */
  emit(event, data) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️  Socket non connecté, impossible d\'émettre');
      return;
    }

    console.log(`📤 Émission: ${event}`, data);
    this.socket.emit(event, data);
  }

  /**
   * Ping le serveur
   */
  ping(callback) {
    if (!this.socket || !this.isConnected) {
      callback?.(false);
      return;
    }

    this.socket.emit('ping');
    this.socket.once('pong', (data) => {
      console.log('🏓 Pong reçu:', data);
      callback?.(true, data);
    });
  }

  /**
   * Déconnecter proprement
   */
  disconnect() {
    if (!this.socket) return;

    console.log('🔌 Déconnexion du socket...');

    // Nettoyer tous les listeners
    this.listeners.forEach((callbacks, event) => {
      this.socket.off(event);
    });
    this.listeners.clear();

    // Déconnecter
    this.socket.disconnect();
    this.socket = null;
    this.isConnected = false;

    console.log('✅ Socket déconnecté proprement');
  }

  /**
   * Obtenir le statut de connexion
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id || null
    };
  }
}

// Instance singleton
const socketService = new SocketService();

export default socketService;