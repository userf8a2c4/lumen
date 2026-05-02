import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical, Library, StickyNote, GitBranch,
  Keyboard, Search, Terminal, Clock, Briefcase,
  BookOpen, Users, CheckCircle2, Utensils, RefreshCw,
  Star, StarOff, Pin, Settings as SettingsIcon,
} from 'lucide-react';
import LumenLogo from '../LumenLogo';

const PROMO_FAV_KEY = 'lumen_promo_favorites';

function PromosWidget({ onNavigateSettings }) {
  const [promos, setPromos]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [favs, setFavs]         = useState(() => {
    try { return JSON.parse(localStorage.getItem(PROMO_FAV_KEY) || '[]'); } catch { return []; }
  });

  const favKey = (p) => `${p.name}||${p.promo}`;

  const isFav = (p) => favs.includes(favKey(p));

  const toggleFav = (p) => {
    const k = favKey(p);
    setFavs((prev) => {
      const next = prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k];
      try { localStorage.setItem(PROMO_FAV_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await window.lumen.promos.fetch();
      setPromos(data || []);
    } catch (e) {
      setError(e?.message || 'Error al obtener promociones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const pinned = promos.filter((p) => isFav(p));
  const others = promos.filter((p) => !isFav(p));
  const ordered = [...pinned, ...others];

  return (
    <div className="bento-card bento-span-full">
      <div className="flex items-center gap-2 mb-3">
        <Utensils size={13} style={{ color: '#f59e0b' }} />
        <h3 style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--lumen-text-secondary)' }}>
          Promociones cerca · Toluca de Lerdo
        </h3>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {!loading && (
            <button onClick={load} title="Actualizar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: 'var(--lumen-text-muted)', display: 'flex' }}>
              <RefreshCw size={11} />
            </button>
          )}
          <button onClick={() => onNavigateSettings?.('settings')} title="Configuración" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: 'var(--lumen-text-muted)', display: 'flex' }}>
            <SettingsIcon size={11} />
          </button>
        </span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 0', color: 'var(--lumen-text-muted)', fontSize: 11 }}>
          <RefreshCw size={13} className="animate-spin" style={{ color: '#f59e0b' }} />
          Buscando promociones del día...
        </div>
      ) : error ? (
        <div style={{ padding: '10px 14px', borderRadius: 4, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', fontSize: 11 }}>
          {error}
        </div>
      ) : ordered.length === 0 ? (
        <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', lineHeight: 1.55 }}>
          No se encontraron promociones activas hoy. Intenta más tarde.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--lumen-border)' }}>
                <th style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--lumen-text-muted)', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', width: 32 }}></th>
                <th style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--lumen-text-muted)', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Negocio</th>
                <th style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--lumen-text-muted)', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tipo</th>
                <th style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--lumen-text-muted)', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Promoción</th>
                <th style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--lumen-text-muted)', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((p, i) => {
                const fav = isFav(p);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--lumen-border)', background: fav ? 'rgba(245,158,11,0.04)' : 'transparent', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => { if (!fav) e.currentTarget.style.background = 'var(--lumen-card-hover)'; }}
                    onMouseLeave={(e) => { if (!fav) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '7px 8px', verticalAlign: 'top' }}>
                      <button onClick={() => toggleFav(p)} title={fav ? 'Quitar favorito' : 'Fijar favorito'}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: fav ? '#f59e0b' : 'var(--lumen-text-muted)', display: 'flex' }}>
                        {fav ? <Star size={11} fill="#f59e0b" /> : <Star size={11} />}
                      </button>
                    </td>
                    <td style={{ padding: '7px 8px', verticalAlign: 'top', fontWeight: 600, color: 'var(--lumen-text)' }}>{p.name}</td>
                    <td style={{ padding: '7px 8px', verticalAlign: 'top', color: 'var(--lumen-text-secondary)' }}>{p.category}</td>
                    <td style={{ padding: '7px 8px', verticalAlign: 'top', color: '#f59e0b', fontWeight: 500 }}>{p.promo}</td>
                    <td style={{ padding: '7px 8px', verticalAlign: 'top', color: 'var(--lumen-text-muted)', maxWidth: 220 }}>{p.details || p.address || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {pinned.length > 0 && (
            <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', marginTop: 8, letterSpacing: '0.04em' }}>
              ★ {pinned.length} favorito{pinned.length !== 1 ? 's' : ''} fijado{pinned.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, value, label, loading, onClick, accent }) {
  const color = accent || 'var(--lumen-text-secondary)';
  return (
    <button
      onClick={onClick}
      className="bento-card flex items-center gap-4 w-full text-left"
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'background 0.15s' }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: 3, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${accent ? accent + '44' : 'var(--lumen-border)'}`,
        background: accent ? accent + '0d' : 'transparent',
      }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div className="bento-stat">
        {loading
          ? <span className="stat-value" style={{ fontSize: '20px', color: 'var(--lumen-text-muted)' }}>—</span>
          : <span className="stat-value" style={{ fontSize: '20px', color: accent || undefined }}>{value}</span>}
        <span className="stat-label">{label}</span>
      </div>
    </button>
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
  const [stats, setStats]   = useState({ policies: 0, contacts: 0, notes: 0 });
  const [turn, setTurn]     = useState(null);
  const [todayCases, setTodayCases] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPromos, setShowPromos] = useState(true);

  useEffect(() => {
    Promise.all([
      window.lumen.policies.getAll(),
      window.lumen.contacts.getAll(),
      window.lumen.notes.getAll(),
    ]).then(([policies, contacts, notes]) => {
      setStats({ policies: policies.length, contacts: contacts.length, notes: notes.length });
    }).catch(() => {}).finally(() => setLoading(false));

    // Turno activo + casos del día
    window.lumen.turns.getActive().then((t) => setTurn(t || null)).catch(() => {});
    const today = new Date().toISOString().slice(0, 10);
    window.lumen.cases.search({ dateFrom: today, dateTo: today })
      .then((r) => setTodayCases((r || []).length))
      .catch(() => {});

    // Promos setting
    window.lumen.settings.getShowPromos().then((v) => setShowPromos(v !== false)).catch(() => {});
  }, []);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 19) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const turnActive = turn && !turn.ended_at;

  return (
    <div className="max-w-4xl mx-auto">

      {/* Hero */}
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
              LUMEN listo. {turnActive ? `Turno #${turn.turn_number} activo · ${todayCases} caso${todayCases !== 1 ? 's' : ''} hoy.` : 'Sin turno activo.'}
            </p>
          </div>
          <div style={{ opacity: 0.07 }}>
            <LumenLogo size={80} />
          </div>
        </div>
      </div>

      {/* Turno + casos stats */}
      <div className="bento-grid bento-grid-3 mb-4">
        <StatCard
          icon={Clock}
          value={turnActive ? `#${turn.turn_number}` : '—'}
          label={turnActive ? 'Turno activo' : 'Sin turno'}
          loading={false}
          accent={turnActive ? '#10b981' : undefined}
          onClick={() => navigateTo('ac3')}
        />
        <StatCard
          icon={Briefcase}
          value={todayCases}
          label="Casos hoy"
          loading={loading}
          accent={todayCases > 0 ? 'var(--lumen-accent)' : undefined}
          onClick={() => navigateTo('ac3')}
        />
        <StatCard
          icon={CheckCircle2}
          value={turn?.cases_count ?? '—'}
          label="Casos en turno"
          loading={false}
          onClick={() => navigateTo('ac3')}
        />
      </div>

      {/* Knowledge stats */}
      <div className="bento-grid bento-grid-3 mb-4">
        <StatCard icon={BookOpen}   value={stats.policies} label="Políticas"  loading={loading} onClick={() => navigateTo('knowledge')} />
        <StatCard icon={Users}      value={stats.contacts} label="Contactos"  loading={loading} onClick={() => navigateTo('contacts')} />
        <StatCard icon={StickyNote} value={stats.notes}    label="Notas"      loading={loading} onClick={() => navigateTo('notes')} />
      </div>

      {/* Quick actions */}
      <div className="bento-grid bento-grid-3 mb-4">
        <QuickAction
          icon={Briefcase}
          title="Decisiones"
          desc="Casos de atención — abre turno, registra clientes y usa el árbol de decisiones."
          onClick={() => navigateTo('ac3')}
        />
        <QuickAction
          icon={Library}
          title="Biblioteca"
          desc="Base de conocimiento — políticas y documentos internos."
          onClick={() => navigateTo('knowledge')}
        />
        <QuickAction
          icon={FlaskConical}
          title="Laboratorio"
          desc="Análisis de casos con IA multimodal — texto, imagen, PDF."
          onClick={() => navigateTo('assistant')}
        />
      </div>

      {/* Keyboard shortcuts */}
      <div className="bento-card bento-span-full mt-0 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Keyboard size={13} style={{ color: 'var(--lumen-text-secondary)' }} />
          <h3 style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--lumen-text-secondary)' }}>
            Atajos de teclado
          </h3>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'monospace', color: 'var(--lumen-text-muted)' }}>globales</span>
        </div>
        <div className="bento-grid bento-grid-2 !gap-3">
          <div style={{ padding: '12px 14px', borderRadius: 4, border: '1px solid var(--lumen-border)', background: 'rgba(16,185,129,0.03)', borderLeft: '3px solid rgba(16,185,129,0.5)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Search size={12} style={{ color: '#10b981' }} />
              <div className="flex items-center gap-1">
                {['Ctrl', 'Space'].map((k) => (
                  <kbd key={k} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, fontFamily: 'monospace', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981', fontWeight: 700 }}>{k}</kbd>
                ))}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--lumen-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: 'auto' }}>Búsqueda rápida</span>
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--lumen-text-muted)' }}>
              Busca notas, políticas, contactos y speeches desde cualquier pantalla.
            </p>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 4, border: '1px solid var(--lumen-border)', background: 'rgba(126,63,242,0.03)', borderLeft: '3px solid rgba(126,63,242,0.3)' }}>
            <div className="flex items-center gap-2 mb-2">
              <Keyboard size={12} style={{ color: 'var(--lumen-accent)' }} />
              <kbd style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, fontFamily: 'monospace', background: 'rgba(126,63,242,0.12)', border: '1px solid rgba(126,63,242,0.25)', color: 'var(--lumen-accent)', fontWeight: 700 }}>Esc</kbd>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--lumen-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: 'auto' }}>Cerrar paneles</span>
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--lumen-text-muted)' }}>
              Cierra modales, búsqueda rápida y paneles sin el mouse.
            </p>
          </div>
        </div>
      </div>

      {/* Promotions widget */}
      {showPromos && <PromosWidget onNavigateSettings={navigateTo} />}

      {/* LU keywords */}
      <div className="bento-card bento-span-full">
        <div className="flex items-center gap-2 mb-4">
          <Terminal size={13} style={{ color: 'var(--lumen-text-secondary)' }} />
          <h3 style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--lumen-text-secondary)' }}>
            Palabras clave en chat con LU
          </h3>
          <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'monospace', color: 'var(--lumen-text-muted)' }}>sistema base</span>
        </div>
        <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', marginBottom: 12, lineHeight: 1.55 }}>
          Empieza tu mensaje a LU con una de estas palabras clave para activar modos especiales.
        </p>
        <div className="bento-grid bento-grid-2 !gap-3">
          <div style={{ padding: '12px 14px', borderRadius: 4, border: '1px solid var(--lumen-border)', background: 'rgba(126,63,242,0.04)', borderLeft: '3px solid var(--lumen-accent)' }}>
            <div className="flex items-center gap-2 mb-2">
              <GitBranch size={12} style={{ color: 'var(--lumen-accent)' }} />
              <code style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: 'var(--lumen-accent)', background: 'rgba(126,63,242,0.12)', padding: '2px 6px', borderRadius: 3 }}>
                /RAMAS
              </code>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--lumen-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: 'auto' }}>
                Editor IA del árbol
              </span>
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--lumen-text-muted)', marginBottom: 6 }}>
              Modifica el árbol de decisiones con lenguaje natural. LU propone y tú apruebas.
            </p>
            <p style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--lumen-text-muted)', fontStyle: 'italic' }}>
              ej: <span style={{ color: 'var(--lumen-text-secondary)' }}>/RAMAS crea una rama "Reembolsos" con un paso que pregunta si tiene factura</span>
            </p>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 4, border: '1px solid var(--lumen-border)', background: 'rgba(96,165,250,0.04)', borderLeft: '3px solid #60a5fa' }}>
            <div className="flex items-center gap-2 mb-2">
              <Terminal size={12} style={{ color: '#60a5fa' }} />
              <code style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#60a5fa', background: 'rgba(96,165,250,0.12)', padding: '2px 6px', borderRadius: 3 }}>
                /admin
              </code>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--lumen-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginLeft: 'auto' }}>
                Modo administrador
              </span>
            </div>
            <p style={{ fontSize: 11, lineHeight: 1.55, color: 'var(--lumen-text-muted)', marginBottom: 6 }}>
              Accede a configuraciones avanzadas del sistema, estadísticas internas y herramientas de gestión.
            </p>
            <p style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--lumen-text-muted)', fontStyle: 'italic' }}>
              ej: <span style={{ color: 'var(--lumen-text-secondary)' }}>/admin muéstrame el resumen de casos de esta semana</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
