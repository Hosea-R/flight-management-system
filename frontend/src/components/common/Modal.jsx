import { X } from 'lucide-react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const Modal = ({ open, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw]'
  };

  const sizeClass = sizes[size] || sizes.md;

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-all duration-300 modal-backdrop"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-end sm:items-center justify-center p-0 sm:p-4">
        <div 
          className={`relative bg-white/90 backdrop-blur-xl rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl ring-1 ring-white/50 ${sizeClass} w-full transform transition-all duration-300 modal-content max-h-[95vh] sm:max-h-[90vh] flex flex-col`}
          role="dialog"
          aria-modal="true"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-6 border-b border-slate-100/50 flex-shrink-0">
            {/* Mobile drag indicator */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-slate-300 rounded-full sm:hidden"></div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight mt-4 sm:mt-0">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content - Scrollable */}
          <div className="p-6 sm:p-8 overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Composant Footer pour le Modal
Modal.Footer = ({ children }) => (
  <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-6 border-t border-slate-100/50 mt-4">
    {children}
  </div>
);

export default Modal;
