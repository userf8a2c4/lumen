import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-lumen-bg">
      <div className="animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-lumen-accent flex items-center justify-center mb-5 mx-auto shadow-lg shadow-lumen-accent/30 animate-pulse-glow">
          <span className="text-white font-bold text-2xl">L</span>
        </div>
      </div>
      <h1
        className="text-5xl font-bold tracking-widest text-lumen-accent animate-lumen-glow animate-fade-in-up"
        style={{ animationDelay: '0.15s', opacity: 0 }}
      >
        LUMEN
      </h1>
      <p
        className="mt-3 text-sm text-lumen-text-muted animate-fade-in-up"
        style={{ animationDelay: '0.35s', opacity: 0 }}
      >
        Claridad en cada proceso
      </p>
      <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.55s', opacity: 0 }}>
        <div className="w-48 h-1 bg-lumen-border rounded-full overflow-hidden">
          <div
            className="h-full bg-lumen-accent rounded-full"
            style={{ animation: 'loadBar 1.8s ease-in-out forwards' }}
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
