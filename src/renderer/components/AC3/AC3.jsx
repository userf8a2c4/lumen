import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Cpu, Copy, Check, ChevronDown, ChevronUp, ChevronLeft,
  CalendarDays, Loader2, RefreshCw, Settings, Users,
  AlertTriangle, Mail, GitBranch, BookOpen, Plus,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATE_CATEGORIES = [
  { id: 'saludo',          label: 'SALUDO',              color: '#4ade80' },
  { id: 'preguntas',       label: 'PREGUNTAS DE SONDEO', color: '#60a5fa' },
  { id: 'confirmacion',    label: 'CONFIRMACIÓN',        color: '#a78bfa' },
  { id: 'disculpa',        label: 'DISCULPA',            color: '#f87171' },
  { id: 'agradecimiento',  label: 'AGRADECIMIENTO',      color: '#fbbf24' },
  { id: 'ausencia',        label: 'AUSENCIA',            color: '#94a3b8' },
  { id: 'tarjeta',         label: 'TARJETA DE ACCESO',   color: '#fb923c' },
  { id: 'reembolso',       label: 'REEMBOLSO',           color: '#34d399' },
  { id: 'configuraciones', label: 'CONFIGURACIONES',     color: '#e879f9' },
  { id: 'despedida',       label: 'DESPEDIDA',           color: '#38bdf8' },
];

// ─── Node format migration (legacy formats → current format) ─────────────────

function normalizeNode(node) {
  const options = Array.isArray(node.options) ? node.options : (() => {
    const opts = [];
    if (node.type === 'decision') {
      opts.push({ label: node.yes_label || 'Sí', next_node_id: null });
      opts.push({ label: node.no_label  || 'No', next_node_id: null });
    }
    return opts;
  })();
  return {
    id:           node.id,
    question:     node.question || node.title || '',
    instructions: node.instructions || '',
    speech:       node.speech || node.note || '',
    options,
  };
}

// ─── Templates Panel — read-only, copy only ──────────────────────────────────

