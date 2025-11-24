/**
 * Middleware de pagination réutilisable
 * Parse et valide les paramètres page et limit
 */
const paginate = (req, res, next) => {
  // Récupérer les paramètres de pagination depuis la query string
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  // Validation des limites
  const validatedPage = Math.max(1, page); // Minimum 1
  const validatedLimit = Math.min(Math.max(1, limit), 100); // Entre 1 et 100

  // Calculer le skip (offset)
  const skip = (validatedPage - 1) * validatedLimit;

  // Attacher les données de pagination à l'objet request
  req.pagination = {
    page: validatedPage,
    limit: validatedLimit,
    skip
  };

  next();
};

/**
 * Helper pour formater la réponse paginée
 * @param {Array} data - Les données à retourner
 * @param {Number} total - Nombre total d'éléments
 * @param {Object} pagination - Objet pagination depuis req.pagination
 */
const formatPaginatedResponse = (data, total, pagination) => {
  const totalPages = Math.ceil(total / pagination.limit);
  
  return {
    success: true,
    data,
    pagination: {
      currentPage: pagination.page,
      totalPages,
      totalItems: total,
      itemsPerPage: pagination.limit,
      hasNextPage: pagination.page < totalPages,
      hasPrevPage: pagination.page > 1
    }
  };
};

module.exports = {
  paginate,
  formatPaginatedResponse
};
