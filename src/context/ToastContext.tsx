import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'info' | 'error';

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const icons = {
    success: <CheckCircle className="text-emerald-500 mr-2 flex-shrink-0" size={20} />,
    warning: <AlertTriangle className="text-amber-500 mr-2 flex-shrink-0" size={20} />,
    info: <Info className="text-sky-500 mr-2 flex-shrink-0" size={20} />,
    error: <AlertTriangle className="text-rose-500 mr-2 flex-shrink-0" size={20} />,
  };

  const backgroundColors = {
    success: 'bg-card border-emerald-500/20 text-foreground dark:border-emerald-500/30',
    warning: 'bg-card border-amber-500/20 text-foreground dark:border-amber-500/30',
    info: 'bg-card border-sky-500/20 text-foreground dark:border-sky-500/30',
    error: 'bg-card border-rose-500/20 text-foreground dark:border-rose-500/30',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`flex items-start p-4 rounded-xl border shadow-lg glass animate-in slide-in-from-bottom-5 duration-200 ${backgroundColors[t.type]}`}
          >
            {icons[t.type]}
            <div className="flex-1 text-sm font-medium mr-2">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-muted-foreground hover:text-foreground p-0.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
