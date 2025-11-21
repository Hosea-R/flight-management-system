import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Clock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="display-clock flex flex-col items-end">
      <div className="text-4xl font-bold text-slate-900 tracking-tight">
        {format(currentTime, 'HH:mm')}
      </div>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">
        {format(currentTime, 'EEEE d MMMM', { locale: fr })}
      </div>
    </div>
  );
};

export default Clock;
