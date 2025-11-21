import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ size = 'md', fullscreen = false }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };
  
  const sizeClass = sizes[size] || sizes.md;
  
  if (fullscreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <Loader2 className={`${sizes.xl} text-blue-600 animate-spin mx-auto`} />
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }
  
  return <Loader2 className={`${sizeClass} text-blue-600 animate-spin`} />;
};

export default LoadingSpinner;
