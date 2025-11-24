import React from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Plane, 
  XCircle,
  Bell
} from 'lucide-react';

const StatusIndicator = ({ status, flight }) => {
  
  // Calculer le délai si le vol est retardé
  const getDelayMinutes = () => {
    if (!flight || status !== 'delayed') return 0;
    
    const scheduledTime = flight.type === 'departure' 
      ? new Date(flight.scheduledDeparture)
      : new Date(flight.scheduledArrival);
    
    const estimatedTime = flight.type === 'departure'
      ? flight.estimatedDeparture ? new Date(flight.estimatedDeparture) : null
      : flight.estimatedArrival ? new Date(flight.estimatedArrival) : null;
    
    if (!estimatedTime) return 0;
    
    const delayMs = estimatedTime - scheduledTime;
    return Math.max(0, Math.floor(delayMs / (1000 * 60)));
  };

  const delayMinutes = getDelayMinutes();

  // Configuration des statuts avec messages dynamiques
  const statusConfig = {
    'scheduled': {
      label: 'Programmé',
      icon: Clock,
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-700',
      iconColor: 'text-slate-500',
      borderColor: 'border-slate-200'
    },
    'on-time': {
      label: 'À l\'heure',
      icon: CheckCircle2,
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-800',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-200'
    },
    'delayed': {
      label: delayMinutes > 0 ? `Retardé ${delayMinutes} min` : 'Retardé',
      icon: AlertTriangle,
      bgColor: delayMinutes > 30 ? 'bg-rose-100' : 'bg-amber-100',
      textColor: delayMinutes > 30 ? 'text-rose-800' : 'text-amber-800',
      iconColor: delayMinutes > 30 ? 'text-rose-600' : 'text-amber-600',
      borderColor: delayMinutes > 30 ? 'border-rose-200' : 'border-amber-200'
    },
    'boarding': {
      label: '🔔 EMBARQUEMENT',
      icon: Bell,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800 font-bold',
      iconColor: 'text-green-600',
      borderColor: 'border-green-300',
      animate: true
    },
    'departed': {
      label: 'Décollé',
      icon: Plane,
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-600',
      iconColor: 'text-slate-500',
      borderColor: 'border-slate-200'
    },
    'in-flight': {
      label: 'En vol',
      icon: Plane,
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    },
    'landed': {
      label: 'Atterri',
      icon: CheckCircle2,
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-600',
      iconColor: 'text-slate-500',
      borderColor: 'border-slate-200'
    },
    'cancelled': {
      label: '❌ ANNULÉ',
      icon: XCircle,
      bgColor: 'bg-rose-100',
      textColor: 'text-rose-800 font-bold',
      iconColor: 'text-rose-600',
      borderColor: 'border-rose-300'
    }
  };

  const config = statusConfig[status] || statusConfig['scheduled'];
  const Icon = config.icon;

  return (
    <div className={`
      inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2
      ${config.bgColor} ${config.textColor} ${config.borderColor}
      ${config.animate ? 'animate-pulse' : ''}
      transition-all duration-300 shadow-sm
    `}>
      <Icon className={`h-5 w-5 ${config.iconColor} flex-shrink-0`} strokeWidth={2.5} />
      <span className="font-semibold text-sm tracking-wide whitespace-nowrap">
        {config.label}
      </span>
    </div>
  );
};

export default StatusIndicator;
