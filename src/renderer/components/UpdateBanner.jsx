import React from 'react';
import { Download, Loader2, X } from 'lucide-react';

export default function UpdateBanner({ update, onInstall, onDismiss }) {
  if (!update) return null;

  return (
    <div className="flex items-center justify-between px-5 py-2"
      style={{ background: 'rgba(126,63,242,0.08)', borderBottom: '1px solid rgba(126,63,242,0.18)' }}>
      <div className="flex items-center gap-2.5 text-[12px]" style={{ color: 'var(--lumen-accent)' }}>
        {(update.status === 'available' || update.status === 'downloading') && (
          <>
            <Loader2 size={13} className="animate-spin" />
            <span>
              {update.status === 'downloading'
                ? `Descargando actualización… ${Math.round(update.percent || 0)}%`
                : `Nueva versión disponible — descargando en segundo plano…`}
            </span>
          </>
        )}
        {update.status === 'downloaded' && (
          <>
            <Download size={13} />
            <span>
              <strong>v{update.version}</strong> lista para instalar
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {update.status === 'downloaded' && (
          <button
            onClick={onInstall}
            className="btn-accent !py-1 !px-3 !text-xs"
          >
            Instalar y reiniciar
          </button>
        )}
        <button onClick={onDismiss} className="p-1 rounded-lg transition-colors">
          <X size={12} style={{ color: 'var(--lumen-text-muted)' }} />
        </button>
      </div>
    </div>
  );
}
