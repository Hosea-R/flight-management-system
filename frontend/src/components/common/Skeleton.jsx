const Skeleton = ({ className = '', variant = 'default' }) => {
  const baseStyles = 'animate-pulse bg-gray-200 rounded';
  
  const variants = {
    default: 'h-4',
    text: 'h-4',
    title: 'h-6',
    circle: 'rounded-full',
    card: 'h-48'
  };
  
  const variantClass = variants[variant] || variants.default;
  
  return <div className={`${baseStyles} ${variantClass} ${className}`} />;
};

// Skeleton pour texte multi-lignes
Skeleton.Text = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={i === lines - 1 ? 'w-3/4' : 'w-full'} />
    ))}
  </div>
);

// Skeleton pour carte
Skeleton.Card = ({ className = '' }) => (
  <div className={`border border-gray-200 rounded-lg p-6 ${className}`}>
    <Skeleton variant="title" className="w-1/2 mb-4" />
    <Skeleton.Text lines={3} />
  </div>
);

// Skeleton pour avatar
Skeleton.Avatar = ({ size = 'md' }) => {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };
  return <Skeleton variant="circle" className={sizes[size]} />;
};

export default Skeleton;
