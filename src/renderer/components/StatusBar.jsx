import React from 'react';
import { Github, Cpu } from 'lucide-react';

const MODEL_LABELS = {
  'claude-sonnet-4-20250514': 'Claude Sonnet 4',
  'claude-haiku-4-5-20251001': 'Claude Haiku 4.5',
  'claude-opus-4-6': 'Claude Opus 4.6',
};

const SYNC_CONFIG = {
  idle: { dot: 'bg-lumen-text-muted', label: 'Sin verificar' },
  synced: { dot: 'bg-emerald-400 shadow-emerald-400/50 shadow-sm', label: 'Actualizado' },
  update: { dot: 'bg-amber-400 shadow-amber-400/50 shadow-sm', label: 'Actualización disponible' },
  error: { dot: 'bg-red-400', label: 'Sin conexión' },
};

export default function StatusBar({ version, syncStatus, model }) {
  const sync = SYNC_CONFIG[syncStatus] || SYNC_CONFIG.idle;
  const modelLabel = MODEL_LABELS[model] || model;

  return (
    <footer className="flex items-center justify-between px-5 py-1.5 bg-lumen-surface border-t border-lumen-border text-[11px] text-lumen-text-muted select-none">
      {/* Version */}
      <div className="flex items-center gap-4">
        <span className="font-mono">v{version}</span>

        {/* GitHub sync */}
        <div className="flex items-center gap-1.5">
          <Github size={11} />
          <div className={`w-[6px] h-[6px] rounded-full ${sync.dot}`} />
          <span>{sync.label}</span>
        </div>
      </div>

      {/* Model */}
      <div className="flex items-center gap-1.5">
        <Cpu size={11} />
        <span>{modelLabel}</span>
      </div>
    </footer>
  );
}
