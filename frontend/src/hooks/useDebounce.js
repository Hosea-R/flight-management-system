import { useState, useEffect } from 'react';

/**
 * Custom hook pour debouncer une valeur
 * Utile pour les champs de recherche et filtres
 * 
 * @param {any} value - La valeur à debouncer
 * @param {number} delay - Le délai en millisecondes (par défaut 500ms)
 * @returns {any} La valeur debouncée
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // Effectuer la recherche avec debouncedSearchTerm
 *   fetchResults(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 */
function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Créer un timer qui met à jour la valeur debouncée après le délai
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Nettoyer le timer si la valeur change avant la fin du délai
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
