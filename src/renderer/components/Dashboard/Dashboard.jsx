import React, { useState, useEffect } from 'react';
import { Library, Users, BookOpen, StickyNote, Globe, Shield, Terminal } from 'lucide-react';
import LumenLogo from '../LumenLogo';

function StatCard({ icon: Icon, value, label, loading }) {
  return (
    <div className="bento-card flex items-center gap-4">
      <div style={{
        width: 34, height: 34, borderRadius: 3, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--lumen-border)',
      }}>
        <Icon size={15} style={{ color: 'var(--lumen-text-secondary)' }} />
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

function QuickAction({ icon: Icon, title, desc, onClick }) {
  return (
    <button onClick={onClick} className="bento-card interactive w-full text-left">
      <div style={{
        width: 30, height: 30, borderRadius: 3, marginBottom: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--lumen-border)',
      }}>
        <Icon size={14} style={{ color: 'var(--lumen-text-secondary)' }} />
      </div>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--lumen-text)', marginBottom: 4, letterSpacing: '0.01em' }}>{title}</p>
      <p style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--lumen-text-muted)' }}>{desc}</p>
    </button>
  );
}

export default function Dashboard({ navigateTo, userName = 'Lucila' }) {
  const [stats, setStats] = useState({ policies: 0, contacts: 0, notes: 0 });
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState('');

  useEffect(() => {
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
      <div className="bento-card mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--lumen-text-muted)', marginBottom: 6 }}>
              {greet()}
            </p>
            <h1 style={{ fontSize: 26, fontWeight: 300, letterSpacing: '-0.02em', color: 'var(--lumen-text)', marginBottom: 6 }}>
              Bienvenida, <span style={{ fontWeight: 600, color: '#ffffff' }}>{userName}</span>
            </h1>
            <p style={{ fontSize: 12, color: 'var(--lumen-text-muted)' }}>
              LUMEN esta listo. Potenciando tu conocimiento para alcanzar la excelencia.
            </p>
          </div>
          <div style={{ opacity: 0.06 }}>
            <LumenLogo size={80} />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="bento-grid bento-grid-3 mb-4">
        <StatCard icon={BookOpen}   value={stats.policies} label="Politicas"  loading={loading} />
        <StatCard icon={Users}      value={stats.contacts} label="Contactos"  loading={loading} />
        <StatCard icon={StickyNote} value={stats.notes}    label="Notas"      loading={loading} />
      </div>

      {/* Quick actions */}
      <div className="bento-grid bento-grid-2 mb-4">
        <QuickAction
          icon={Library}
          title="Biblioteca"
          desc="Base de conocimiento — politicas y documentos internos"
          onClick={() => navigateTo('knowledge')}
        />
        <QuickAction
          icon={Users}
          title="Directorio"
          desc="Contactos estrategicos: aliados, tecnicos y proveedores"
          onClick={() => navigateTo('contacts')}
        />
      </div>

      {/* System info */}
      <div className="bento-card bento-span-full">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={13} style={{ color: 'var(--lumen-text-secondary)' }} />
          <h3 style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--lumen-text-secondary)' }}>Sistema LUMEN</h3>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'monospace', color: 'var(--lumen-text-muted)', letterSpacing: '0.04em' }}>
            v{version || '0.5.11'}
          </span>
        </div>

        <div className="bento-grid bento-grid-3 !gap-3">
          {[
            { icon: Library, label: 'Biblioteca',     text: 'Base de conocimiento inamovible. El sistema nunca inventa datos.' },
            { icon: Globe,   label: 'Modo Expandido', text: 'Google Search complementario para consultas externas.' },
          ].map(({ icon: Ic, label, text }) => (
            <div key={label} style={{
              padding: '12px 14px', borderRadius: 3,
              borderLeft: '1px solid var(--lumen-border-light)',
              paddingLeft: 14,
            }}>
              <div className="flex items-center gap-2 mb-2">
                <Ic size={11} style={{ color: 'var(--lumen-text-muted)' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--lumen-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
              </div>
              <p style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--lumen-text-muted)' }}>{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* System keywords */}
      <div className="bento-card bento-span-full mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Terminal size={13} style={{ color: 'var(--lumen-accent-secondary)' }} />
          <h3 style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--lumen-text-secondary)' }}>
            Palabras clave en chat con LU
          </h3>
        </div>

        <div className="bento-grid bento-grid-2 !gap-3">
          {[
            {
              keyword: '/admin',
              label: 'Modo administración',
              desc: 'Permite a Lu modificar el árbol de decisiones AC3 (crear, actualizar o eliminar ramas). Lu propone el cambio completo y tú decides si aplicar o descartar.',
              example: '/admin crea una rama Reembolsos con un paso que pregunte si tiene factura',
            },
            {
              keyword: 'AJUSTE',
              label: 'Edición en lenguaje natural',
              desc: 'Escribe AJUSTE en cualquier parte del mensaje para que Lu lo interprete como instrucción de modificación del árbol AC3, sin necesidad de prefijo de comando.',
              example: 'AJUSTE quiero que la rama Tarjetas tenga un paso que verifique si el acceso está activo',
            },
          ].map(({ keyword, label, desc, example }) => (
            <div key={keyword} style={{
              padding: '12px 14px', borderRadius: 3,
              borderLeft: '2px solid var(--lumen-accent-secondary)',
            }}>
              <div className="flex items-center gap-2 mb-2">
                <code style={{
                  fontFamily: 'monospace', fontSize: 11, fontWeight: 700,
                  color: 'var(--lumen-accent-secondary)',
                  background: 'rgba(126,63,242,0.10)',
                  padding: '2px 6px', borderRadius: 3,
                }}>
                  {keyword}
                </code>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--lumen-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {label}
                </span>
              </div>
              <p style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--lumen-text-muted)', marginBottom: 6 }}>{desc}</p>
              <code style={{
                display: 'block',
                fontFamily: 'monospace', fontSize: 10,
                color: 'var(--lumen-text-secondary)',
                background: 'rgba(0,0,0,0.3)',
                padding: '6px 8px', borderRadius: 3,
                lineHeight: 1.5, wordBreak: 'break-word',
              }}>
                {example}
              </code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
