import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical, Library, StickyNote, GitBranch,
  Keyboard, Search, Terminal, Clock, Briefcase,
  BookOpen, Users, CheckCircle2, Utensils, RefreshCw,
  Star, MapPin, Settings as SettingsIcon, Sparkles, X,
  Cpu, FolderOpen, MessageSquare, Layers, AlignLeft,
  ChevronRight, BookMarked, HelpCircle, Info,
} from 'lucide-react';
import LumenLogo from '../LumenLogo';

const PROMO_FAV_KEY = 'lumen_promo_favorites';
const LOC_COLORS = { home: '#10b981', work: '#60a5fa', other: '#f59e0b' };
const LOC_LABELS = { home: 'Casa', work: 'Trabajo', other: 'Otro' };

// ─── Changelog data ───────────────────────────────────────────────────────────

const CHANGELOG = [
  {
    version: '0.1.17',
    name: 'Chiquisaurias Edition',
    date: 'May 2026',
    accent: '#a78bfa',
    highlights: [
      { icon: FolderOpen,   text: 'Nuevo módulo Expedientes en el menú lateral — historial completo de cada caso con búsqueda y filtros.' },
      { icon: GitBranch,    text: 'Detalle de expediente: ruta de decisión, recursos usados, notas vinculadas y transcript con LU.' },
      { icon: Sparkles,     text: 'Dashboard: tarjeta Novedades con changelog interactivo por versión.' },
      { icon: BookMarked,   text: 'Dashboard: Manual de usuario completo con 8 secciones navegables paso a paso.' },
    ],
  },
  {
    version: '0.1.16',
    name: 'Case Tracking Edition',
    date: 'May 2026',
    accent: '#10b981',
    highlights: [
      { icon: Layers,       text: 'Rastreo automático de recursos por caso: plantillas, emails, speeches y políticas consultadas.' },
      { icon: GitBranch,    text: 'Ruta de decisión completa: cada paso del árbol con la opción elegida queda registrado.' },
      { icon: StickyNote,   text: 'Notas vinculadas automáticamente al caso activo mediante FK en la base de datos.' },
      { icon: FolderOpen,   text: 'Nuevo módulo Expedientes en el menú: historial completo de todos los casos cerrados.' },
      { icon: Search,       text: 'Búsqueda y filtros por fecha (hoy, 7 días, 30 días) en el historial de casos.' },
    ],
  },
  {
    version: '0.1.15',
    name: 'Chiquisaurias Edition',
    date: 'Abr 2026',
    accent: '#f59e0b',
    highlights: [
      { icon: RefreshCw,    text: 'Corrección crítica del instalador: descarga y actualización automática ahora funciona.' },
      { icon: MapPin,       text: 'Mapa de ubicaciones operativo: los tiles de OpenStreetMap cargan correctamente.' },
      { icon: FolderOpen,   text: 'Casos abiertos se pueden cerrar manualmente con el botón × en el listado.' },
      { icon: AlignLeft,    text: 'Botones de plantillas de texto igualados al estilo de plantillas de email.' },
      { icon: ChevronRight, text: 'Panel inferior colapsa hacia abajo con ChevronDown (visual correcto).' },
    ],
  },
  {
    version: '0.1.14',
    name: 'Multi-Location & Maps',
    date: 'Abr 2026',
    accent: '#60a5fa',
    highlights: [
      { icon: MapPin,       text: 'Widget de promociones con soporte para múltiples ubicaciones (Casa, Trabajo, Otro).' },
      { icon: MapPin,       text: 'Mapa interactivo OpenStreetMap + Leaflet con pin arrastrable y geocodificación inversa.' },
      { icon: Sparkles,     text: 'Tema claro mejorado con paleta de colores revisada.' },
      { icon: MessageSquare, text: 'Menú DockMenu ahora aparece debajo del botón (no encima).' },
    ],
  },
];

// ─── User manual data ─────────────────────────────────────────────────────────

