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
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'var(--lumen-overlay)' }} onClick={onClose} />
      <div className={`relative rounded-2xl shadow-2xl
        ${wide ? 'w-full max-w-3xl' : 'w-full max-w-lg'} max-h-[85vh] flex flex-col`}
        style={{ background: 'var(--lumen-card)', border: '1px solid var(--lumen-border)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--lumen-border)' }}>
          <h2 className="text-[15px] font-semibold" style={{ color: 'var(--lumen-text)' }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--lumen-text-muted)' }}>
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
