import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, children, onClose, wide = false }) {
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-lumen-card border border-lumen-border rounded-2xl shadow-2xl shadow-black/50
        ${wide ? 'w-full max-w-3xl' : 'w-full max-w-lg'} max-h-[85vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-lumen-border">
          <h2 className="text-[15px] font-semibold text-lumen-text">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-lumen-card-hover rounded-lg transition-colors">
            <X size={16} className="text-lumen-text-muted" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
