const StatusIndicator = ({ status }) => {
  const getStatusClass = () => {
    switch (status) {
      case 'scheduled': return 'status-scheduled';
      case 'on-time': return 'status-on-time';
      case 'boarding': return 'status-boarding';
      case 'departed': return 'status-departed';
      case 'in-flight': return 'status-in-flight';
      case 'landed': return 'status-landed';
      case 'arrived': return 'status-arrived';
      case 'delayed': return 'status-delayed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-scheduled';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'scheduled': return 'Prévu';
      case 'on-time': return 'À l\'heure';
      case 'boarding': return 'Embarquement';
      case 'departed': return 'Décollé';
      case 'in-flight': return 'En vol';
      case 'landed': return 'Atterri';
      case 'arrived': return 'Arrivé';
      case 'delayed': return 'Retardé';
      case 'cancelled': return 'Annulé';
      default: return status || 'N/A';
    }
  };

  return (
    <div className={`status-badge ${getStatusClass()}`}>
      {getLabel()}
    </div>
  );
};

export default StatusIndicator;
