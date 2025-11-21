import toast from 'react-hot-toast';

// Toast de succès
export const showSuccess = (message) => {
  return toast.success(message, {
    duration: 3000,
    position: 'top-right',
    style: {
      background: '#10b981',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10b981',
    },
  });
};

// Toast d'erreur
export const showError = (message) => {
  return toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: '#fff',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ef4444',
    },
  });
};

// Toast d'information
export const showInfo = (message) => {
  return toast(message, {
    duration: 3000,
    position: 'top-right',
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#fff',
    },
  });
};

// Toast de chargement
export const showLoading = (message) => {
  return toast.loading(message, {
    position: 'top-right',
  });
};

// Fermer un toast spécifique
export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

// Fermer tous les toasts
export const dismissAllToasts = () => {
  toast.dismiss();
};

// Toast avec promesse (pour les opérations async)
export const showPromise = (promise, messages) => {
  return toast.promise(promise, {
    loading: messages.loading || 'Chargement...',
    success: messages.success || 'Succès !',
    error: messages.error || 'Une erreur est survenue',
  });
};

export default {
  success: showSuccess,
  error: showError,
  info: showInfo,
  loading: showLoading,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
  promise: showPromise
};
