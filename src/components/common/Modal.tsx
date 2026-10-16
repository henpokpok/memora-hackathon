import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'max-w-2xl',
}) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-150">
      {/* Clickable Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Card with smooth rounded corners and clean inner scrolling */}
      <div
        className={`relative z-10 bg-white rounded-[32px] ${maxWidth} w-full max-h-[90vh] border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden text-left`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Sticky Header with perfect top border-radius */}
        {(title || icon) && (
          <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100 bg-white shrink-0">
            <div className="flex items-center space-x-3">
              {icon && (
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs shrink-0">
                  {icon}
                </div>
              )}
              <div>
                {title && <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>}
                {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Scrollable Body with safe padding */}
        <div className="overflow-y-auto px-6 sm:px-8 py-6 space-y-5 flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
