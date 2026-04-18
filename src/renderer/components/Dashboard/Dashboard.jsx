import React, { useState, useEffect } from 'react';
import { FlaskConical, Library, Users, BookOpen, StickyNote, Zap, Globe, Shield } from 'lucide-react';
import LumenLogo from '../LumenLogo';

function StatCard({ icon: Icon, color, value, label, loading }) {
  return (
    <div className="bento-card flex items-center gap-4">
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}14`, border: `1px solid ${color}22`,
      }}>
        <Icon size={17} style={{ color }} />
      </div>
      <div className="bento-stat">
        {loading
          ? <span className="stat-value" style={{ fontSize: '20px', color: 'var(--lumen-text-muted)' }}>—</span>
          : <span className="stat-value" style={{ fontSize: '20px' }}>{value}</span>}
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, desc, color, onClick }) {
  return (
    <button onClick={onClick} className="bento-card interactive w-full text-left">
      <div style={{
        width: 32, height: 32, borderRadius: 7, marginBottom: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${color}12`, border: `1px solid ${color}20`,
      }}>
        <Icon size={16} style={{ color }} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: 4, letterSpacing: '0.01em' }}>{title}</p>
      <p style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--lumen-text-muted)' }}>{desc}</p>
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
              LUMEN esta listo. Potenciando tu conocimiento para alcanzar la excelencia.
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
          icon={Users}
          color="#3b82f6"
          title="Directorio"
          desc="Contactos estrategicos: aliados, tecnicos y proveedores clave"
          onClick={() => navigateTo('contacts')}
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
          {[
            { icon: Zap,     color: '#7E3FF2', label: 'Laboratorio',   text: 'Análisis multimodal con Gemini Vision. Texto, imágenes y PDFs para detección de fallos de QA.' },
            { icon: Library, color: '#10b981', label: 'Biblioteca',    text: 'Base de conocimiento inamovible. El sistema nunca inventa datos que no estén aquí.' },
            { icon: Globe,   color: '#3b82f6', label: 'Modo Expandido',text: 'Google Search complementario para consultas externas. Nunca contradice la Biblioteca.' },
          ].map(({ icon: Ic, color, label, text }) => (
            <div key={label} style={{
              padding: '12px 14px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: `2px solid ${color}60`,
            }}>
              <div className="flex items-center gap-2 mb-2">
                <Ic size={12} style={{ color }} />
                <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
              </div>
              <p style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--lumen-text-muted)' }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