const MANUAL_SECTIONS = [
  {
    id: 'inicio',
    icon: Clock,
    color: '#10b981',
    title: 'Empezar un turno',
    steps: [
      'Ve a **Decisiones** en el menú lateral.',
      'Presiona **Abrir turno** — esto crea un contenedor para todos los casos del día.',
      'Mientras el turno esté activo, puedes abrir casos de atención.',
      'Al terminar el día, cierra el turno desde el mismo módulo.',
    ],
  },
  {
    id: 'caso',
    icon: Briefcase,
    color: 'var(--lumen-accent)',
    title: 'Gestionar un caso',
    steps: [
      'Con turno activo, presiona **Nuevo caso** en Decisiones.',
      'Ingresa el nombre del cliente o su ID externo.',
      'Elige una **rama del árbol de decisiones** para guiar la atención.',
      'Navega los pasos — cada opción elegida queda registrada.',
      'Usa los paneles laterales: **Plantillas**, **Speeches** y **Emails** se copian con un clic.',
      'Cuando termines, presiona **Finalizar** — se guarda todo con resumen opcional.',
    ],
  },
  {
    id: 'rastreo',
    icon: Layers,
    color: '#60a5fa',
    title: 'Rastreo automático',
    steps: [
      'Todo lo que hagas **con un caso activo** queda registrado automáticamente.',
      '**Plantillas, speeches y emails** copiados → registrados como recursos del caso.',
      '**Políticas abiertas** desde Biblioteca → registradas como recurso del caso.',
      '**Ruta de decisión**: cada paso y opción del árbol queda trazado.',
      '**Notas** creadas con caso activo → vinculadas al caso automáticamente.',
      'Consulta todo desde **Expedientes** una vez cerrado el caso.',
    ],
  },
  {
    id: 'expedientes',
    icon: FolderOpen,
    color: '#a78bfa',
    title: 'Expedientes (historial)',
    steps: [
      'Accede desde el menú lateral → **Expedientes**.',
      'Busca por número de caso, nombre de cliente o palabras del resumen.',
      'Filtra por período: Hoy, 7 días, 30 días o Todos.',
      'Haz clic en cualquier caso para ver el detalle completo.',
      'El detalle muestra: resumen, ruta de decisión, recursos usados, notas vinculadas y conversación con LU.',
      'Exporta cualquier caso como archivo **.txt** desde el detalle.',
    ],
  },
  {
    id: 'biblioteca',
    icon: BookOpen,
    color: '#34d399',
    title: 'Biblioteca de políticas',
    steps: [
      'Ve a **Biblioteca** para gestionar políticas y documentos internos.',
      'Organiza por departamento para encontrarlas más rápido.',
      'Agrega ejemplos a cada política para ilustrar casos reales.',
      'LU puede buscar en la biblioteca automáticamente cuando se lo pides.',
      'Las políticas vistas con caso activo se registran en el expediente.',
    ],
  },
  {
    id: 'lu',
    icon: MessageSquare,
    color: '#f59e0b',
    title: 'Chat con LU (IA)',
    steps: [
      'LU es el asistente de IA de LUMEN — aparece como burbuja abajo a la derecha.',
      'Pregúntale sobre políticas, casos anteriores o pídele análisis.',
      'Usa **/RAMAS** para editar el árbol de decisiones con lenguaje natural.',
      'Usa **/admin** para acceder a herramientas de gestión avanzadas.',
      'Con un caso activo, LU tiene contexto del cliente y la situación.',
      'La conversación completa queda guardada en el expediente del caso.',
    ],
  },
  {
    id: 'busqueda',
    icon: Search,
    color: '#60a5fa',
    title: 'Búsqueda rápida',
    steps: [
      'Presiona **Ctrl + Espacio** desde cualquier pantalla.',
      'Busca simultáneamente en notas, políticas, contactos y speeches.',
      'Los resultados muestran el módulo de origen.',
      'Presiona Enter o haz clic para navegar directo.',
      'Cierra con **Esc** o haciendo clic fuera.',
    ],
  },
  {
    id: 'promos',
    icon: Utensils,
    color: '#f59e0b',
    title: 'Widget de promociones',
    steps: [
      'Configura tus ubicaciones en **Configuración → Ubicaciones**.',
      'Activa Casa, Trabajo u Otro y arrastra el pin en el mapa.',
      'El widget aparece en Dashboard cuando hay al menos una ubicación activa.',
      'Muestra negocios con promociones del día cerca de cada ubicación.',
      'Marca favoritos con ★ para verlos siempre al inicio de la lista.',
      'Usa el botón ↺ para actualizar las promociones en cualquier momento.',
    ],
  },
];

// ─── Changelog modal ──────────────────────────────────────────────────────────

