const REGION_TO_PROVINCE = {
  'Analamanga': 'Antananarivo',
  'Atsinanana': 'Toamasina',
  'Diana': 'Antsiranana',
  'Boeny': 'Mahajanga',
  'Atsimo-Andrefana': 'Toliara',
  'Vatovavy-Fitovinany': 'Fianarantsoa',
  'Menabe': 'Toliara',
  'Analanjirofo': 'Toamasina',
  'Vakinankaratra': 'Antananarivo',
  'Itasy': 'Antananarivo',
  'Bongolava': 'Antananarivo',
  'Sava': 'Antsiranana',
  'Sofia': 'Mahajanga',
  'Betsiboka': 'Mahajanga',
  'Melaky': 'Mahajanga',
  'Alaotra-Mangoro': 'Toamasina',
  'Amoron\'i Mania': 'Fianarantsoa',
  'Haute Matsiatra': 'Fianarantsoa',
  'Ihorombe': 'Fianarantsoa',
  'Atsimo-Atsinanana': 'Fianarantsoa',
  'Androy': 'Toliara',
  'Anosy': 'Toliara'
};

/**
 * Formate le nom de l'aéroport pour l'affichage
 * @param {Object} airport - L'objet aéroport contenant name, city, region, code
 * @returns {string} Le nom formaté de l'aéroport
 */
export const formatAirportName = (airport) => {
  if (!airport) return 'Aéroport International';

  // Exception pour Ivato
  if (airport.code === 'TNR' || airport.name.toLowerCase().includes('ivato')) {
    return "Aéroport d'Ivato";
  }

  // Récupérer la province depuis la région, ou utiliser la région/ville comme fallback
  const region = airport.region;
  const province = REGION_TO_PROVINCE[region] || region || airport.city;
  
  // Gestion de l'élision (de/d')
  const vowels = ['a', 'e', 'i', 'o', 'u', 'y', 'h'];
  const firstChar = province.charAt(0).toLowerCase();
  const prefix = vowels.includes(firstChar) ? "d'" : "de ";

  return `Aéroport ${prefix}${province}`;
};
