import React from 'react';
import {
  LayoutDashboard, FlaskConical, Library,
  Users, StickyNote, CalendarDays, ShieldCheck,
  GitBranch, Settings, Sun, Moon, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import LumenLogo from './LumenLogo';

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
      className={`nav-item w-full flex items-center transition-all duration-100
        ${active ? 'active' : ''}
        ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2 gap-3'}`}
      style={{
        borderRadius: 5,
        color: active
          ? 'var(--lumen-accent)'
          : muted
          ? 'var(--lumen-text-muted)'
          : 'var(--lumen-text-secondary)',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        letterSpacing: active ? '0.01em' : '0',
      }}
    >
      <Icon size={16} strokeWidth={active ? 2 : 1.5} style={{ flexShrink: 0 }} />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && active && (
        <span style={{
          marginLeft: 'auto',
          width: 4, height: 4, borderRadius: '50%',
          background: 'var(--lumen-accent)',
          boxShadow: '0 0 6px rgba(126,63,242,0.8)',
          flexShrink: 0,
        }} />
      )}
    </button>
  );
}

export default function Sidebar({ activeModule, onNavigate, collapsed, onToggleCollapse, theme, onToggleTheme }) {
  return (
    <aside
      className={`glass-sidebar flex flex-col shrink-0 transition-all duration-300 ${collapsed ? 'w-[52px]' : 'w-[200px]'}`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center px-0 py-5' : 'px-4 py-5'}`}>
        <LumenLogo size={collapsed ? 22 : 24} />
        {!collapsed && (
          <div>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.14em',
              color: 'var(--lumen-accent)', textTransform: 'uppercase',
            }}>
              LUMEN
            </p>
            <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', marginTop: 1, letterSpacing: '0.04em' }}>
              Motor de Conocimiento
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--lumen-border)', margin: '0 12px' }} />

      {/* Primary nav */}
      <nav className="flex-1 py-3 overflow-y-auto" style={{ padding: '10px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV_ITEMS.map((item) => (
            <NavBtn
              key={item.id}
              {...item}
              active={activeModule === item.id}
              collapsed={collapsed}
              onClick={() => onNavigate(item.id)}
            />
          ))}
        </div>
      </nav>

      {/* Bottom controls */}
      <div style={{ borderTop: '1px solid var(--lumen-border)', padding: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {/* Theme */}
          <button
            onClick={onToggleTheme}
            title={collapsed ? (theme === 'dark' ? 'Modo día' : 'Modo noche') : undefined}
            className={`nav-item w-full flex items-center transition-all duration-100
              ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2 gap-3'}`}
            style={{ borderRadius: 5, color: 'var(--lumen-text-secondary)', fontSize: 12 }}
          >
            {theme === 'dark'
              ? <Sun size={15} strokeWidth={1.5} />
              : <Moon size={15} strokeWidth={1.5} />}
            {!collapsed && <span>{theme === 'dark' ? 'Modo día' : 'Modo noche'}</span>}
          </button>

          {/* Collapse */}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? 'Expandir' : 'Colapsar'}
            className={`nav-item w-full flex items-center transition-all duration-100
              ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2 gap-3'}`}
            style={{ borderRadius: 5, color: 'var(--lumen-text-muted)', fontSize: 12 }}
          >
            {collapsed
              ? <PanelLeftOpen size={15} strokeWidth={1.5} />
              : <PanelLeftClose size={15} strokeWidth={1.5} />}
            {!collapsed && <span>Colapsar</span>}
          </button>

          {/* Settings */}
          <NavBtn
            id="settings"
            label="Configuración"
            icon={Settings}
            active={activeModule === 'settings'}
            collapsed={collapsed}
            onClick={() => onNavigate('settings')}
            muted
          />
        </div>
      </div>
    </aside>
  );
}