function ChangelogModal({ onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: 560, maxHeight: '88vh', background: '#13131b',
        border: '1px solid var(--lumen-border)', borderRadius: 10,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 28px 90px rgba(0,0,0,0.70)',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={14} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--lumen-text)' }}>Novedades</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', display: 'flex', padding: 4 }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {CHANGELOG.map((rel) => (
            <div key={rel.version}>
              {/* Version header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'monospace', color: rel.accent }}>v{rel.version}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--lumen-text)' }}>{rel.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--lumen-text-muted)' }}>{rel.date}</span>
              </div>

              {/* Highlights */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rel.highlights.map((h, i) => {
                  const Icon = h.icon;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 10px', borderRadius: 6, background: `${rel.accent}08`, border: `1px solid ${rel.accent}18` }}>
                      <Icon size={12} style={{ color: rel.accent, flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 11, color: 'var(--lumen-text-secondary)', lineHeight: 1.55 }}>{h.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Manual modal ─────────────────────────────────────────────────────────────

function ManualModal({ onClose }) {
  const [activeSection, setActiveSection] = useState(MANUAL_SECTIONS[0].id);
  const section = MANUAL_SECTIONS.find((s) => s.id === activeSection);

  // Render bold markdown-like syntax in step text
  const renderStep = (text, i) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return (
      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <div style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
          background: `${section.color}18`, border: `1px solid ${section.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 800, fontFamily: 'monospace', color: section.color,
        }}>
          {i + 1}
        </div>
        <p style={{ fontSize: 12, color: 'var(--lumen-text)', lineHeight: 1.65, margin: 0, flex: 1 }}>
          {parts.map((part, j) =>
            j % 2 === 1
              ? <strong key={j} style={{ color: section.color, fontWeight: 700 }}>{part}</strong>
              : part
          )}
        </p>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: 720, maxHeight: '90vh', background: '#13131b',
        border: '1px solid var(--lumen-border)', borderRadius: 10,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 28px 90px rgba(0,0,0,0.70)',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookMarked size={14} style={{ color: 'var(--lumen-accent)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--lumen-text)' }}>Manual de usuario</span>
            <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: 'rgba(126,63,242,0.1)', border: '1px solid rgba(126,63,242,0.2)', color: 'var(--lumen-accent)' }}>
              LUMEN
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', display: 'flex', padding: 4 }}>
            <X size={14} />
          </button>
        </div>

        {/* Two-pane layout */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Sidebar nav */}
          <div style={{ width: 200, borderRight: '1px solid var(--lumen-border)', display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0, padding: '8px 0' }}>
            {MANUAL_SECTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === activeSection;
              return (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 14px', border: 'none', cursor: 'pointer',
                    textAlign: 'left', transition: 'background 0.1s',
                    background: isActive ? `${s.color}12` : 'transparent',
                    borderLeft: `2px solid ${isActive ? s.color : 'transparent'}`,
                  }}>
                  <Icon size={12} style={{ color: isActive ? s.color : 'var(--lumen-text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--lumen-text)' : 'var(--lumen-text-muted)' }}>
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px' }}>
            {section && (
              <>
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: `${section.color}12`, border: `1px solid ${section.color}35`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <section.icon size={16} style={{ color: section.color }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--lumen-text)', margin: 0, lineHeight: 1.2 }}>{section.title}</h3>
                    <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', margin: 0, marginTop: 2 }}>{section.steps.length} pasos</p>
                  </div>
                </div>

                {/* Steps */}
                <div>
                  {section.steps.map((step, i) => renderStep(step, i))}
                </div>

                {/* Navigation between sections */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--lumen-border)' }}>
                  {(() => {
                    const idx = MANUAL_SECTIONS.findIndex((s) => s.id === activeSection);
                    const prev = MANUAL_SECTIONS[idx - 1];
                    const next = MANUAL_SECTIONS[idx + 1];
                    return (
                      <>
                        {prev ? (
                          <button onClick={() => setActiveSection(prev.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--lumen-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 0' }}>
                            ← {prev.title}
                          </button>
                        ) : <div />}
                        {next ? (
                          <button onClick={() => setActiveSection(next.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: section.color, background: 'none', border: 'none', cursor: 'pointer', padding: '5px 0', fontWeight: 600 }}>
                            {next.title} →
                          </button>
                        ) : (
                          <div style={{ fontSize: 11, color: 'var(--lumen-text-muted)', padding: '5px 0' }}>Fin del manual ✓</div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Existing components (unchanged) ─────────────────────────────────────────

function PromoTable({ promos, loading, error, onRefresh }) {
  const [favs, setFavs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PROMO_FAV_KEY) || '[]'); } catch { return []; }
  });

  const favKey = (p) => `${p.name}||${p.promo}`;
  const isFav  = (p) => favs.includes(favKey(p));
  const toggleFav = (p) => {
    const k = favKey(p);
    setFavs((prev) => {
      const next = prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k];
      try { localStorage.setItem(PROMO_FAV_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 0', color: 'var(--lumen-text-muted)', fontSize: 11 }}>
      <RefreshCw size={12} className="animate-spin" style={{ color: '#f59e0b' }} />
      Buscando promociones del día…
    </div>
  );
  if (error) return (
    <div style={{ padding: '9px 12px', borderRadius: 4, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', fontSize: 11 }}>
      {error}
    </div>
  );
  if (!promos || promos.length === 0) return (
    <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', padding: '10px 0', lineHeight: 1.55 }}>
      No se encontraron promociones activas hoy. Intenta más tarde o configura una ubicación en Configuración.
    </p>
  );

  const pinned = promos.filter(isFav);
  const others = promos.filter((p) => !isFav(p));
  const ordered = [...pinned, ...others];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--lumen-border)' }}>
            {[['', 32], ['Negocio', null], ['Tipo', 90], ['Promoción', null], ['Detalles / Dirección', 200]].map(([h, w], i) => (
              <th key={i} style={{ padding: '5px 8px', textAlign: 'left', color: 'var(--lumen-text-muted)', fontWeight: 700, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', ...(w ? { width: w } : {}) }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ordered.map((p, i) => {
            const fav = isFav(p);
            return (
              <tr key={i}
                style={{ borderBottom: '1px solid var(--lumen-border)', background: fav ? 'rgba(245,158,11,0.05)' : 'transparent', transition: 'background 0.1s' }}
                onMouseEnter={(e) => { if (!fav) e.currentTarget.style.background = 'var(--lumen-card-hover)'; }}
                onMouseLeave={(e) => { if (!fav) e.currentTarget.style.background = fav ? 'rgba(245,158,11,0.05)' : 'transparent'; }}
              >
                <td style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                  <button onClick={() => toggleFav(p)} title={fav ? 'Quitar favorito' : 'Fijar favorito'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: fav ? '#f59e0b' : 'var(--lumen-text-muted)', display: 'flex' }}>
                    <Star size={11} fill={fav ? '#f59e0b' : 'none'} />
                  </button>
                </td>
                <td style={{ padding: '6px 8px', verticalAlign: 'top', fontWeight: 600, color: 'var(--lumen-text)' }}>{p.name}</td>
                <td style={{ padding: '6px 8px', verticalAlign: 'top', color: 'var(--lumen-text-secondary)' }}>{p.category}</td>
                <td style={{ padding: '6px 8px', verticalAlign: 'top', color: '#f59e0b', fontWeight: 500 }}>{p.promo}</td>
                <td style={{ padding: '6px 8px', verticalAlign: 'top', color: 'var(--lumen-text-muted)', maxWidth: 200 }}>{p.details || p.address || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {pinned.length > 0 && (
        <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', marginTop: 6 }}>
          ★ {pinned.length} favorito{pinned.length !== 1 ? 's' : ''} fijado{pinned.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}

function PromosWidget({ onNavigateSettings }) {
  const [locations, setLocations]   = useState([]);
  const [activeId,  setActiveId]    = useState(null);
  const [cache,     setCache]       = useState({});

  useEffect(() => {
    window.lumen.settings.getLocations()
      .then((locs) => {
        const enabled = (locs || []).filter((l) => l.enabled);
        setLocations(enabled);
        if (enabled.length > 0) setActiveId(enabled[0].id);
      })
      .catch(() => {});
  }, []);

  const fetchForLoc = useCallback(async (loc) => {
    setCache((c) => ({ ...c, [loc.id]: { ...(c[loc.id] || {}), loading: true, error: '' } }));
    try {
      const data = await window.lumen.promos.fetchForLocation(loc);
      setCache((c) => ({ ...c, [loc.id]: { promos: data || [], loading: false, error: '' } }));
    } catch (e) {
      setCache((c) => ({ ...c, [loc.id]: { promos: [], loading: false, error: e?.message || 'Error' } }));
    }
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const loc = locations.find((l) => l.id === activeId);
    if (!loc) return;
    if (!cache[activeId]) fetchForLoc(loc);
  }, [activeId, locations]);

  const activeLoc  = locations.find((l) => l.id === activeId);
  const activeData = cache[activeId] || {};

  if (locations.length === 0) return null;

  return (
    <div className="bento-card bento-span-full mb-4">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Utensils size={13} style={{ color: '#f59e0b' }} />
        <h3 style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--lumen-text-secondary)', margin: 0 }}>
          Promociones cerca
        </h3>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {!activeData.loading && (
            <button onClick={() => activeLoc && fetchForLoc(activeLoc)} title="Actualizar"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: 'var(--lumen-text-muted)', display: 'flex' }}>
              <RefreshCw size={11} />
            </button>
          )}
          <button onClick={() => onNavigateSettings?.('settings')} title="Configurar ubicaciones"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: 'var(--lumen-text-muted)', display: 'flex' }}>
            <SettingsIcon size={11} />
          </button>
        </div>
      </div>

      {locations.length > 1 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {locations.map((loc) => {
            const isActive = loc.id === activeId;
            const color = LOC_COLORS[loc.id] || '#f59e0b';
            return (
              <button key={loc.id} onClick={() => setActiveId(loc.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', border: `1px solid ${isActive ? color : 'var(--lumen-border)'}`,
                  background: isActive ? `${color}18` : 'transparent',
                  color: isActive ? color : 'var(--lumen-text-muted)',
                  transition: 'all 0.15s',
                }}>
                <MapPin size={10} />
                {LOC_LABELS[loc.id] || loc.label}
                {loc.address && <span style={{ fontSize: 9, opacity: 0.6, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.address.split(',')[0]}</span>}
              </button>
            );
          })}
        </div>
      )}

      {locations.length === 1 && activeLoc && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
          <MapPin size={10} style={{ color: LOC_COLORS[activeLoc.id] || '#f59e0b' }} />
          <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)' }}>
            {activeLoc.address || LOC_LABELS[activeLoc.id] || activeLoc.label}
          </span>
        </div>
      )}

      <PromoTable promos={activeData.promos} loading={activeData.loading} error={activeData.error} />
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

// ─── Info card (changelog / manual triggers) ─────────────────────────────────

function InfoCard({ icon: Icon, color, title, subtitle, badge, onClick }) {
  return (
    <button onClick={onClick} className="bento-card interactive w-full text-left"
      style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Glow accent */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle at top right, ${color}22, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: `${color}12`, border: `1px solid ${color}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} style={{ color }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--lumen-text)', margin: 0 }}>{title}</p>
            {badge && (
              <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: `${color}18`, border: `1px solid ${color}35`, color, fontWeight: 700 }}>
                {badge}
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', lineHeight: 1.5, margin: 0 }}>{subtitle}</p>
        </div>
        <ChevronRight size={13} style={{ color: 'var(--lumen-text-muted)', flexShrink: 0, opacity: 0.5, marginTop: 2 }} />
      </div>
    </button>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard({ navigateTo, userName = 'Lucila' }) {
  const [stats, setStats]     = useState({ policies: 0, contacts: 0, notes: 0 });
  const [turn, setTurn]       = useState(null);
  const [todayCases, setTodayCases] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPromos, setShowPromos] = useState(true);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showManual, setShowManual]     = useState(false);

  useEffect(() => {
    Promise.all([
      window.lumen.policies.getAll(),
      window.lumen.contacts.getAll(),
      window.lumen.notes.getAll(),
    ]).then(([policies, contacts, notes]) => {
      setStats({ policies: policies.length, contacts: contacts.length, notes: notes.length });
    }).catch(() => {}).finally(() => setLoading(false));

    window.lumen.turns.getActive().then((t) => setTurn(t || null)).catch(() => {});
    const today = new Date().toISOString().slice(0, 10);
    window.lumen.cases.search({ dateFrom: today, dateTo: today })
      .then((r) => setTodayCases((r || []).length))
      .catch(() => {});

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
              Bienvenida, <span style={{ fontWeight: 600, color: 'var(--lumen-text)' }}>{userName}</span>
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

      {/* Info cards: Changelog + Manual */}
      <div className="bento-grid bento-grid-2 mb-4">
        <InfoCard
          icon={Sparkles}
          color="#f59e0b"
          title="Novedades"
          subtitle="Cambios recientes, nuevas funciones y correcciones de esta versión."
          badge="v0.1.17"
          onClick={() => setShowChangelog(true)}
        />
        <InfoCard
          icon={BookMarked}
          color="var(--lumen-accent)"
          title="Manual de usuario"
          subtitle="Guía completa para usar todos los módulos de LUMEN."
          badge="8 secciones"
          onClick={() => setShowManual(true)}
        />
      </div>

      {/* Promotions widget */}
      {showPromos && <PromosWidget onNavigateSettings={navigateTo} />}

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

      {/* Modals */}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
      {showManual    && <ManualModal    onClose={() => setShowManual(false)} />}
    </div>
  );
}
