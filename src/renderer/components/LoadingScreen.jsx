import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen" style={{ background: 'var(--lumen-bg)' }}>
      <div className="animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 mx-auto shadow-lg animate-pulse-glow"
          style={{ background: '#7E3FF2', boxShadow: '0 4px 30px rgba(126,63,242,0.3)' }}>
          <span className="text-white font-bold text-2xl">L</span>
        </div>
      </div>
      <h1
        className="text-5xl font-bold tracking-widest animate-lumen-glow animate-fade-in-up"
        style={{ animationDelay: '0.15s', opacity: 0, color: '#7E3FF2' }}
      >
        LUMEN
      </h1>
      <p
        className="mt-3 text-sm animate-fade-in-up"
        style={{ animationDelay: '0.35s', opacity: 0, color: 'var(--lumen-text-muted)' }}
      >
        Motor de Conocimiento Personal
      </p>
      <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.55s', opacity: 0 }}>
        <div className="w-48 h-1 rounded-full overflow-hidden" style={{ background: 'var(--lumen-border)' }}>
          <div
            className="h-full rounded-full"
            style={{ background: '#7E3FF2', animation: 'loadBar 1.8s ease-in-out forwards' }}
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
