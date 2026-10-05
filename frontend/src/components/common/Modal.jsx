import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-xl' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div 
          className="fixed inset-0 bg-[#060103]/80 backdrop-blur-md transition-opacity" 
          onClick={onClose} 
        />
        <div className={`relative transform overflow-hidden rounded-2xl glass-panel-elevated text-left transition-all sm:my-8 w-full ${maxWidth} border border-[rgba(245,230,211,0.18)] shadow-2xl`}>
          {/* Subtle top golden light line */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[rgba(245,230,211,0.35)] to-transparent" />
          
          <div className="flex items-center justify-between px-6 py-4.5 border-b border-[rgba(245,230,211,0.1)] bg-[rgba(255,255,255,0.02)]">
            <h3 className="font-editorial text-xl font-normal text-[#faf6f0] tracking-wide">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-[#baa293] hover:text-white hover:bg-[rgba(255,255,255,0.08)] border border-transparent hover:border-[rgba(245,230,211,0.15)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-5 text-[#f5ede6]">{children}</div>
        </div>
      </div>
    </div>
  );
};
