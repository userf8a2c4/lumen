import React from 'react';
import { Github, Cpu } from 'lucide-react';

const MODEL_LABELS = {
  'claude-sonnet-4-20250514': 'Claude Sonnet 4',
  'claude-haiku-4-5-20251001': 'Claude Haiku 4.5',
  'claude-opus-4-6': 'Claude Opus 4.6',
};

const SYNC_CONFIG = {
  idle: { dot: 'var(--lumen-text-muted)', label: 'Sin verificar' },
  synced: { dot: '#10b981', label: 'Actualizado' },
  update: { dot: '#f59e0b', label: 'Actualizacion disponible' },
  error: { dot: '#ef4444', label: 'Sin conexion' },
};

export default function StatusBar({ version, syncStatus, model }) {
  const sync = SYNC_CONFIG[syncStatus] || SYNC_CONFIG.idle;
  const modelLabel = MODEL_LABELS[model] || model;

  return (
    <footer className="flex items-center justify-between px-5 py-1.5 text-[11px] select-none"
      style={{ background: 'var(--lumen-surface)', borderTop: '1px solid var(--lumen-border)', color: 'var(--lumen-text-muted)' }}>
      <div className="flex items-center gap-4">
        <span className="font-mono">v{version}</span>
        <div className="flex items-center gap-1.5">
          <Github size={11} />
          <div className="w-[6px] h-[6px] rounded-full" style={{ background: sync.dot }} />
          <span>{sync.label}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Cpu size={11} />
        <span>{modelLabel}</span>
      </div>
    </footer>
  );
}
