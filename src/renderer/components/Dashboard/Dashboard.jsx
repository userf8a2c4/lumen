import React, { useState, useEffect } from 'react';
import { FlaskConical, Library, Search, BookOpen, Users, StickyNote, Zap, Globe, Shield, RefreshCw } from 'lucide-react';
import LumenLogo from '../LumenLogo';

function StatCard({ icon: Icon, color, value, label, loading }) {
  return (
    <div className="bento-card flex items-center gap-4">
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: `${color}14` }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div className="bento-stat">
        {loading
          ? <span className="stat-value" style={{ fontSize: '22px', color: 'var(--lumen-text-muted)' }}>—</span>
          : <span className="stat-value" style={{ fontSize: '22px' }}>{value}</span>}
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, desc, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bento-card interactive w-full text-left"
      style={{ cursor: 'pointer' }}
    >
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
        style={{ background: `${color}12` }}>
        <Icon size={19} style={{ color }} />
      </div>
      <p className="text-[13px] font-semibold mb-1" style={{ color: 'var(--lumen-text)' }}>{title}</p>
      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--lumen-text-muted)' }}>{desc}</p>
    </button>
  );
}

export default function Dashboard({ navigateTo, userName = 'Lucila' }) {
  const [stats, setStats] = useState({ policies: 0, contacts: 0, notes: 0 });
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    Promise.all([
      window.lumen.policies.getAll(),
      window.lumen.contacts.getAll(),
      window.lumen.notes.getAll(),
      window.lumen.app.getVersion(),
    ]).then(([policies, contacts, notes, v]) => {
      setStats({ policies: policies.length, contacts: contacts.length, notes: notes.length });
      setVersion(v);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos dias';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero greeting */}
      <div className="bento-card mb-4 overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(126,63,242,0.06) 0%, transparent 60%)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--lumen-text-muted)' }}>
              {greet()}
            </p>
            <h1 className="text-[28px] font-light tracking-tight mb-1" style={{ color: 'var(--lumen-text)', letterSpacing: '-0.02em' }}>
              Bienvenida, <span style={{ color: '#7E3FF2', fontWeight: 600 }}>{userName}</span>
            </h1>
            <p className="text-[12px]" style={{ color: 'var(--lumen-text-muted)' }}>
              LUMEN esta listo. Tu base de conocimiento es la unica fuente de verdad.
            </p>
          </div>
          <div style={{ opacity: 0.07 }}>
            <LumenLogo size={88} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="bento-grid bento-grid-3 mb-4">
        <StatCard icon={BookOpen} color="#10b981" value={stats.policies} label="Politicas" loading={loading} />
        <StatCard icon={Users}    color="#3b82f6" value={stats.contacts} label="Contactos" loading={loading} />
        <StatCard icon={StickyNote} color="#ec4899" value={stats.notes} label="Notas"    loading={loading} />
      </div>

      {/* Quick actions */}
      <div className="bento-grid bento-grid-3 mb-4">
        <QuickAction
          icon={FlaskConical}
          color="#7E3FF2"
          title="Laboratorio"
          desc="Analisis de casos con IA multimodal (texto, imagen, PDF)"
          onClick={() => navigateTo('assistant')}
        />
        <QuickAction
          icon={Library}
          color="#10b981"
          title="Biblioteca"
          desc="Base de conocimiento inamovible — politicas y documentos internos"
          onClick={() => navigateTo('knowledge')}
        />
        <QuickAction
          icon={Search}
          color="#f59e0b"
          title="Busqueda Rapida"
          desc="Encuentra cualquier politica o contacto al instante"
          onClick={() => navigateTo('search')}
        />
      </div>

      {/* System info */}
      <div className="bento-card bento-span-full">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={15} style={{ color: '#7E3FF2' }} />
          <h3 className="text-[13px] font-semibold" style={{ color: 'var(--lumen-text)' }}>Sistema LUMEN</h3>
          <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold"
            style={{ background: 'rgba(126,63,242,0.08)', color: '#7E3FF2' }}>
            v{version || '0.5.3'}
          </span>
        </div>

        <div className="bento-grid bento-grid-3 !gap-3">
          <div className="rounded-2xl p-3.5" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={13} style={{ color: '#7E3FF2' }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#7E3FF2' }}>Laboratorio</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--lumen-text-muted)' }}>
              Centro de analisis multimodal. Soporta texto, capturas de pantalla e imagenes para deteccion visual de fallos de QA con Gemini Vision.
            </p>
          </div>
          <div className="rounded-2xl p-3.5" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Library size={13} style={{ color: '#10b981' }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#10b981' }}>Biblioteca</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--lumen-text-muted)' }}>
              Tu fuente de verdad inamovible. Politicas, protocolos y documentos internos indexados. El sistema no inventa datos que no esten aqui.
            </p>
          </div>
          <div className="rounded-2xl p-3.5" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Globe size={13} style={{ color: '#3b82f6' }} />
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: '#3b82f6' }}>Modo Expandido</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--lumen-text-muted)' }}>
              Activa Google Search en el Laboratorio para complementar con datos externos en tiempo real — sin contradecir la Biblioteca.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
