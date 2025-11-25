import Advertisements from '../Admin/Advertisements';

// Réutiliser la page admin, elle fonctionne déjà parfaitement
// Les permissions backend s'occupent de filtrer les pubs par créateur

const AdManagerAdvertisements = () => {
  return <Advertisements />;
};

export default AdManagerAdvertisements;
