import React from 'react';
import {
  LayoutDashboard, Library,
  Users, StickyNote, Settings,
  PanelLeftClose, PanelLeftOpen, Cpu, FolderOpen,
} from 'lucide-react';
import LumenLogo from './LumenLogo';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'ac3',          label: 'Decisiones',   icon: Cpu },
  { id: 'expedientes',  label: 'Expedientes',  icon: FolderOpen },
  { id: 'knowledge',    label: 'Biblioteca',   icon: Library },
  { id: 'notes',        label: 'Notas',        icon: StickyNote },
];

function NavBtn({ label, icon: Icon, active, collapsed, onClick, muted }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`nav-item w-full flex items-center transition-all duration-100
        ${active ? 'active' : ''}
        ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2 gap-3'}`}
      style={{
        borderRadius: 3,
        color: active
          ? 'rgba(255,255,255,0.95)'
          : muted
          ? 'var(--lumen-text-muted)'
          : 'var(--lumen-text-secondary)',
        fontSize: 12,
        fontWeight: active ? 500 : 400,
        letterSpacing: '0.01em',
      }}
    >
      <Icon size={15} strokeWidth={active ? 1.75 : 1.5} style={{ flexShrink: 0 }} />
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}

export default function Sidebar({ activeModule, onNavigate, collapsed, onToggleCollapse, sectionLabels }) {
  // Merge custom labels over defaults
  const label = (id, fallback) => (sectionLabels && sectionLabels[id]) ? sectionLabels[id] : fallback;

  return (
    <aside
      className={`glass-sidebar flex flex-col shrink-0 transition-all duration-300 ${collapsed ? 'w-[52px]' : 'w-[190px]'}`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center px-0 py-5' : 'px-4 py-5'}`}>
        <LumenLogo size={22} />
        {!collapsed && (
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.88)', textTransform: 'uppercase' }}>
            LUMEN
          </p>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--lumen-border)', margin: '0 12px' }} />

      {/* Primary nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => (
          <NavBtn
            key={item.id}
            {...item}
            label={label(item.id, item.label)}
            active={activeModule === item.id}
            collapsed={collapsed}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      {/* Bottom controls */}
      <div style={{ borderTop: '1px solid var(--lumen-border)', padding: '8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Collapse toggle */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir' : 'Colapsar'}
          className={`nav-item w-full flex items-center transition-all duration-100
            ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2 gap-3'}`}
          style={{ borderRadius: 3, color: 'var(--lumen-text-muted)', fontSize: 12 }}
        >
          {collapsed
            ? <PanelLeftOpen size={14} strokeWidth={1.5} />
            : <PanelLeftClose size={14} strokeWidth={1.5} />}
          {!collapsed && <span style={{ opacity: 0.5 }}>Colapsar</span>}
        </button>

        {/* Settings */}
        <NavBtn
          label={label('settings', 'Configuración')}
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
