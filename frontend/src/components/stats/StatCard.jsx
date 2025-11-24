import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, change, changeType, color = 'indigo', subtitle }) => {
  const colorStyles = {
    indigo: {
      bg: 'bg-white',
      text: 'text-blue-600',
      iconBg: 'bg-blue-50',
      gradient: 'from-blue-500 to-violet-500'
    },
    blue: {
      bg: 'bg-white',
      text: 'text-cyan-600',
      iconBg: 'bg-cyan-50',
      gradient: 'from-cyan-400 to-blue-500'
    },
    green: {
      bg: 'bg-white',
      text: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      gradient: 'from-emerald-400 to-teal-500'
    },
    orange: {
      bg: 'bg-white',
      text: 'text-amber-600',
      iconBg: 'bg-amber-50',
      gradient: 'from-amber-400 to-orange-500'
    },
    red: {
      bg: 'bg-white',
      text: 'text-rose-600',
      iconBg: 'bg-rose-50',
      gradient: 'from-rose-400 to-red-500'
    },
    purple: {
      bg: 'bg-white',
      text: 'text-violet-600',
      iconBg: 'bg-violet-50',
      gradient: 'from-violet-400 to-fuchsia-500'
    }
  };

  const style = colorStyles[color] || colorStyles.indigo;

  const renderTrend = () => {
    if (!change && change !== 0) return null;

    if (changeType === 'increase' || change > 0) {
      return (
        <div className="flex items-center text-emerald-600 text-sm font-medium mt-2 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
          <TrendingUp className="h-3.5 w-3.5 mr-1" />
          <span>+{Math.abs(change)}%</span>
        </div>
      );
    } else if (changeType === 'decrease' || change < 0) {
      return (
        <div className="flex items-center text-red-600 text-sm font-medium mt-2 bg-red-50 px-2 py-1 rounded-lg w-fit">
          <TrendingDown className="h-3.5 w-3.5 mr-1" />
          <span>-{Math.abs(change)}%</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-slate-500 text-sm font-medium mt-2 bg-slate-50 px-2 py-1 rounded-lg w-fit">
          <Minus className="h-3.5 w-3.5 mr-1" />
          <span>Stable</span>
        </div>
      );
    }
  };

  return (
    <div className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${style.gradient} opacity-5 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:scale-150 transition-transform duration-500`}></div>
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-2 font-medium">
              {subtitle}
            </p>
          )}
          {renderTrend()}
        </div>
        <div className={`p-3 rounded-xl ${style.iconBg} ${style.text} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;

