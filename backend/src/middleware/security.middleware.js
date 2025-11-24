const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const logger = require('../config/logger');

/**
 * Configuration Helmet pour sécuriser les headers HTTP
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false, // Nécessaire pour certaines ressources externes
});

/**
 * Rate limiter pour les routes publiques (écrans FIDS)
 * Limite: 100 requêtes par 15 minutes
 */
const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requêtes par fenêtre
  message: {
    success: false,
    message: 'Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true, // Retourne les infos dans les headers `RateLimit-*`
  legacyHeaders: false, // Désactive les headers `X-RateLimit-*`
  handler: (req, res) => {
    logger.warn(`Rate limit dépassé pour IP: ${req.ip} sur route: ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Trop de requêtes depuis cette IP, veuillez réessayer dans 15 minutes.'
    });
  }
});

/**
 * Rate limiter pour les routes authentifiées
 * Limite: 200 requêtes par 15 minutes
 */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Max 200 requêtes par fenêtre
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit dépassé pour utilisateur: ${req.user?.id || 'inconnu'} sur route: ${req.path}`);
    res.status(429).json({
      success: false,
      message: 'Trop de requêtes, veuillez réessayer plus tard.'
    });
  }
});

/**
 * Rate limiter strict pour les tentatives de login
 * Limite: 5 tentatives par 15 minutes
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 tentatives de login
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne compte que les échecs
  handler: (req, res) => {
    logger.warn(`Tentatives de login excessives pour IP: ${req.ip}, email: ${req.body?.email || 'inconnu'}`);
    res.status(429).json({
      success: false,
      message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
    });
  }
});

/**
 * Middleware de sanitization MongoDB
 * Protège contre les injections NoSQL
 */
const sanitizeData = mongoSanitize({
  replaceWith: '_', // Remplace les caractères dangereux par '_'
  onSanitize: ({ req, key }) => {
    logger.warn(`Tentative d'injection détectée - IP: ${req.ip}, clé: ${key}`);
  }
});

module.exports = {
  helmetConfig,
  publicRateLimiter,
  authRateLimiter,
  loginRateLimiter,
  sanitizeData
};
