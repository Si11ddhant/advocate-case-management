import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer
}) => {
  // Listen for Escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-200" 
        onClick={onClose} 
      />

      {/* Modal Content container */}
      <div className="relative z-10 w-full max-w-lg scale-[0.99] animate-in fade-in zoom-in-95 duration-150 rounded-xl border border-border bg-card text-card-foreground shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="!p-1 h-auto text-muted-foreground hover:text-foreground">
            <X size={18} />
          </Button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end space-x-2 border-t border-border p-4 bg-muted/50 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
