import React from 'react';
import {
  LayoutDashboard, FlaskConical, Library,
  Search, Users, FileText, StickyNote,
  Settings, Sun, Moon,
  PanelLeftClose, PanelLeftOpen, LogOut,
} from 'lucide-react';
import LumenLogo from './LumenLogo';

// Primary navigation — top hierarchy
const PRIMARY_NAV = [
  { id: 'dashboard', label: 'Inicio',      icon: LayoutDashboard },
  { id: 'assistant', label: 'Laboratorio', icon: FlaskConical },
  { id: 'knowledge', label: 'Biblioteca',  icon: Library },
];

// Secondary navigation — tools
const SECONDARY_NAV = [
  { id: 'search',   label: 'Busqueda',  icon: Search },
  { id: 'contacts', label: 'Escalacion', icon: Users },
  { id: 'notes',    label: 'Notas',     icon: StickyNote },
  { id: 'examples', label: 'Ejemplos',  icon: FileText },
];

function NavBtn({ id, label, icon: Icon, active, collapsed, onClick }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`nav-item w-full flex items-center rounded-xl text-[13px] font-medium
        ${active ? 'active' : ''}
        ${collapsed ? 'px-0 justify-center py-2.5' : 'px-3 py-2.5 gap-3'}`}
      style={{ color: active ? '#7E3FF2' : 'var(--lumen-text-secondary)' }}
    >
      <Icon size={17} strokeWidth={active ? 2 : 1.5} />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && active && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#7E3FF2' }} />
      )}
    </button>
  );
}

export default function Sidebar({ activeModule, onNavigate, collapsed, onToggleCollapse, theme, onToggleTheme }) {
  const handleQuit = () => {
    window.lumen?.app?.quit?.();
  };

  return (
    <aside
      className={`glass-sidebar flex flex-col shrink-0 transition-all duration-300 ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 py-5 ${collapsed ? 'px-2 justify-center' : 'px-5'}`}>
        <div className="shrink-0">
          <LumenLogo size={collapsed ? 28 : 32} />
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-semibold text-sm" style={{ color: '#7E3FF2', letterSpacing: '0.1em' }}>LUMEN</h1>
            <p className="text-[10px] -mt-0.5 font-medium" style={{ color: 'var(--lumen-text-muted)' }}>Motor de Conocimiento</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 border-t" style={{ borderColor: 'var(--lumen-border)' }} />

      {/* Primary nav */}
      <nav className="py-3 px-2 space-y-0.5">
        {PRIMARY_NAV.map((item) => (
          <NavBtn
            key={item.id}
            {...item}
            active={activeModule === item.id}
            collapsed={collapsed}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      {/* Separator */}
      {!collapsed && (
        <div className="mx-3 flex items-center gap-2 my-1">
          <div className="flex-1 border-t" style={{ borderColor: 'var(--lumen-border)' }} />
          <span className="text-[9px] font-semibold tracking-widest uppercase" style={{ color: 'var(--lumen-text-muted)' }}>Herramientas</span>
          <div className="flex-1 border-t" style={{ borderColor: 'var(--lumen-border)' }} />
        </div>
      )}
      {collapsed && <div className="mx-3 border-t my-1" style={{ borderColor: 'var(--lumen-border)' }} />}

      {/* Secondary nav */}
      <nav className="px-2 space-y-0.5 flex-1 overflow-y-auto pb-2">
        {SECONDARY_NAV.map((item) => (
          <NavBtn
            key={item.id}
            {...item}
            active={activeModule === item.id}
            collapsed={collapsed}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      {/* Bottom utility — Separator then utilities */}
      <div className="border-t px-2 pt-2 pb-3 space-y-0.5" style={{ borderColor: 'var(--lumen-border)' }}>
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={collapsed ? (theme === 'dark' ? 'Modo dia' : 'Modo noche') : undefined}
          className={`nav-item w-full flex items-center rounded-xl text-[13px] font-medium
            ${collapsed ? 'px-0 justify-center py-2.5' : 'px-3 py-2.5 gap-3'}`}
          style={{ color: 'var(--lumen-text-secondary)' }}
        >
          {theme === 'dark'
            ? <Sun size={17} strokeWidth={1.5} />
            : <Moon size={17} strokeWidth={1.5} />}
          {!collapsed && <span>{theme === 'dark' ? 'Modo dia' : 'Modo noche'}</span>}
        </button>

        {/* Settings */}
        <NavBtn
          id="settings"
          label="Configuracion"
          icon={Settings}
          active={activeModule === 'settings'}
          collapsed={collapsed}
          onClick={() => onNavigate('settings')}
        />

        {/* Exit */}
        <button
          onClick={handleQuit}
          title={collapsed ? 'Salir' : undefined}
          className={`nav-item w-full flex items-center rounded-xl text-[13px] font-medium
            ${collapsed ? 'px-0 justify-center py-2.5' : 'px-3 py-2.5 gap-3'}`}
          style={{ color: 'var(--lumen-text-muted)' }}
        >
          <LogOut size={17} strokeWidth={1.5} />
          {!collapsed && <span>Salir</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir' : 'Colapsar'}
          className={`nav-item w-full flex items-center rounded-xl text-[13px] font-medium
            ${collapsed ? 'px-0 justify-center py-2.5' : 'px-3 py-2.5 gap-3'}`}
          style={{ color: 'var(--lumen-text-muted)' }}
        >
          {collapsed
            ? <PanelLeftOpen size={17} strokeWidth={1.5} />
            : <PanelLeftClose size={17} strokeWidth={1.5} />}
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
