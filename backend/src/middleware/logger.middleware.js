const logger = require('../config/logger');

/**
 * Middleware pour logger toutes les requêtes HTTP
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Logger la requête entrante
  logger.info(`Incoming ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id || null
  });

  // Capturer la réponse
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id || null
    };

    // Logger selon le code de statut
    if (res.statusCode >= 500) {
      logger.error(`${req.method} ${req.path} - ${res.statusCode}`, logData);
    } else if (res.statusCode >= 400) {
      logger.warn(`${req.method} ${req.path} - ${res.statusCode}`, logData);
    } else {
      logger.info(`${req.method} ${req.path} - ${res.statusCode}`, logData);
    }
  });

  next();
};

/**
 * Middleware pour logger les erreurs
 */
const errorLogger = (err, req, res, next) => {
  logger.error('Erreur serveur', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: req.user?.id || null,
    body: req.body
  });
  
  next(err);
};

module.exports = {
  requestLogger,
  errorLogger
};
