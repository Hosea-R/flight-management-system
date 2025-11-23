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
      <div className="flex items-baseline gap-1">
        <div className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tight tabular-nums">
          {format(currentTime, 'HH:mm')}
        </div>
        <div className="text-3xl font-bold text-indigo-400 tabular-nums animate-pulse-soft">
          :{format(currentTime, 'ss')}
        </div>
      </div>
      <div className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mt-1">
        {format(currentTime, 'EEEE d MMMM', { locale: fr })}
      </div>
    </div>
  );
};

export default Clock;
