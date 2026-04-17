import React from 'react';
import {
  LayoutDashboard, FlaskConical, Library,
  Users, StickyNote, CalendarDays, ShieldCheck,
  GitBranch, Settings, Sun, Moon, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import LumenLogo from './LumenLogo';

// Primary nav — Blueprint OMNI-OS order
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { id: 'agenda',    label: 'Agenda',      icon: CalendarDays },
  { id: 'assistant', label: 'Laboratorio', icon: FlaskConical },
  { id: 'knowledge', label: 'Biblioteca',  icon: Library },
  { id: 'contacts',  label: 'Directorio',  icon: Users },
  { id: 'notes',     label: 'Notas',       icon: StickyNote },
  { id: 'evidence',  label: 'Evidencias',  icon: ShieldCheck },
  { id: 'logic',     label: 'Diseñador',   icon: GitBranch },
];

function NavBtn({ id, label, icon: Icon, active, collapsed, onClick, muted }) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`nav-item w-full flex items-center rounded-xl text-[13px] font-medium transition-all duration-150
        ${active ? 'active' : ''}
        ${collapsed ? 'px-0 justify-center py-2.5' : 'px-3 py-2.5 gap-3'}`}
      style={{ color: active ? 'var(--lumen-accent)' : muted ? 'var(--lumen-text-muted)' : 'var(--lumen-text-secondary)' }}
    >
      <Icon size={17} strokeWidth={active ? 2 : 1.5} />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && active && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--lumen-accent)' }} />
      )}
    </button>
  );
}

export default function Sidebar({ activeModule, onNavigate, collapsed, onToggleCollapse, theme, onToggleTheme }) {
  return (
    <aside className={`glass-sidebar flex flex-col shrink-0 transition-all duration-300 ${collapsed ? 'w-[58px]' : 'w-[210px]'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 py-[18px] ${collapsed ? 'px-[15px] justify-center' : 'px-5'}`}>
        <LumenLogo size={collapsed ? 26 : 30} />
        {!collapsed && (
          <div>
            <h1 className="font-semibold text-[13px] tracking-[0.1em]" style={{ color: 'var(--lumen-accent)' }}>LUMEN</h1>
            <p className="text-[10px] -mt-0.5 font-light" style={{ color: 'var(--lumen-text-muted)' }}>Motor de Conocimiento</p>
          </div>
        )}
      </div>

      <div className="mx-3 border-t" style={{ borderColor: 'var(--lumen-border)' }} />

      {/* Primary navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavBtn
            key={item.id}
            {...item}
            active={activeModule === item.id}
            collapsed={collapsed}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      {/* Bottom panel — strict order: Theme / Collapse / Settings */}
      <div className="border-t px-2 pt-2 pb-3 space-y-0.5" style={{ borderColor: 'var(--lumen-border)' }}>
        {/* 1. Theme toggle */}
        <button
          onClick={onToggleTheme}
          title={collapsed ? (theme === 'dark' ? 'Modo dia' : 'Modo noche') : undefined}
          className={`nav-item w-full flex items-center rounded-xl text-[13px] font-medium transition-all duration-150
            ${collapsed ? 'px-0 justify-center py-2.5' : 'px-3 py-2.5 gap-3'}`}
          style={{ color: 'var(--lumen-text-secondary)' }}
        >
          {theme === 'dark' ? <Sun size={17} strokeWidth={1.5} /> : <Moon size={17} strokeWidth={1.5} />}
          {!collapsed && <span>{theme === 'dark' ? 'Modo dia' : 'Modo noche'}</span>}
        </button>

        {/* 2. Collapse */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir' : 'Colapsar'}
          className={`nav-item w-full flex items-center rounded-xl text-[13px] font-medium transition-all duration-150
            ${collapsed ? 'px-0 justify-center py-2.5' : 'px-3 py-2.5 gap-3'}`}
          style={{ color: 'var(--lumen-text-muted)' }}
        >
          {collapsed ? <PanelLeftOpen size={17} strokeWidth={1.5} /> : <PanelLeftClose size={17} strokeWidth={1.5} />}
          {!collapsed && <span>Colapsar</span>}
        </button>

        {/* 3. Settings */}
        <NavBtn
          id="settings"
          label="Configuracion"
          icon={Settings}
          active={activeModule === 'settings'}
          collapsed={collapsed}
          onClick={() => onNavigate('settings')}
          muted
        />
      </div>
    </aside>
  );
}
