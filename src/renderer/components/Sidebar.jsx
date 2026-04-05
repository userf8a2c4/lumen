import React from 'react';
import { Bot, BookOpen, Search, Users, FileText, Settings, StickyNote, Sun, Moon, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import LumenLogo from './LumenLogo';

const NAV_ITEMS = [
  { id: 'assistant', label: 'Asistente', icon: Bot },
  { id: 'knowledge', label: 'Conocimiento', icon: BookOpen },
  { id: 'search', label: 'Busqueda', icon: Search },
  { id: 'contacts', label: 'Escalacion', icon: Users },
  { id: 'examples', label: 'Ejemplos', icon: FileText },
  { id: 'notes', label: 'Notas', icon: StickyNote },
];

export default function Sidebar({ activeModule, onNavigate, collapsed, onToggleCollapse, theme, onToggleTheme }) {
  return (
    <aside className={`flex flex-col shrink-0 transition-all duration-300 ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}
      style={{ background: 'var(--lumen-surface)', borderRight: '1px solid var(--lumen-border)' }}>
      {/* Logo */}
      <div className={`flex items-center gap-3 py-5 ${collapsed ? 'px-2 justify-center' : 'px-5'}`}>
        <div className="shrink-0">
          <LumenLogo size={collapsed ? 30 : 34} />
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-semibold text-sm tracking-wider" style={{ color: '#7E3FF2', letterSpacing: '0.12em' }}>LUMEN</h1>
            <p className="text-[10px] -mt-0.5 font-medium" style={{ color: 'var(--lumen-text-muted)' }}>Motor de Conocimiento Personal</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t" style={{ borderColor: 'var(--lumen-border)' }} />

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
                ${collapsed ? 'px-0 justify-center' : 'px-3'}`}
              style={{
                background: isActive ? 'rgba(126,63,242,0.1)' : 'transparent',
                color: isActive ? '#7E3FF2' : 'var(--lumen-text-secondary)',
                boxShadow: isActive ? '0 1px 3px rgba(126,63,242,0.05)' : 'none',
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#7E3FF2' }} />}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-2 pb-3 space-y-0.5 border-t pt-2" style={{ borderColor: 'var(--lumen-border)' }}>
        {/* Settings */}
        <button
          onClick={() => onNavigate('settings')}
          title={collapsed ? 'Configuracion' : undefined}
          className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
            ${collapsed ? 'px-0 justify-center' : 'px-3'}`}
          style={{
            background: activeModule === 'settings' ? 'rgba(126,63,242,0.1)' : 'transparent',
            color: activeModule === 'settings' ? '#7E3FF2' : 'var(--lumen-text-secondary)',
          }}
        >
          <Settings size={18} strokeWidth={activeModule === 'settings' ? 2 : 1.5} />
          {!collapsed && <span>Configuracion</span>}
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={collapsed ? (theme === 'dark' ? 'Modo dia' : 'Modo noche') : undefined}
          className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
            ${collapsed ? 'px-0 justify-center' : 'px-3'}`}
          style={{ color: 'var(--lumen-text-secondary)' }}
        >
          {theme === 'dark' ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
          {!collapsed && <span>{theme === 'dark' ? 'Modo dia' : 'Modo noche'}</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir menu' : 'Colapsar menu'}
          className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
            ${collapsed ? 'px-0 justify-center' : 'px-3'}`}
          style={{ color: 'var(--lumen-text-muted)' }}
        >
          {collapsed ? <PanelLeftOpen size={18} strokeWidth={1.5} /> : <PanelLeftClose size={18} strokeWidth={1.5} />}
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
