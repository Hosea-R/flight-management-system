const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-600 ring-slate-500/10',
    primary: 'bg-blue-50 text-blue-600 ring-blue-600/20',
    success: 'bg-emerald-50 text-emerald-600 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-600 ring-amber-600/20',
    danger: 'bg-rose-50 text-rose-600 ring-rose-600/20',
    info: 'bg-cyan-50 text-cyan-600 ring-cyan-600/20',
    purple: 'bg-violet-50 text-violet-600 ring-violet-600/20'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  const variantClass = variants[variant] || variants.default;
  const sizeClass = sizes[size] || sizes.md;
  
  return (
    <span className={`inline-flex items-center font-medium rounded-md ring-1 ring-inset ${variantClass} ${sizeClass} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
