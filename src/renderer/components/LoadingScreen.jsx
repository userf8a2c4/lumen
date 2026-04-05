import React from 'react';
import LumenLogo from './LumenLogo';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen" style={{ background: 'var(--lumen-bg)' }}>
      <div className="animate-fade-in-up">
        <LumenLogo size={72} />
      </div>
      <h1
        className="text-4xl font-semibold tracking-[0.2em] animate-lumen-glow animate-fade-in-up mt-5"
        style={{ animationDelay: '0.15s', opacity: 0, color: '#7E3FF2' }}
      >
        LUMEN
      </h1>
      <p
        className="mt-2 text-xs font-medium tracking-widest uppercase animate-fade-in-up"
        style={{ animationDelay: '0.35s', opacity: 0, color: 'var(--lumen-text-muted)' }}
      >
        Motor de Conocimiento Personal
      </p>
      <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.55s', opacity: 0 }}>
        <div className="w-48 h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--lumen-border)' }}>
          <div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #7E3FF2, #9B5BFF)', animation: 'loadBar 1.8s ease-in-out forwards' }}
          />
        </div>
      </div>
      <style>{`
        @keyframes loadBar {
          0%   { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
