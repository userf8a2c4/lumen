import React from 'react';
import LumenLogo from './LumenLogo';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen" style={{ background: '#000000' }}>
      <div className="animate-fade-in-up">
        <LumenLogo size={64} />
      </div>
      <h1
        className="text-3xl font-light tracking-[0.25em] animate-fade-in-up mt-5"
        style={{ animationDelay: '0.15s', opacity: 0, color: 'rgba(255,255,255,0.88)' }}
      >
        LUMEN
      </h1>
      <p
        className="mt-2 text-[10px] font-medium tracking-widest uppercase animate-fade-in-up"
        style={{ animationDelay: '0.35s', opacity: 0, color: 'var(--lumen-text-muted)' }}
      >
        Motor de Conocimiento Personal
      </p>
      <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.55s', opacity: 0 }}>
        <div className="w-40 h-px overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full"
            style={{ background: 'rgba(255,255,255,0.55)', animation: 'loadBar 1.8s ease-in-out forwards' }}
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
