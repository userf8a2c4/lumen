import React from 'react';
import { Bot, BookOpen, Search, Users, FileText, Settings, Bug } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'assistant', label: 'Asistente', icon: Bot },
  { id: 'knowledge', label: 'Conocimiento', icon: BookOpen },
  { id: 'search', label: 'Búsqueda', icon: Search },
  { id: 'contacts', label: 'Escalación', icon: Users },
  { id: 'examples', label: 'Ejemplos', icon: FileText },
];

export default function Sidebar({ activeModule, onNavigate }) {
  const handleReportError = async () => {
    const desc = window.prompt('Describe el error o problema:');
    if (desc && desc.trim()) {
      await window.lumen.updater.reportError(desc.trim());
    }
  };

  return (
    <aside className="flex flex-col w-[220px] bg-lumen-surface border-r border-lumen-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-9 h-9 rounded-xl bg-lumen-accent flex items-center justify-center shadow-lg shadow-lumen-accent/20 animate-pulse-glow">
          <span className="text-white font-bold text-sm">L</span>
        </div>
        <div>
          <h1 className="text-lumen-accent font-bold text-sm tracking-wider">LUMEN</h1>
          <p className="text-[10px] text-lumen-text-muted -mt-0.5">Asistencia laboral</p>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-lumen-border" />

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
                ${isActive
                  ? 'bg-lumen-accent/10 text-lumen-accent shadow-sm shadow-lumen-accent/5'
                  : 'text-lumen-text-secondary hover:bg-lumen-card hover:text-lumen-text'
                }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              <span>{item.label}</span>
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-lumen-accent" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-3 space-y-1 border-t border-lumen-border pt-2">
        <button
          onClick={() => onNavigate('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
            ${activeModule === 'settings'
              ? 'bg-lumen-accent/10 text-lumen-accent'
              : 'text-lumen-text-secondary hover:bg-lumen-card hover:text-lumen-text'
            }`}
        >
          <Settings size={18} strokeWidth={activeModule === 'settings' ? 2 : 1.5} />
          <span>Configuración</span>
        </button>
        <button
          onClick={handleReportError}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-lumen-text-muted hover:bg-red-500/10 hover:text-red-400 transition-all duration-150"
        >
          <Bug size={18} strokeWidth={1.5} />
          <span>Reportar error</span>
        </button>
      </div>
    </aside>
  );
}
