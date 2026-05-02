import React from 'react';
import { Github, Cpu } from 'lucide-react';

const VALID_MODELS = {
  'gemini-2.5-flash':      'Gemini 2.5 Flash',
  'gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
  'gemini-2.5-pro':        'Gemini 2.5 Pro',
  'gemini-2.5-pro-exp':    'Gemini 2.5 Pro',
  'gemini-2.0-flash':      'Gemini 2.0 Flash',
  'gemini-2.0-flash-exp':  'Gemini 2.0 Flash',
  'gemini-1.5-flash':      'Gemini Flash',
  'gemini-1.5-pro':        'Gemini Pro',
};

const SYNC_CONFIG = {
  idle:    { dot: 'var(--lumen-text-muted)', label: 'Sin verificar' },
  synced:  { dot: '#10b981',                 label: 'Actualizado'   },
  update:  { dot: '#f59e0b',                 label: 'Actualización disponible' },
  error:   { dot: '#ef4444',                 label: 'Sin conexión'  },
};

export default function StatusBar({ version, syncStatus, model }) {
  const sync = SYNC_CONFIG[syncStatus] || SYNC_CONFIG.idle;
  // Only show recognized Gemini models — never expose internal/claude model IDs
  const modelLabel = VALID_MODELS[model] || 'Google Gemini';

  return (
    <footer className="flex items-center justify-between px-5 py-1.5 text-[10px] font-medium select-none"
      style={{ background: 'var(--lumen-surface)', borderTop: '1px solid var(--lumen-border)', color: 'var(--lumen-text-muted)' }}>
      <div className="flex items-center gap-4">
        <span className="font-mono tracking-wide">v{version}</span>
        <div className="flex items-center gap-1.5">
          <Github size={10} />
          <div className="w-[5px] h-[5px] rounded-full" style={{ background: sync.dot }} />
          <span>{sync.label}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5" style={{ opacity: 0.7 }}>
        <span style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}>v{version} Chiquisaurias Edition</span>
      </div>
    </footer>
  );
}
