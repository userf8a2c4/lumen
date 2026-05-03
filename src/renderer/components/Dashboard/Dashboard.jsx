import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FlaskConical, Library, StickyNote, GitBranch,
  Keyboard, Search, Terminal, Clock, Briefcase,
  BookOpen, Users, CheckCircle2, Utensils, RefreshCw,
  Star, MapPin, Settings as SettingsIcon, Sparkles, X,
  Cpu, FolderOpen, MessageSquare, Layers, AlignLeft,
  ChevronRight, BookMarked, Navigation, WifiOff,
} from 'lucide-react';
import LumenLogo from '../LumenLogo';

const PROMO_FAV_KEY   = 'lumen_promo_favorites';
const PROMO_CACHE_KEY = 'lumen_promo_cache';
const SCAN_INTERVAL   = 15 * 60 * 1000; // 15 minutes

// ─── GPS + reverse geocode helpers ───────────────────────────────────────────

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('GPS no disponible')); return; }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, timeout: 10000, maximumAge: 60000,
    });
  });
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
      { headers: { 'User-Agent': 'LUMEN-App/1.0' } }
    );
    const data = await res.json();
    const a = data.address || {};
    const parts = [
      a.road || a.pedestrian || a.footway,
      a.house_number,
      a.suburb || a.neighbourhood,
      a.city || a.town || a.village || a.municipality,
      a.state,
    ].filter(Boolean);
    return parts.join(', ') || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

function fmtAgo(date) {
  if (!date) return '';
  const mins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (mins < 1)  return 'ahora mismo';
  if (mins === 1) return 'hace 1 min';
  if (mins < 60)  return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? 'hace 1 hora' : `hace ${hrs} horas`;
}

// ─── Changelog data ───────────────────────────────────────────────────────────

const CHANGELOG = [
  {
    version: '0.1.18',
    name: 'Chiquisaurias Edition',
    date: 'May 2026',
    accent: '#a78bfa',
    highlights: [
      { icon: Navigation,   text: 'Promociones se escanean automáticamente al iniciar LUMEN y cada 15 minutos sin tocar nada.' },
      { icon: MapPin,       text: 'Usa GPS en vivo en cada escaneo. Si no hay señal, usa la última ubicación guardada.' },
      { icon: RefreshCw,    text: 'El widget muestra la dirección actual y el tiempo desde la última actualización.' },
      { icon: FolderOpen,   text: 'Nuevo módulo Expedientes: historial completo de casos con búsqueda y detalle.' },
      { icon: Sparkles,     text: 'Dashboard: Novedades y Manual de usuario accesibles desde el inicio.' },
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

function PromoCard({ p }) {
  const [fav, setFav] = useState(() => {
    try { const favs = JSON.parse(localStorage.getItem(PROMO_FAV_KEY) || '[]'); return favs.includes(`${p.name}||${p.promo}`); } catch { return false; }
  });

  const toggleFav = () => {
    const k = `${p.name}||${p.promo}`;
    setFav((prev) => {
      const next = !prev;
      try {
        const favs = JSON.parse(localStorage.getItem(PROMO_FAV_KEY) || '[]');
        const updated = next ? [...favs, k] : favs.filter((x) => x !== k);
        localStorage.setItem(PROMO_FAV_KEY, JSON.stringify(updated));
      } catch {}
      return next;
    });
  };

  const openUrl = () => {
    if (p.url) window.lumen.shell.openExternal(p.url).catch(() => {});
  };

  return (
    <div style={{
      border: `1px solid ${fav ? 'rgba(245,158,11,0.35)' : 'var(--lumen-border)'}`,
      borderRadius: 8,
      background: fav ? 'rgba(245,158,11,0.04)' : 'var(--lumen-card)',
      padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 7,
      transition: 'border-color 0.15s',
    }}>
      {/* Header row: category badge + fav star */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '2px 7px', borderRadius: 99,
          background: 'rgba(245,158,11,0.12)', color: '#f59e0b',
          border: '1px solid rgba(245,158,11,0.25)',
        }}>{p.category || 'Restaurante'}</span>
        <div style={{ flex: 1 }} />
        <button onClick={toggleFav} title={fav ? 'Quitar favorito' : 'Guardar'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: fav ? '#f59e0b' : 'var(--lumen-text-muted)', display: 'flex' }}>
          <Star size={11} fill={fav ? '#f59e0b' : 'none'} />
        </button>
      </div>

      {/* Restaurant name */}
      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--lumen-text)', lineHeight: 1.2, margin: 0 }}>{p.name}</p>

      {/* Promo description */}
      <p style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600, lineHeight: 1.4, margin: 0 }}>{p.promo}</p>

      {/* Details */}
      {p.details && (
        <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', lineHeight: 1.45, margin: 0 }}>{p.details}</p>
      )}

      {/* Price + address row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {p.price && (
          <span style={{
            fontSize: 13, fontWeight: 800, color: '#10b981',
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
            padding: '2px 9px', borderRadius: 6,
          }}>{p.price}</span>
        )}
        {p.address && (
          <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)', display: 'flex', alignItems: 'center', gap: 3, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <MapPin size={9} style={{ flexShrink: 0 }} />{p.address}
          </span>
        )}
      </div>

      {/* Ver oferta button */}
      {p.url && (
        <button
          onClick={openUrl}
          style={{
            marginTop: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            color: '#f59e0b', transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.18)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(245,158,11,0.1)'; }}
        >
          Ver oferta →
        </button>
      )}
    </div>
  );
}

