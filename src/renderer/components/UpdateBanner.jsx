import React from 'react';
import { Download, Loader2, X, RefreshCw } from 'lucide-react';

export default function UpdateBanner({ update, onInstall, onDismiss }) {
  if (!update) return null;

  const pct     = Math.round(update.percent || 0);
  const isDl    = update.status === 'downloading';
  const isDone  = update.status === 'downloaded';
  const isAvail = update.status === 'available';

  return (
    <div style={{ background: 'rgba(126,63,242,0.07)', borderBottom: '1px solid rgba(126,63,242,0.16)' }}>
      {/* Main bar */}
      <div className="flex items-center justify-between px-5 py-2">
        <div className="flex items-center gap-2.5" style={{ color: 'var(--lumen-accent)', fontSize: 12 }}>

          {/* Icon */}
          {isDone
            ? <Download size={13} />
            : <Loader2 size={13} className="animate-spin" />}

          {/* Text */}
          {isAvail && (
            <span>
              Nueva versión <strong>v{update.version}</strong> disponible — descargando…
            </span>
          )}
          {isDl && (
            <span>
              Descargando <strong>v{update.version}</strong>… {pct}%
            </span>
          )}
          {isDone && (
            <span>
              <strong>v{update.version}</strong> lista — haz clic para instalar y reiniciar LUMEN
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDone && (
            <button
              onClick={onInstall}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 14px', borderRadius: 6, cursor: 'pointer',
                fontSize: 11, fontWeight: 700,
                background: 'rgba(126,63,242,0.25)', border: '1px solid rgba(126,63,242,0.5)',
                color: '#c4b5fd', transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(126,63,242,0.38)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(126,63,242,0.25)'; }}
            >
              <RefreshCw size={11} /> Instalar y reiniciar
            </button>
          )}
          <button
            onClick={onDismiss}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: 'var(--lumen-text-muted)', opacity: 0.6 }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Progress bar — visible while downloading */}
      {(isDl || isAvail) && (
        <div style={{ height: 2, background: 'rgba(126,63,242,0.15)', position: 'relative' }}>
          <div style={{
            height: '100%',
            width: isDl ? `${pct}%` : '0%',
            background: 'rgba(126,63,242,0.7)',
            transition: 'width 0.4s ease',
          }} />
        </div>
      )}
    </div>
  );
}
