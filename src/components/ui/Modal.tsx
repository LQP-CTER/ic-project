import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/55 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} bg-white rounded-[1.35rem] border border-white/70 shadow-lg animate-scale-in max-h-[90vh] flex flex-col overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-border bg-slate-50/70">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary mb-1">IC Platform</p>
            <h2 className="text-lg font-extrabold tracking-tight text-text-primary">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-text-secondary hover:bg-white hover:text-text-primary border border-transparent hover:border-border transition-all"
          >
            Đóng
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}