function PromoTable({ promos, loading }) {
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 0', color: 'var(--lumen-text-muted)', fontSize: 11 }}>
      <RefreshCw size={12} className="animate-spin" style={{ color: '#f59e0b' }} />
      Buscando restaurantes y promociones cerca de ti…
    </div>
  );
  if (!promos || promos.length === 0) return (
    <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', padding: '10px 0', lineHeight: 1.55 }}>
      No se encontraron promociones activas hoy. Intenta más tarde o configura una ubicación en Configuración.
    </p>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
      {promos.map((p, i) => <PromoCard key={i} p={p} />)}
    </div>
  );
}

function PromosWidget({ onNavigateSettings }) {
  const [promos,      setPromos]      = useState(() => {
    try { return JSON.parse(localStorage.getItem(PROMO_CACHE_KEY) || '[]'); } catch { return []; }
  });
  const [loading,     setLoading]     = useState(false);
  const [address,     setAddress]     = useState('');
  const [error,       setError]       = useState('');
  const [lastUpdate,  setLastUpdate]  = useState(null);
  const [agoLabel,    setAgoLabel]    = useState('');
  const scanningRef = useRef(false);

  // ── Core scan function ────────────────────────────────────────────
  const scan = useCallback(async () => {
    if (scanningRef.current) return;   // prevent overlapping scans
    scanningRef.current = true;
    setLoading(true);
    setError('');

    let loc = null;

    // 1. Try live GPS first
    try {
      const pos = await getCurrentPosition();
      const { latitude: lat, longitude: lng } = pos.coords;
      const addr = await reverseGeocode(lat, lng);
      loc = { lat, lng, address: addr };
      setAddress(addr);
    } catch {
      // 2. Fallback: last saved location in Settings
      try {
        const locs = await window.lumen.settings.getLocations();
        const saved = (locs || []).filter((l) => l.enabled && l.lat);
        if (saved.length > 0) {
          loc = saved[0];
          setAddress(loc.address || `${loc.lat?.toFixed(4)}, ${loc.lng?.toFixed(4)}`);
        }
      } catch {}
    }

    if (!loc) {
      setError('No se pudo obtener la ubicación. Activa el GPS o configura una en Configuración.');
      setLoading(false);
      scanningRef.current = false;
      return;
    }

    // 3. Fetch promos for the location
    try {
      const data = await window.lumen.promos.fetchForLocation(loc);
      const result = data || [];
      setPromos(result);
      try { localStorage.setItem(PROMO_CACHE_KEY, JSON.stringify(result)); } catch {}
      setLastUpdate(new Date());
      setError('');
    } catch (e) {
      setError(e?.message || 'Error al buscar promociones.');
    }

    setLoading(false);
    scanningRef.current = false;
  }, []);

  // ── Auto-scan on mount + every 15 min ────────────────────────────
  useEffect(() => {
    scan();
    const interval = setInterval(scan, SCAN_INTERVAL);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line

  // ── "Hace X min" label updates every minute ───────────────────────
  useEffect(() => {
    const tick = () => setAgoLabel(lastUpdate ? fmtAgo(lastUpdate) : '');
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, [lastUpdate]);

  return (
    <div className="bento-card bento-span-full mb-4">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Utensils size={13} style={{ color: '#f59e0b' }} />
        <h3 style={{ fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--lumen-text-secondary)', margin: 0 }}>
          Promociones cerca
        </h3>

        {/* Location + timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 6 }}>
          {loading
            ? <RefreshCw size={10} className="animate-spin" style={{ color: '#f59e0b' }} />
            : <Navigation size={10} style={{ color: address ? '#10b981' : 'var(--lumen-text-muted)' }} />
          }
          {address && !loading && (
            <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {address.split(',').slice(0, 2).join(',')}
            </span>
          )}
          {loading && (
            <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)' }}>Escaneando…</span>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Last update label */}
          {agoLabel && !loading && (
            <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)', fontFamily: 'monospace' }}>
              {agoLabel}
            </span>
          )}
          {/* Manual refresh */}
          {!loading && (
            <button onClick={scan} title="Escanear ahora"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, color: 'var(--lumen-text-muted)', display: 'flex' }}>
              <RefreshCw size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && !loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 10 }}>
          <WifiOff size={12} style={{ color: '#f87171', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#f87171', lineHeight: 1.4 }}>{error}</span>
          <button onClick={() => onNavigateSettings?.('settings')} style={{ marginLeft: 'auto', fontSize: 10, color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', flexShrink: 0 }}>
            Configurar
          </button>
        </div>
      )}

      <PromoTable promos={promos} loading={loading && promos.length === 0} error={''} />
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
          badge="v0.1.18"
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
      <PromosWidget onNavigateSettings={navigateTo} />

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
