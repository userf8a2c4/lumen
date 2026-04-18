import React from 'react';
import { Download, RefreshCw, X } from 'lucide-react';

export default function UpdateBanner({ update, onDownload, onInstall, onDismiss }) {
  if (!update) return null;

  return (
    <div className="flex items-center justify-between px-5 py-2.5"
      style={{ background: 'rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-2 text-[13px] font-medium" style={{ color: 'var(--lumen-accent)' }}>
        {update.status === 'available' && (
          <><Download size={14} /><span>Nueva version disponible: <strong>v{update.version}</strong></span></>
        )}
        {update.status === 'downloading' && (
          <><RefreshCw size={14} className="animate-spin" /><span>Descargando... {Math.round(update.percent || 0)}%</span></>
        )}
        {update.status === 'downloaded' && (
          <><Download size={14} /><span>Actualizacion lista. Reinicia para aplicar <strong>v{update.version}</strong></span></>
        )}
      </div>
      <div className="flex items-center gap-2">
        {update.status === 'available' && (
          <button onClick={onDownload} className="btn-accent !py-1 !px-3 !text-xs">Descargar</button>
        )}
        {update.status === 'downloaded' && (
          <button onClick={onInstall} className="btn-accent !py-1 !px-3 !text-xs">Reiniciar ahora</button>
        )}
        <button onClick={onDismiss} className="p-1 rounded-lg transition-colors">
          <X size={13} style={{ color: 'var(--lumen-text-muted)' }} />
        </button>
      </div>
    </div>
  );
}