function TemplatesPanel({ templates }) {
  const [expanded, setExpanded] = useState(() => new Set(['saludo']));
  const [copying, setCopying]   = useState(null);

  const toggle = (id) => setExpanded((prev) => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const copy = async (t) => {
    try { await navigator.clipboard.writeText(t.content); } catch {}
    setCopying(t.id);
    setTimeout(() => setCopying(null), 1500);
  };

  return (
    <div style={{
      width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderRight: '1px solid var(--lumen-border)', overflowY: 'auto',
      background: 'rgba(255,255,255,0.01)',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--lumen-border)' }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase' }}>
          Plantillas de texto
        </span>
      </div>

      {TEMPLATE_CATEGORIES.map((cat) => {
        const items = templates.filter((t) => t.category === cat.id);
        const open  = expanded.has(cat.id);
        return (
          <div key={cat.id} style={{ borderBottom: '1px solid var(--lumen-border)' }}>
            <button
              onClick={() => toggle(cat.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--lumen-text-secondary)', textTransform: 'uppercase' }}>{cat.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--lumen-text-muted)' }}>{items.length}</span>
                {open ? <ChevronUp size={10} style={{ color: 'var(--lumen-text-muted)' }} /> : <ChevronDown size={10} style={{ color: 'var(--lumen-text-muted)' }} />}
              </div>
            </button>

            {open && (
              <div style={{ padding: '0 8px 6px' }}>
                {items.length === 0 ? (
                  <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', padding: '4px 2px', opacity: 0.6, lineHeight: 1.4 }}>
                    Sin plantillas. Agrega en Configuración.
                  </p>
                ) : items.map((t) => (
                  <div key={t.id} style={{ marginBottom: 4, borderRadius: 5, border: '1px solid var(--lumen-border)', background: 'rgba(255,255,255,0.02)', padding: '6px 8px' }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: 3, lineHeight: 1.3 }}>{t.title}</p>
                    <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', lineHeight: 1.45, marginBottom: 5 }} className="line-clamp-2">{t.content}</p>
                    <button
                      onClick={() => copy(t)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                        fontSize: 9, padding: '3px 0', borderRadius: 3, cursor: 'pointer', border: 'none',
                        background: copying === t.id ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
                        color: copying === t.id ? '#4ade80' : 'var(--lumen-text-muted)', transition: 'all 0.15s',
                      }}
                    >
                      {copying === t.id ? <><Check size={9} /> Copiado</> : <><Copy size={9} /> Copiar</>}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Decision Wizard — interactive step-by-step ───────────────────────────────

function DecisionWizard({ branch, onBack }) {
  const nodes = useMemo(() => {
    const raw = Array.isArray(branch.nodes) ? branch.nodes : [];
    return raw.map(normalizeNode);
  }, [branch]);

  const [currentId, setCurrentId] = useState(() => nodes[0]?.id ?? null);
  const [path, setPath]           = useState([]);
  const [done, setDone]           = useState(false);

  const currentNode = nodes.find((n) => n.id === currentId) ?? null;

  const advance = (nextNodeId) => {
    setPath((p) => [...p, currentId]);
    if (nextNodeId) {
      const target = nodes.find((n) => n.id === nextNodeId);
      if (target) { setCurrentId(nextNodeId); return; }
    }
    // Fall through to next in sequence
    const idx = nodes.findIndex((n) => n.id === currentId);
    if (idx >= 0 && idx < nodes.length - 1) {
      setCurrentId(nodes[idx + 1].id);
    } else {
      setDone(true);
      setCurrentId(null);
    }
  };

  const goBack = () => {
    if (path.length === 0) return;
    const prev = path[path.length - 1];
    setPath((p) => p.slice(0, -1));
    setCurrentId(prev);
    setDone(false);
  };

  const reset = () => { setCurrentId(nodes[0]?.id ?? null); setPath([]); setDone(false); };

  const stepNum = path.length + 1;
  const totalSteps = nodes.length;
  const accent = branch.color || '#7E3FF2';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>

      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', padding: '4px 6px', borderRadius: 4 }}
        >
          <ChevronLeft size={14} />
          <span style={{ fontSize: 11 }}>Ramas</span>
        </button>
        <div style={{ width: 1, height: 16, background: 'var(--lumen-border)' }} />
        <div style={{ width: 9, height: 9, borderRadius: '50%', background: accent, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lumen-text)' }}>{branch.name}</span>
        <div style={{ flex: 1 }} />
        {!done && nodes.length > 0 && (
          <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)', fontFamily: 'monospace' }}>
            {stepNum}/{totalSteps}
          </span>
        )}
        {(path.length > 0) && (
          <button onClick={goBack} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--lumen-border)', color: 'var(--lumen-text-muted)', cursor: 'pointer', fontSize: 11 }}>
            ← Atrás
          </button>
        )}
        <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--lumen-border)', color: 'var(--lumen-text-muted)', cursor: 'pointer', fontSize: 11 }}>
          ↺ Reiniciar
        </button>
      </div>

      {/* Progress bar */}
      {!done && nodes.length > 1 && (
        <div style={{ height: 2, background: 'var(--lumen-border)', flexShrink: 0 }}>
          <div style={{ height: '100%', background: accent, width: `${(stepNum / totalSteps) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>
      )}

      {/* Content */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: '28px 20px',
        display: 'flex', flexDirection: 'column',
        alignItems: (nodes.length === 0 || done) ? 'center' : 'flex-start',
        justifyContent: (nodes.length === 0 || done) ? 'center' : 'flex-start',
      }}>

        {nodes.length === 0 ? (
          <div style={{ textAlign: 'center', opacity: 0.5 }}>
            <GitBranch size={32} style={{ color: 'var(--lumen-text-muted)', marginBottom: 12 }} />
            <p style={{ fontSize: 12, color: 'var(--lumen-text-muted)', lineHeight: 1.6 }}>
              Sin pasos definidos.<br />Configura el árbol en <strong>Configuración → Árbol de Decisiones</strong>.
            </p>
          </div>
        ) : done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Check size={24} style={{ color: '#10b981' }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--lumen-text)', marginBottom: 6 }}>Proceso completado</p>
            <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', marginBottom: 24 }}>{path.length} paso{path.length !== 1 ? 's' : ''} recorrido{path.length !== 1 ? 's' : ''}</p>
            <button
              onClick={reset}
              style={{ padding: '8px 22px', borderRadius: 6, fontSize: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--lumen-border)', color: 'var(--lumen-text-muted)', cursor: 'pointer' }}
            >
              ↺ Reiniciar
            </button>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 540 }}>
            {/* Node ID badge */}
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: accent, textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>
              NODO {currentNode?.id || stepNum}
            </p>

            {/* Central question */}
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--lumen-text)', marginBottom: 18, lineHeight: 1.3 }}>
              {currentNode?.question || ''}
            </h3>

            {/* Instructions — internal guide for Lucila */}
            {currentNode?.instructions && (
              <div style={{
                marginBottom: 16, padding: '10px 14px',
                background: 'rgba(96,165,250,0.07)',
                border: '1px solid rgba(96,165,250,0.2)',
                borderLeft: '3px solid #60a5fa',
                borderRadius: '0 6px 6px 0',
              }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: '#60a5fa', marginBottom: 6, textTransform: 'uppercase' }}>
                  Para ti:
                </p>
                <p style={{ fontSize: 12, color: 'var(--lumen-text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                  {currentNode.instructions}
                </p>
              </div>
            )}

            {/* Speech — copy-paste for client */}
            {currentNode?.speech && (
              <div style={{
                marginBottom: 26, padding: '14px 18px',
                background: `${accent}0d`,
                border: `1px solid ${accent}30`,
                borderLeft: `3px solid ${accent}`,
                borderRadius: '0 8px 8px 0',
              }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--lumen-text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Decirle al cliente:
                </p>
                <p style={{ fontSize: 13, color: 'var(--lumen-text)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                  {currentNode.speech}
                </p>
              </div>
            )}

            {/* Options */}
            {currentNode?.options && currentNode.options.length > 0 ? (
              <div>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                  Selecciona una opción:
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {currentNode.options.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => advance(opt.next_node_id)}
                      style={{
                        padding: '11px 16px', borderRadius: 6, textAlign: 'left', cursor: 'pointer',
                        background: 'rgba(255,255,255,0.03)', border: '1px solid var(--lumen-border)',
                        color: 'var(--lumen-text)', fontSize: 12, fontWeight: 500, transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `${accent}18`; e.currentTarget.style.borderColor = `${accent}55`; e.currentTarget.style.color = accent; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--lumen-border)'; e.currentTarget.style.color = 'var(--lumen-text)'; }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                onClick={() => advance(null)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 6,
                  background: `${accent}15`, border: `1px solid ${accent}40`,
                  color: accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = `${accent}28`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${accent}15`; }}
              >
                {nodes.findIndex((n) => n.id === currentId) >= nodes.length - 1 ? '✓ Finalizar' : 'Siguiente →'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Branch card — read-only ──────────────────────────────────────────────────

function BranchCard({ branch, index, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)',
        borderRadius: 8, padding: '14px', textAlign: 'left', cursor: 'pointer',
        transition: 'all 0.15s', borderLeft: `3px solid ${branch.color || '#7E3FF2'}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = (branch.color || '#7E3FF2') + '88'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--lumen-border)'; e.currentTarget.style.borderLeftColor = branch.color || '#7E3FF2'; }}
    >
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: branch.color || '#7E3FF2', letterSpacing: '0.08em' }}>
          RAMA #{index + 1}
        </span>
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: 4, lineHeight: 1.3 }}>{branch.name}</p>
      {branch.description && (
        <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', lineHeight: 1.4, marginBottom: 6 }} className="line-clamp-2">{branch.description}</p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
        <GitBranch size={9} style={{ color: 'var(--lumen-text-muted)' }} />
        <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)' }}>
          {Array.isArray(branch.nodes) ? branch.nodes.length : 0} nodo{branch.nodes?.length !== 1 ? 's' : ''}
        </span>
      </div>
    </button>
  );
}

// ─── Right Panel — read-only ──────────────────────────────────────────────────

function RightPanel({ activeBranch, emailTemplates, calEvents, calLoading, onCalRefresh, topPolicies, onNavigate }) {
  return (
    <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--lumen-border)', minHeight: 0 }}>

      {/* Quick nav */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        {[
          { label: 'Configuración', icon: Settings, color: 'var(--lumen-accent)', target: 'settings', bg: 'rgba(255,255,255,0.03)', border: 'var(--lumen-border)' },
          { label: 'Contactos',     icon: Users,    color: '#60a5fa',              target: 'contacts', bg: 'rgba(255,255,255,0.03)', border: 'var(--lumen-border)' },
        ].map(({ label, icon: Icon, color, target, bg, border }) => (
          <button key={target} onClick={() => onNavigate(target)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: bg, border: `1px solid ${border}`, borderRadius: 6, cursor: 'pointer', transition: 'background 0.12s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
            onMouseLeave={(e) => e.currentTarget.style.background = bg}
          >
            <Icon size={13} style={{ color }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lumen-text)' }}>{label}</span>
          </button>
        ))}
        <button
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, cursor: 'pointer', transition: 'background 0.12s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
        >
          <AlertTriangle size={13} style={{ color: '#ef4444' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444' }}>Emergencia</span>
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

        {/* Top policies */}
        {topPolicies.length > 0 && (
          <div style={{ borderBottom: '1px solid var(--lumen-border)' }}>
            <div style={{ padding: '8px 12px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <BookOpen size={10} style={{ color: 'var(--lumen-text-muted)' }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase' }}>Top políticas</span>
            </div>
            {topPolicies.slice(0, 5).map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 12px' }}>
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--lumen-accent)', minWidth: 14, paddingTop: 1 }}>{i + 1}</span>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--lumen-text)', lineHeight: 1.3, marginBottom: 1 }} className="line-clamp-1">{p.name}</p>
                  <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)' }}>{p.department}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Calendar */}
        <div style={{ borderBottom: '1px solid var(--lumen-border)' }}>
          <div style={{ padding: '8px 12px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays size={10} style={{ color: 'var(--lumen-text-muted)' }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase' }}>Calendario</span>
            </div>
            <button onClick={onCalRefresh} style={{ padding: 2, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)' }}>
              <RefreshCw size={9} className={calLoading ? 'animate-spin' : ''} />
            </button>
          </div>
          {calLoading ? (
            <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--lumen-text-muted)' }} />
            </div>
          ) : calEvents.length === 0 ? (
            <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', padding: '6px 12px 10px', lineHeight: 1.4 }}>
              Sin eventos próximos. Conecta Google Calendar en Configuración.
            </p>
          ) : (
            <div style={{ padding: '0 8px 8px' }}>
              {calEvents.slice(0, 4).map((ev, i) => {
                const start = ev.start?.dateTime || ev.start?.date;
                const d = start ? new Date(start) : null;
                const isAC3 = ev.summary?.startsWith('[AC3]');
                return (
                  <div key={i} style={{
                    padding: '5px 8px', marginBottom: 3, borderRadius: 4,
                    borderLeft: `2px solid ${isAC3 ? 'var(--lumen-accent)' : 'rgba(255,255,255,0.15)'}`,
                    background: isAC3 ? 'rgba(126,63,242,0.06)' : 'rgba(255,255,255,0.02)',
                  }}>
                    <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--lumen-text)', lineHeight: 1.3, marginBottom: 1 }} className="line-clamp-1">{ev.summary}</p>
                    {d && <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)' }}>{d.toLocaleString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Email templates — read-only */}
        <div>
          <div style={{ padding: '8px 12px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Mail size={10} style={{ color: 'var(--lumen-text-muted)' }} />
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase' }}>
              {activeBranch ? `Emails — ${activeBranch.name}` : 'Templates de email'}
            </span>
          </div>
          <div style={{ padding: '0 8px 8px' }}>
            {emailTemplates.length === 0 ? (
              <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', padding: '2px 4px', lineHeight: 1.4 }}>
                {activeBranch ? `Sin templates para ${activeBranch.name}.` : 'Sin templates. Agrega en Configuración.'}
              </p>
            ) : emailTemplates.map((em) => (
              <div key={em.id} style={{ marginBottom: 4, padding: '6px 8px', border: '1px solid var(--lumen-border)', borderRadius: 5, background: 'rgba(255,255,255,0.02)' }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: 2 }}>{em.label}</p>
                {em.subject && <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', marginBottom: 1 }}>Asunto: {em.subject}</p>}
                <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', lineHeight: 1.4 }} className="line-clamp-2">{em.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AC3({ navigateTo: onNavigate }) {
  const [branches, setBranches]         = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);
  const [textTemplates, setTextTemplates]   = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [calEvents, setCalEvents]       = useState([]);
  const [calLoading, setCalLoading]     = useState(false);
  const [topPolicies, setTopPolicies]   = useState([]);

  const loadAll = useCallback(async () => {
    try {
      const [br, tt, et, pol] = await Promise.all([
        window.lumen.ac3.branches.getAll(),
        window.lumen.ac3.textTemplates.getAll(),
        window.lumen.ac3.emailTemplates.getAll(),
        window.lumen.policies.getAll(),
      ]);
      setBranches(br || []);
      setTextTemplates(tt || []);
      setEmailTemplates(et || []);
      setTopPolicies((pol || []).slice(0, 5));
    } catch (e) { console.error('AC3 load error', e); }
  }, []);

  const loadCalEvents = useCallback(async () => {
    setCalLoading(true);
    try { setCalEvents(await window.lumen.calendar.getEvents(14) || []); }
    catch { setCalEvents([]); }
    finally { setCalLoading(false); }
  }, []);

  useEffect(() => { loadAll(); loadCalEvents(); }, []);

  const visibleEmails = activeBranch
    ? emailTemplates.filter((e) => e.branch_id === activeBranch.id || !e.branch_id)
    : emailTemplates.filter((e) => !e.branch_id);

  const navigate = onNavigate || (() => {});

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', background: 'var(--lumen-bg)' }}>

      {/* LEFT — Text templates (read-only) */}
      <TemplatesPanel templates={textTemplates} />

      {/* CENTER — Branch grid or Decision Wizard */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Cpu size={13} style={{ color: 'var(--lumen-text-secondary)' }} />
          <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--lumen-text)', margin: 0 }}>
            Centro de Decisiones
          </h2>
          {activeBranch && (
            <>
              <span style={{ color: 'var(--lumen-border)', fontSize: 14 }}>/</span>
              <span style={{ fontSize: 11, color: activeBranch.color || 'var(--lumen-accent)', fontWeight: 600 }}>{activeBranch.name}</span>
            </>
          )}
        </div>

        {activeBranch ? (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <DecisionWizard branch={activeBranch} onBack={() => setActiveBranch(null)} />
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {branches.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', opacity: 0.55 }}>
                <GitBranch size={36} style={{ color: 'var(--lumen-text-muted)', marginBottom: 14 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: 6 }}>Sin ramas de decisión</p>
                <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                  Ve a <strong>Configuración → Árbol de Decisiones</strong><br />para crear y configurar tus ramas.
                </p>
                <button
                  onClick={() => navigate('settings')}
                  style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 20, fontSize: 12, background: 'rgba(126,63,242,0.15)', border: '1px dashed rgba(126,63,242,0.4)', color: 'var(--lumen-accent)', cursor: 'pointer' }}
                >
                  <Settings size={14} /> Ir a Configuración
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {branches.map((br, idx) => (
                  <BranchCard key={br.id} branch={br} index={idx} onClick={() => setActiveBranch(br)} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT — Actions + info (read-only) */}
      <RightPanel
        activeBranch={activeBranch}
        emailTemplates={visibleEmails}
        calEvents={calEvents}
        calLoading={calLoading}
        onCalRefresh={loadCalEvents}
        topPolicies={topPolicies}
        onNavigate={navigate}
      />
    </div>
  );
}
