import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Cpu, Copy, Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight,
  CalendarDays, Loader2, RefreshCw, Settings, Users,
  AlertTriangle, Mail, GitBranch, BookOpen, Plus,
  Info, Target, Clock, X, Search, FileText, UserPlus,
} from 'lucide-react';
import ContactsPanel from '../Contacts/ContactsPanel';

// ─── Panel resize hook ────────────────────────────────────────────────────────

function useResize(defaultWidth, min, max, storageKey) {
  const [width, setWidth] = useState(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v) return Math.max(min, Math.min(max, parseInt(v, 10)));
    } catch {}
    return defaultWidth;
  });
  const widthRef = useRef(width);
  widthRef.current = width;

  // Persist whenever width changes (debounced via ref on mouseup)
  const startDrag = useCallback((e, direction = 1) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = widthRef.current;

    const onMove = (ev) => {
      const delta = (ev.clientX - startX) * direction;
      const next  = Math.max(min, Math.min(max, startW + delta));
      setWidth(next);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup',  onUp);
      try { localStorage.setItem(storageKey, String(widthRef.current)); } catch {}
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup',  onUp);
  }, [min, max, storageKey]);

  return [width, startDrag];
}

// ─── Panel dock hook ──────────────────────────────────────────────────────────

function useDock(storageKey, defaultPos = 'left') {
  const [dockPos, setDockPos] = useState(() => {
    try { return localStorage.getItem(storageKey) || defaultPos; } catch { return defaultPos; }
  });
  const setDock = (pos) => {
    setDockPos(pos);
    try { localStorage.setItem(storageKey, pos); } catch {}
  };
  return [dockPos, setDock];
}

// ─── Vertical resize (for bottom-docked panels) ───────────────────────────────

function useResizeH(defaultH, min, max, storageKey) {
  const [height, setHeight] = useState(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v) return Math.max(min, Math.min(max, parseInt(v, 10)));
    } catch {}
    return defaultH;
  });
  const hRef = useRef(height);
  hRef.current = height;

  const startDrag = useCallback((e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = hRef.current;
    const onMove = (ev) => {
      const delta = startY - ev.clientY; // drag up → taller
      setHeight(Math.max(min, Math.min(max, startH + delta)));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      try { localStorage.setItem(storageKey, String(hRef.current)); } catch {}
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [min, max, storageKey]);

  return [height, startDrag];
}

// ─── Dock menu ────────────────────────────────────────────────────────────────

const DOCK_OPTIONS = [
  { pos: 'left',   label: 'Izquierda' },
  { pos: 'right',  label: 'Derecha'   },
  { pos: 'bottom', label: 'Abajo'     },
];

function DockMenu({ currentPos, onDock }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const opts = DOCK_OPTIONS.filter((o) => o.pos !== currentPos);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'flex' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Mover panel"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '2px 3px', display: 'flex', alignItems: 'center',
          color: 'var(--lumen-text-muted)', opacity: 0.45, transition: 'opacity 0.12s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.opacity = '0.45'; }}
      >
        {/* 6-dot grip icon */}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
          <circle cx="2" cy="2" r="1.2" /><circle cx="5" cy="2" r="1.2" /><circle cx="8" cy="2" r="1.2" />
          <circle cx="2" cy="6" r="1.2" /><circle cx="5" cy="6" r="1.2" /><circle cx="8" cy="6" r="1.2" />
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', right: 0, zIndex: 200,
          background: '#1a1a24', border: '1px solid var(--lumen-border)',
          borderRadius: 6, padding: 4, minWidth: 110,
          boxShadow: '0 6px 20px rgba(0,0,0,0.45)',
        }}>
          {opts.map((o) => (
            <button
              key={o.pos}
              onClick={() => { onDock(o.pos); setOpen(false); }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 10px', background: 'none', border: 'none',
                cursor: 'pointer', borderRadius: 4, fontSize: 11,
                color: 'var(--lumen-text)', textAlign: 'left',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)' }}>
                {o.pos === 'left' ? '◁' : o.pos === 'right' ? '▷' : '▽'}
              </span>
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function useCollapsed(storageKey, defaultVal = false) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(storageKey) === 'true'; } catch { return defaultVal; }
  });
  const toggle = () => setCollapsed((v) => {
    const next = !v;
    try { localStorage.setItem(storageKey, String(next)); } catch {}
    return next;
  });
  return [collapsed, toggle];
}

// ─── Drag handle ──────────────────────────────────────────────────────────────

/* DragHandle is inlined as an absolute-positioned div on each panel wrapper edge */

// ─── Collapsed strip ──────────────────────────────────────────────────────────

function CollapsedStrip({ label, side = 'left', onExpand }) {
  return (
    <div
      onClick={onExpand}
      title={`Expandir ${label}`}
      style={{
        width: 24, flexShrink: 0, cursor: 'pointer', userSelect: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRight: side === 'left' ? '1px solid var(--lumen-border)' : 'none',
        borderLeft:  side === 'right' ? '1px solid var(--lumen-border)' : 'none',
        background: 'rgba(255,255,255,0.01)',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(126,63,242,0.06)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}
    >
      <span style={{
        writingMode: 'vertical-rl',
        transform: side === 'left' ? 'rotate(180deg)' : 'none',
        fontSize: 8, fontWeight: 700, letterSpacing: '0.14em',
        color: 'var(--lumen-text-muted)', textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Case export helper ────────────────────────────────────────────────────────

function exportCaseAsTxt(caseObj, summary, transcript, branch) {
  const date = caseObj.opened_at ? new Date(caseObj.opened_at).toLocaleString('es-ES') : '';
  const clientName = caseObj.client?.name || caseObj._client?.name || caseObj.client_name || 'N/A';
  const lines = [
    `LUMEN — CASO ${caseObj.case_number}`,
    `═══════════════════════════════════════`,
    `Fecha:   ${date}`,
    `Cliente: ${clientName}`,
    branch ? `Rama:    ${branch.name || branch}` : null,
    ``,
    `RESUMEN`,
    `───────`,
    summary || '(sin resumen)',
  ].filter((l) => l !== null);

  if (transcript?.length > 0) {
    lines.push('', 'CONVERSACIÓN CON LU', '──────────────────');
    transcript.forEach((m) => {
      lines.push(`[${m.role === 'user' ? 'AGENTE' : 'LU'}] ${m.text}`);
    });
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${caseObj.case_number}.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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

// ─── Node format migration (old linear format → new decision format) ──────────

function normalizeNode(node) {
  if (Array.isArray(node.options)) {
    // already new format — just ensure the new optional fields exist
    return {
      ...node,
      instructions: node.instructions || '',
      outcome: node.outcome || '',
    };
  }
  const options = [];
  if (node.type === 'decision') {
    options.push({ id: `${node.id}_y`, label: node.yes_label || 'Sí',  next_node_id: null });
    options.push({ id: `${node.id}_n`, label: node.no_label  || 'No',  next_node_id: null });
  }
  return {
    id: node.id,
    title: node.title || '',
    instructions: node.instructions || '',
    speech: node.speech || node.note || '',
    outcome: node.outcome || '',
    options,
  };
}

// ─── Speeches Panel — read-only, copy, teleprompter ──────────────────────────

function SpeechesPanel({ speeches, onCollapse, dockPos, onDock }) {
  const [expanded, setExpanded] = useState(() => new Set());
  const [copying, setCopying]   = useState(null);
  const [tele, setTele]         = useState(null); // speechId en modo teleprompter

  const categories = [...new Set(speeches.map((s) => s.category))].sort();

  const toggle = (cat) => setExpanded((prev) => {
    const s = new Set(prev);
    s.has(cat) ? s.delete(cat) : s.add(cat);
    return s;
  });

  const copy = async (sp) => {
    try { await navigator.clipboard.writeText(sp.content); } catch {}
    setCopying(sp.id);
    setTimeout(() => setCopying(null), 1500);
  };

  // Teleprompter overlay
  if (tele) {
    const sp = speeches.find((s) => s.id === tele);
    return (
      <div style={{
        flex: 1, minWidth: 0,
        background: '#000', color: '#fff',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setTele(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Salir
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#666', textTransform: 'uppercase', marginBottom: 12 }}>{sp?.category}</p>
          <p style={{ fontSize: 18, lineHeight: 1.8, color: '#fff', whiteSpace: 'pre-wrap' }}>{sp?.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
      overflowY: 'auto', background: 'rgba(255,255,255,0.01)',
    }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase', flex: 1 }}>
          Speeches
        </span>
        {onDock && <DockMenu currentPos={dockPos} onDock={onDock} />}
        {onCollapse && (
          <button onClick={onCollapse} title="Minimizar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 3px', color: 'var(--lumen-text-muted)', display: 'flex', opacity: 0.5 }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}>
            <ChevronLeft size={11} />
          </button>
        )}
      </div>

      {speeches.length === 0 ? (
        <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', padding: '14px', lineHeight: 1.5, opacity: 0.6 }}>
          Sin guiones. Agrega en Configuración.
        </p>
      ) : categories.map((cat) => {
        const items = speeches.filter((s) => s.category === cat);
        const open = expanded.has(cat);
        return (
          <div key={cat} style={{ borderBottom: '1px solid var(--lumen-border)' }}>
            <button
              onClick={() => toggle(cat)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--lumen-accent)', flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--lumen-text-secondary)', textTransform: 'uppercase' }}>{cat}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--lumen-text-muted)' }}>{items.length}</span>
                {open ? <ChevronUp size={10} style={{ color: 'var(--lumen-text-muted)' }} /> : <ChevronDown size={10} style={{ color: 'var(--lumen-text-muted)' }} />}
              </div>
            </button>
            {open && (
              <div style={{ padding: '0 8px 6px' }}>
                {items.map((sp) => (
                  <div key={sp.id} style={{ marginBottom: 4, borderRadius: 5, border: '1px solid var(--lumen-border)', background: 'rgba(255,255,255,0.02)', padding: '6px 8px' }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: 3, lineHeight: 1.3 }}>{sp.title}</p>
                    <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', lineHeight: 1.45, marginBottom: 5 }} className="line-clamp-2">{sp.content}</p>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => copy(sp)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 9, padding: '3px 0', borderRadius: 3, cursor: 'pointer', border: 'none', background: copying === sp.id ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)', color: copying === sp.id ? '#4ade80' : 'var(--lumen-text-muted)', transition: 'all 0.15s' }}
                      >
                        {copying === sp.id ? <><Check size={9} /> Copiado</> : <><Copy size={9} /> Copiar</>}
                      </button>
                      <button
                        onClick={() => setTele(sp.id)}
                        title="Modo teleprompter"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 9, padding: '3px 6px', borderRadius: 3, cursor: 'pointer', border: 'none', background: 'rgba(255,255,255,0.05)', color: 'var(--lumen-text-muted)' }}
                      >
                        ▶
                      </button>
                    </div>
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

// ─── Templates Panel — read-only, copy only ──────────────────────────────────

function TemplatesPanel({ templates, onCollapse, dockPos, onDock }) {
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
      flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
      overflowY: 'auto', background: 'rgba(255,255,255,0.01)',
    }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, gap: 4 }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase', flex: 1 }}>
          Plantillas de texto
        </span>
        {onDock && <DockMenu currentPos={dockPos} onDock={onDock} />}
        {onCollapse && (
          <button onClick={onCollapse} title="Minimizar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 3px', color: 'var(--lumen-text-muted)', display: 'flex', opacity: 0.5 }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}>
            <ChevronLeft size={11} />
          </button>
        )}
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
          <div style={{ width: '100%', maxWidth: 520 }}>
            {/* Step label */}
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: accent, textTransform: 'uppercase', marginBottom: 8 }}>
              Paso {stepNum} de {totalSteps}
            </p>

            {/* Node title */}
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--lumen-text)', marginBottom: (currentNode?.instructions || currentNode?.speech) ? 18 : 22, lineHeight: 1.3 }}>
              {currentNode?.title || ''}
            </h3>

            {/* Instructions — internal note for Lu (not shown to client) */}
            {currentNode?.instructions && (
              <div style={{
                marginBottom: 16, padding: '12px 16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--lumen-border)',
                borderLeft: '3px solid var(--lumen-text-muted)',
                borderRadius: '0 8px 8px 0',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Info size={11} style={{ color: 'var(--lumen-text-muted)' }} />
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase', margin: 0 }}>
                    Instrucciones
                  </p>
                </div>
                <p style={{ fontSize: 12, color: 'var(--lumen-text-muted)', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {currentNode.instructions}
                </p>
              </div>
            )}

            {/* Speech */}
            {currentNode?.speech && (
              <div style={{
                marginBottom: 26, padding: '14px 18px',
                background: `${accent}0d`,
                border: `1px solid ${accent}30`,
                borderLeft: `3px solid ${accent}`,
                borderRadius: '0 8px 8px 0',
              }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--lumen-text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                  Qué decir:
                </p>
                <p style={{ fontSize: 13, color: 'var(--lumen-text)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                  {currentNode.speech}
                </p>
              </div>
            )}

            {/* Terminal outcome — shown when no options but an outcome is set */}
            {(!currentNode?.options || currentNode.options.length === 0) && currentNode?.outcome && (
              <div style={{
                marginBottom: 18, padding: '20px 22px',
                background: `linear-gradient(135deg, ${accent}12, ${accent}05)`,
                border: `1px solid ${accent}40`,
                borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: `${accent}20`, border: `1px solid ${accent}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Target size={18} style={{ color: accent }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: accent, textTransform: 'uppercase', marginBottom: 4 }}>
                    Resultado
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--lumen-text)', lineHeight: 1.2, whiteSpace: 'pre-wrap', margin: 0 }}>
                    {currentNode.outcome}
                  </p>
                </div>
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
          {Array.isArray(branch.nodes) ? branch.nodes.length : 0} paso{branch.nodes?.length !== 1 ? 's' : ''}
        </span>
      </div>
    </button>
  );
}

// ─── Right Panel — read-only ──────────────────────────────────────────────────

function RightPanel({ activeBranch, emailTemplates, calEvents, calLoading, onCalRefresh, topPolicies, onNavigate, onOpenContacts, onCollapse, activeCase, clientCases, dockPos, onDock }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* Quick nav */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        {(onCollapse || onDock) && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            {onCollapse && (
              <button onClick={onCollapse} title="Minimizar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 3px', color: 'var(--lumen-text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, opacity: 0.5 }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; }}>
                <ChevronRight size={11} /> <span style={{ letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>Cerrar</span>
              </button>
            )}
            {onDock && <DockMenu currentPos={dockPos} onDock={onDock} />}
          </div>
        )}
        <button onClick={() => onNavigate('settings')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--lumen-border)', borderRadius: 6, cursor: 'pointer', transition: 'background 0.12s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        >
          <Settings size={13} style={{ color: 'var(--lumen-accent)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lumen-text)' }}>Configuración</span>
        </button>
        <button onClick={onOpenContacts}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--lumen-border)', borderRadius: 6, cursor: 'pointer', transition: 'background 0.12s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        >
          <Users size={13} style={{ color: '#60a5fa' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lumen-text)' }}>Contactos</span>
        </button>
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

        {/* Last 5 cases for active client */}
        {activeCase && (
          <div style={{ borderBottom: '1px solid var(--lumen-border)' }}>
            <div style={{ padding: '8px 12px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={10} style={{ color: 'var(--lumen-text-muted)' }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase' }}>
                Últimos casos del cliente
              </span>
            </div>
            {clientCases.length === 0 ? (
              <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', padding: '4px 12px 10px', lineHeight: 1.4 }}>Sin casos anteriores.</p>
            ) : clientCases.map((c) => (
              <div key={c.id} style={{ padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--lumen-accent)', fontFamily: 'monospace', margin: 0, marginBottom: 1 }}>{c.case_number}</p>
                  {c.summary && <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', margin: 0 }} className="line-clamp-1">{c.summary}</p>}
                </div>
                <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', margin: 0, flexShrink: 0 }}>
                  {new Date(c.opened_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        )}

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

// ─── Client Selector Panel ────────────────────────────────────────────────────

function ClientSelectorPanel({ onSelect, onClose }) {
  const [query, setQuery]               = useState('');
  const [clients, setClients]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showCreate, setShowCreate]     = useState(false);
  const [newName, setNewName]           = useState('');
  const [newPhone, setNewPhone]         = useState('');
  const [creating, setCreating]         = useState(false);
  // Manual case ID flow
  const [caseIdMode, setCaseIdModeLocal] = useState('auto');
  const [pendingClient, setPendingClient] = useState(null); // client awaiting case ID entry
  const [manualCaseId, setManualCaseId]  = useState('');

  useEffect(() => {
    window.lumen.settings.getCaseIdMode().then((m) => setCaseIdModeLocal(m || 'auto')).catch(() => {});
  }, []);

  const load = useCallback(async (q) => {
    setLoading(true);
    try {
      const res = q?.trim()
        ? await window.lumen.clients.search(q)
        : await window.lumen.clients.getAll();
      setClients(res || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(''); }, []);
  useEffect(() => {
    const t = setTimeout(() => load(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  const handleSelectClient = (client) => {
    if (caseIdMode === 'manual') {
      setPendingClient(client);
      setManualCaseId('');
    } else {
      onSelect(client, null);
    }
  };

  const confirmManualId = () => {
    if (!pendingClient) return;
    onSelect(pendingClient, manualCaseId.trim() || null);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const client = await window.lumen.clients.create({
        name: newName.trim(),
        phones: newPhone.trim() ? [newPhone.trim()] : [],
      });
      handleSelectClient(client);
    } catch {}
    setCreating(false);
  };

  const PANEL_BG = '#13131b';

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 400, maxHeight: '78vh', background: PANEL_BG,
        border: '1px solid var(--lumen-border)', borderRadius: 10,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={13} style={{ color: 'var(--lumen-accent)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lumen-text)' }}>Seleccionar cliente</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', padding: 3 }}>
            <X size={13} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '9px 11px', borderBottom: '1px solid var(--lumen-border)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={11} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--lumen-text-muted)', pointerEvents: 'none' }} />
            <input
              autoFocus
              type="text"
              placeholder="Buscar cliente..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px 7px 28px', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--lumen-border)',
                borderRadius: 6, fontSize: 12, color: 'var(--lumen-text)', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loading ? (
            <div style={{ padding: 20, display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={15} className="animate-spin" style={{ color: 'var(--lumen-text-muted)' }} />
            </div>
          ) : clients.length === 0 ? (
            <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', padding: '16px', textAlign: 'center' }}>
              {query ? 'Sin resultados.' : 'Sin clientes. Crea uno abajo.'}
            </p>
          ) : clients.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectClient(c)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer',
                textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(126,63,242,0.09)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(126,63,242,0.14)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lumen-accent)' }}>
                  {(c.name || '?')[0].toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--lumen-text)', margin: 0, lineHeight: 1.2 }}>
                  {[c.name, c.last_name].filter(Boolean).join(' ')}
                </p>
                {c.company && <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', margin: 0 }}>{c.company}</p>}
              </div>
              {c.external_id && (
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--lumen-text-muted)' }}>{c.external_id}</span>
              )}
            </button>
          ))}
        </div>

        {/* Manual case ID step — overlays the panel when pending client */}
        {pendingClient && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: '#13131b', borderRadius: 10,
            display: 'flex', flexDirection: 'column', padding: '20px 18px', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(126,63,242,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--lumen-accent)' }}>
                  {(pendingClient.name || '?')[0].toUpperCase()}
                </span>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--lumen-text)', margin: 0 }}>
                  {[pendingClient.name, pendingClient.last_name].filter(Boolean).join(' ')}
                </p>
                {pendingClient.company && (
                  <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', margin: 0 }}>{pendingClient.company}</p>
                )}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--lumen-text-muted)', display: 'block', marginBottom: 6 }}>
                Número de caso externo
              </label>
              <input
                autoFocus
                type="text"
                placeholder="Ej. 20240501-0042 (opcional)"
                value={manualCaseId}
                onChange={(e) => setManualCaseId(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmManualId(); if (e.key === 'Escape') setPendingClient(null); }}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '9px 12px', borderRadius: 6, fontSize: 13, fontFamily: 'monospace',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(96,165,250,0.4)',
                  color: 'var(--lumen-text)', outline: 'none',
                }}
              />
              <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', marginTop: 5, lineHeight: 1.4 }}>
                Dejá vacío si no tenés un número externo. Podés cambiarlo después.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => setPendingClient(null)}
                style={{ flex: 1, padding: '8px', borderRadius: 6, fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--lumen-border)', color: 'var(--lumen-text-muted)', cursor: 'pointer' }}
              >
                ← Volver
              </button>
              <button
                onClick={confirmManualId}
                style={{ flex: 2, padding: '8px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'var(--lumen-accent)', border: 'none', color: '#fff' }}
              >
                Abrir caso
              </button>
            </div>
          </div>
        )}

        {/* Create new */}
        <div style={{ borderTop: '1px solid var(--lumen-border)', padding: '10px 12px' }}>
          {!showCreate ? (
            <button
              onClick={() => setShowCreate(true)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                background: 'rgba(126,63,242,0.07)', border: '1px dashed rgba(126,63,242,0.3)',
                color: 'var(--lumen-accent)',
              }}
            >
              <UserPlus size={12} /> Nuevo cliente
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input
                autoFocus
                type="text"
                placeholder="Nombre *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                style={{ padding: '7px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--lumen-border)', borderRadius: 5, fontSize: 12, color: 'var(--lumen-text)', outline: 'none' }}
              />
              <input
                type="text"
                placeholder="Teléfono (opcional)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                style={{ padding: '7px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--lumen-border)', borderRadius: 5, fontSize: 12, color: 'var(--lumen-text)', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => { setShowCreate(false); setNewName(''); setNewPhone(''); }}
                  style={{ flex: 1, padding: '7px', borderRadius: 5, fontSize: 11, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--lumen-border)', color: 'var(--lumen-text-muted)', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                  style={{
                    flex: 2, padding: '7px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: newName.trim() ? 'pointer' : 'default',
                    background: newName.trim() ? 'var(--lumen-accent)' : 'rgba(255,255,255,0.05)',
                    border: 'none', color: newName.trim() ? '#fff' : 'var(--lumen-text-muted)',
                  }}
                >
                  {creating ? 'Creando...' : 'Crear y abrir caso'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Case Hub ─────────────────────────────────────────────────────────────────

function CaseHub({ activeTurn, recentCases, onNewCase, onSearchHistory, onTurnStart, onTurnClose }) {
  const turnActive = activeTurn && !activeTurn.ended_at;

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', padding: '20px 18px', gap: 16 }}>

      {/* Turno indicator */}
      <div style={{
        padding: '12px 14px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12,
        background: turnActive ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${turnActive ? 'rgba(16,185,129,0.2)' : 'var(--lumen-border)'}`,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: turnActive ? '#10b981' : 'var(--lumen-text-muted)', flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: turnActive ? '#10b981' : 'var(--lumen-text-muted)' }}>
              {turnActive ? `Turno #${activeTurn.turn_number} activo` : 'Sin turno activo'}
            </span>
          </div>
          {turnActive && activeTurn.started_at && (
            <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', margin: 0 }}>
              Desde {new Date(activeTurn.started_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              {activeTurn.cases_count > 0 ? ` · ${activeTurn.cases_count} caso${activeTurn.cases_count !== 1 ? 's' : ''}` : ''}
            </p>
          )}
        </div>
        {turnActive ? (
          <button
            onClick={onTurnClose}
            style={{ padding: '4px 11px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', letterSpacing: '0.04em' }}
          >
            Cerrar turno
          </button>
        ) : (
          <button
            onClick={onTurnStart}
            style={{ padding: '4px 11px', borderRadius: 5, fontSize: 10, fontWeight: 600, cursor: 'pointer', background: 'rgba(16,185,129,0.09)', border: '1px solid rgba(16,185,129,0.25)', color: '#10b981' }}
          >
            Iniciar turno
          </button>
        )}
      </div>

      {/* New case CTA */}
      <button
        onClick={onNewCase}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '15px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: 700,
          background: 'rgba(126,63,242,0.12)', border: '1px solid rgba(126,63,242,0.3)',
          color: 'var(--lumen-accent)', transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(126,63,242,0.22)'; e.currentTarget.style.borderColor = 'rgba(126,63,242,0.5)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(126,63,242,0.12)'; e.currentTarget.style.borderColor = 'rgba(126,63,242,0.3)'; }}
      >
        <Plus size={17} />
        Nuevo Caso
      </button>

      {/* Recent cases */}
      {recentCases.length > 0 && (
        <div>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
            Recientes
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recentCases.map((c) => (
              <div key={c.id} style={{
                padding: '8px 11px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 10,
                border: '1px solid var(--lumen-border)', background: 'rgba(255,255,255,0.02)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--lumen-accent)', fontFamily: 'monospace', margin: 0, marginBottom: 1 }}>{c.case_number}</p>
                  <p style={{ fontSize: 10, color: 'var(--lumen-text)', margin: 0 }} className="line-clamp-1">
                    {[c.client_name, c.client_last_name].filter(Boolean).join(' ') || 'Cliente'}
                  </p>
                </div>
                <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)', flexShrink: 0 }}>
                  {new Date(c.opened_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                </span>
                <span style={{
                  fontSize: 8, fontWeight: 700, padding: '2px 6px', borderRadius: 10, letterSpacing: '0.06em', flexShrink: 0,
                  background: c.status === 'open' ? 'rgba(234,179,8,0.14)' : 'rgba(16,185,129,0.10)',
                  color: c.status === 'open' ? '#ca8a04' : '#10b981',
                }}>
                  {c.status === 'open' ? 'ABIERTO' : 'CERRADO'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History search */}
      <button
        onClick={onSearchHistory}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '9px', borderRadius: 6, cursor: 'pointer', fontSize: 11,
          background: 'rgba(255,255,255,0.03)', border: '1px solid var(--lumen-border)',
          color: 'var(--lumen-text-muted)', transition: 'all 0.12s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'var(--lumen-text)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--lumen-text-muted)'; }}
      >
        <Search size={12} />
        Buscar en historial de casos
      </button>
    </div>
  );
}

// ─── Finalize Modal ────────────────────────────────────────────────────────────

function FinalizeModal({ activeCase, activeBranch, onConfirm, onCancel }) {
  const [summary, setSummary] = useState('');
  const [saving, setSaving]   = useState(false);

  const transcript = (() => {
    try { return JSON.parse(localStorage.getItem(`lumen_case_chat_${activeCase?.id}`) || '[]'); }
    catch { return []; }
  })();

  const doConfirm = async (doExport, doCal) => {
    setSaving(true);
    await onConfirm(summary, doExport, doCal);
    setSaving(false);
  };

  const PANEL_BG = '#13131b';
  const clientName = activeCase?.client?.name
    ? [activeCase.client.name, activeCase.client.last_name].filter(Boolean).join(' ')
    : (activeCase?.client_name || 'N/A');

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 470, maxHeight: '86vh', background: PANEL_BG,
        border: '1px solid var(--lumen-border)', borderRadius: 10,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.65)',
      }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--lumen-text)', margin: 0 }}>Finalizar caso</p>
            <p style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--lumen-accent)', margin: 0 }}>{activeCase?.case_number}</p>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', padding: 3 }}>
            <X size={13} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
          {/* Meta */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, padding: '9px 11px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--lumen-border)' }}>
              <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Cliente</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--lumen-text)', margin: 0 }}>{clientName}</p>
            </div>
            {activeBranch && (
              <div style={{ flex: 1, padding: '9px 11px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--lumen-border)' }}>
                <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Rama usada</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: activeBranch.color || 'var(--lumen-accent)', margin: 0 }}>{activeBranch.name}</p>
              </div>
            )}
          </div>

          {/* Summary */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--lumen-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 5 }}>
              Resumen del caso
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe qué ocurrió y cómo se resolvió..."
              rows={4}
              style={{
                width: '100%', padding: '8px 10px', resize: 'vertical', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--lumen-border)',
                borderRadius: 6, fontSize: 12, color: 'var(--lumen-text)', outline: 'none',
                fontFamily: 'inherit', lineHeight: 1.55,
              }}
            />
          </div>

          {/* Transcript preview */}
          {transcript.length > 0 && (
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--lumen-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5 }}>
                Chat con LU ({transcript.length} mensajes)
              </p>
              <div style={{ maxHeight: 110, overflowY: 'auto', padding: '7px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)', borderRadius: 6 }}>
                {transcript.slice(0, 6).map((m, i) => (
                  <p key={i} style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 3, color: 'var(--lumen-text-muted)' }}>
                    <strong style={{ color: m.role === 'user' ? 'var(--lumen-accent)' : '#10b981' }}>
                      {m.role === 'user' ? 'Ag' : 'LU'}:
                    </strong>{' '}
                    {m.text?.slice(0, 90)}{m.text?.length > 90 ? '…' : ''}
                  </p>
                ))}
                {transcript.length > 6 && <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', margin: 0 }}>+{transcript.length - 6} mensajes más</p>}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '11px 14px', borderTop: '1px solid var(--lumen-border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => doConfirm(false, false)}
              disabled={saving}
              style={{ flex: 1, padding: '8px 6px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(126,63,242,0.14)', border: '1px solid rgba(126,63,242,0.3)', color: 'var(--lumen-accent)' }}
            >
              Guardar en LUMEN
            </button>
            <button
              onClick={() => doConfirm(true, false)}
              disabled={saving}
              style={{ flex: 1, padding: '8px 6px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--lumen-border)', color: 'var(--lumen-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
            >
              <FileText size={11} /> + Exportar .txt
            </button>
            <button
              onClick={() => doConfirm(true, true)}
              disabled={saving}
              style={{ flex: 1, padding: '8px 6px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--lumen-border)', color: 'var(--lumen-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
            >
              <CalendarDays size={11} /> + Calendario
            </button>
          </div>
          <button
            onClick={onCancel}
            style={{ padding: '7px', borderRadius: 5, fontSize: 11, cursor: 'pointer', background: 'none', border: '1px solid var(--lumen-border)', color: 'var(--lumen-text-muted)' }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── History Modal ─────────────────────────────────────────────────────────────

function HistoryModal({ onClose, onViewDetail }) {
  const [filters, setFilters] = useState({ query: '', clientName: '', dateFrom: '', dateTo: '' });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (f) => {
    setLoading(true);
    try {
      const res = await window.lumen.cases.search({
        query:      f.query,
        clientName: f.clientName,
        dateFrom:   f.dateFrom,
        dateTo:     f.dateTo,
      });
      setResults(res || []);
    } catch { setResults([]); }
    setLoading(false);
  }, []);

  useEffect(() => { search(filters); }, []);

  const set = (key, val) => setFilters((prev) => ({ ...prev, [key]: val }));

  const PANEL_BG = '#13131b';

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 560, maxHeight: '86vh', background: PANEL_BG,
        border: '1px solid var(--lumen-border)', borderRadius: 10,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.65)',
      }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={13} style={{ color: 'var(--lumen-accent)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lumen-text)' }}>Historial de casos</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', padding: 3 }}>
            <X size={13} />
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '9px 11px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Nº caso o texto…"
            value={filters.query}
            onChange={(e) => set('query', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search(filters)}
            style={{ flex: 2, minWidth: 110, padding: '6px 9px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--lumen-border)', borderRadius: 5, fontSize: 11, color: 'var(--lumen-text)', outline: 'none' }}
          />
          <input
            type="text"
            placeholder="Nombre cliente…"
            value={filters.clientName}
            onChange={(e) => set('clientName', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search(filters)}
            style={{ flex: 2, minWidth: 110, padding: '6px 9px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--lumen-border)', borderRadius: 5, fontSize: 11, color: 'var(--lumen-text)', outline: 'none' }}
          />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => set('dateFrom', e.target.value)}
            style={{ flex: 1, minWidth: 110, padding: '6px 9px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--lumen-border)', borderRadius: 5, fontSize: 11, color: 'var(--lumen-text)', outline: 'none' }}
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => set('dateTo', e.target.value)}
            style={{ flex: 1, minWidth: 110, padding: '6px 9px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--lumen-border)', borderRadius: 5, fontSize: 11, color: 'var(--lumen-text)', outline: 'none' }}
          />
          <button
            onClick={() => search(filters)}
            style={{ padding: '6px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer', background: 'var(--lumen-accent)', border: 'none', color: '#fff' }}
          >
            Buscar
          </button>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 30, display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={16} className="animate-spin" style={{ color: 'var(--lumen-text-muted)' }} />
            </div>
          ) : results.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--lumen-text-muted)', padding: '24px', textAlign: 'center' }}>Sin resultados.</p>
          ) : results.map((c) => (
            <button
              key={c.id}
              onClick={() => onViewDetail(c)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                background: 'none', border: 'none', borderBottom: '1px solid var(--lumen-border)',
                cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(126,63,242,0.06)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lumen-accent)', fontFamily: 'monospace' }}>{c.case_number}</span>
                  <span style={{
                    fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 8,
                    background: c.status === 'open' ? 'rgba(234,179,8,0.12)' : 'rgba(16,185,129,0.10)',
                    color: c.status === 'open' ? '#ca8a04' : '#10b981',
                  }}>
                    {c.status === 'open' ? 'ABIERTO' : 'CERRADO'}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--lumen-text)', margin: 0, marginBottom: 1 }}>
                  {[c.client_name, c.client_last_name].filter(Boolean).join(' ') || '—'}
                </p>
                {c.summary && (
                  <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', margin: 0 }} className="line-clamp-1">{c.summary}</p>
                )}
              </div>
              <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', margin: 0, flexShrink: 0 }}>
                {new Date(c.opened_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Case Detail Modal ─────────────────────────────────────────────────────────

function CaseDetailModal({ caseData, onClose }) {
  const transcript = (() => {
    try {
      if (caseData.chat_transcript) {
        const parsed = JSON.parse(caseData.chat_transcript);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    try { return JSON.parse(localStorage.getItem(`lumen_case_chat_${caseData.id}`) || '[]'); }
    catch { return []; }
  })();

  const PANEL_BG = '#13131b';

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 70,
      background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 500, maxHeight: '88vh', background: PANEL_BG,
        border: '1px solid var(--lumen-border)', borderRadius: 10,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,0.70)',
      }}>
        <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--lumen-text)', margin: 0, fontFamily: 'monospace' }}>{caseData.case_number}</p>
            <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', margin: 0 }}>
              {caseData.opened_at ? new Date(caseData.opened_at).toLocaleString('es-ES') : ''}
              {caseData.closed_at ? ` → ${new Date(caseData.closed_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}` : ' · Abierto'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => exportCaseAsTxt(caseData, caseData.summary, transcript, caseData.branch_name ? { name: caseData.branch_name } : null)}
              title="Exportar .txt"
              style={{ padding: '5px 10px', borderRadius: 5, fontSize: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--lumen-border)', color: 'var(--lumen-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <FileText size={10} /> .txt
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', padding: 3 }}>
              <X size={13} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Client + Branch */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, padding: '9px 11px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)' }}>
              <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Cliente</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--lumen-text)', margin: 0 }}>
                {[caseData.client_name, caseData.client_last_name].filter(Boolean).join(' ') || 'N/A'}
              </p>
            </div>
            {caseData.branch_name && (
              <div style={{ flex: 1, padding: '9px 11px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)' }}>
                <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Rama</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--lumen-accent)', margin: 0 }}>{caseData.branch_name}</p>
              </div>
            )}
          </div>

          {/* Summary */}
          {caseData.summary ? (
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--lumen-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Resumen</p>
              <p style={{ fontSize: 12, color: 'var(--lumen-text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)', borderRadius: 6, margin: 0 }}>
                {caseData.summary}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', fontStyle: 'italic' }}>Sin resumen registrado.</p>
          )}

          {/* Transcript */}
          {transcript.length > 0 ? (
            <div>
              <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--lumen-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                Conversación con LU ({transcript.length} mensajes)
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {transcript.map((m, i) => (
                  <div key={i} style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%', padding: '7px 10px', borderRadius: 6, fontSize: 11, lineHeight: 1.5,
                    background: m.role === 'user' ? 'rgba(126,63,242,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${m.role === 'user' ? 'rgba(126,63,242,0.22)' : 'var(--lumen-border)'}`,
                    color: 'var(--lumen-text)',
                  }}>
                    {m.text}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', fontStyle: 'italic' }}>Sin conversación registrada.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AC3({ navigateTo: onNavigate, onCaseChange }) {
  const [branches, setBranches]         = useState([]);
  const [activeBranch, setActiveBranch] = useState(null);
  const [textTemplates, setTextTemplates]   = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [speeches, setSpeeches]         = useState([]);
  const [calEvents, setCalEvents]       = useState([]);
  const [calLoading, setCalLoading]     = useState(false);
  const [topPolicies, setTopPolicies]   = useState([]);
  const [showContacts, setShowContacts] = useState(false);

  // ── Case / Turn state ────────────────────────────────────
  const [activeCase, setActiveCase]             = useState(null);
  const [activeTurn, setActiveTurn]             = useState(null);
  const [clientCases, setClientCases]           = useState([]);
  const [recentCases, setRecentCases]           = useState([]);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal]   = useState(false);
  const [showHistoryModal, setShowHistoryModal]     = useState(false);
  const [caseDetailData, setCaseDetailData]         = useState(null);
  const [elapsedTime, setElapsedTime]               = useState('00:00');
  const caseStartRef = useRef(null);

  // ── Panel resize, collapse & dock ────────────────────────
  const [tplWidth,   startTplDrag]   = useResize(230, 140, 380, 'lumen_ac3_tpl_w');
  const [spWidth,    startSpDrag]    = useResize(220, 140, 380, 'lumen_ac3_sp_w');
  const [rightWidth, startRightDrag] = useResize(260, 180, 420, 'lumen_ac3_right_w');
  const [tplCollapsed,   toggleTpl]   = useCollapsed('lumen_ac3_tpl_c');
  const [spCollapsed,    toggleSp]    = useCollapsed('lumen_ac3_sp_c');
  const [rightCollapsed, toggleRight] = useCollapsed('lumen_ac3_right_c');

  const [tplDock,   setTplDock]   = useDock('lumen_ac3_tpl_dock',   'left');
  const [spDock,    setSpDock]    = useDock('lumen_ac3_sp_dock',    'left');
  const [rightDock, setRightDock] = useDock('lumen_ac3_right_dock', 'right');

  const [tplH,   startTplHDrag]   = useResizeH(200, 120, 400, 'lumen_ac3_tpl_h');
  const [spH,    startSpHDrag]    = useResizeH(200, 120, 400, 'lumen_ac3_sp_h');
  const [rightH, startRightHDrag] = useResizeH(220, 120, 400, 'lumen_ac3_right_h');

  const loadAll = useCallback(async () => {
    try {
      const [br, tt, et, pol, sp] = await Promise.all([
        window.lumen.ac3.branches.getAll(),
        window.lumen.ac3.textTemplates.getAll(),
        window.lumen.ac3.emailTemplates.getAll(),
        window.lumen.policies.getAll(),
        window.lumen.ac3.speeches.getAll(),
      ]);
      setBranches(br || []);
      setTextTemplates(tt || []);
      setEmailTemplates(et || []);
      setTopPolicies((pol || []).slice(0, 5));
      setSpeeches(sp || []);
    } catch (e) { console.error('AC3 load error', e); }
  }, []);

  const loadCalEvents = useCallback(async () => {
    setCalLoading(true);
    try { setCalEvents(await window.lumen.calendar.getEvents(14) || []); }
    catch { setCalEvents([]); }
    finally { setCalLoading(false); }
  }, []);

  useEffect(() => { loadAll(); loadCalEvents(); }, []);

  // Load active turn + recent cases on mount
  useEffect(() => {
    window.lumen.turns.getActive().then((t) => setActiveTurn(t || null)).catch(() => {});
    window.lumen.cases.search({}).then((r) => setRecentCases((r || []).slice(0, 5))).catch(() => {});
  }, []);

  // Timer for active case
  useEffect(() => {
    if (!activeCase) { setElapsedTime('00:00'); return; }
    caseStartRef.current = new Date(activeCase.opened_at || Date.now());
    const tick = () => {
      const diff = Date.now() - caseStartRef.current.getTime();
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setElapsedTime(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeCase]);

  // Load last 5 cases for active client
  useEffect(() => {
    if (activeCase?.client_id) {
      window.lumen.cases.getLastForClient(activeCase.client_id, 5)
        .then((r) => setClientCases(r || []))
        .catch(() => setClientCases([]));
    } else {
      setClientCases([]);
    }
  }, [activeCase]);

  // Open a case for the selected client
  const openCase = useCallback(async (client, externalId) => {
    try {
      let turn = activeTurn;
      if (!turn || turn.ended_at) {
        turn = await window.lumen.turns.create();
        setActiveTurn(turn);
      }
      const caseData = { client_id: client.id, turn_id: turn.id };
      if (externalId) caseData.external_id = externalId;
      const newCase = await window.lumen.cases.create(caseData);
      setActiveCase({ ...newCase, client_id: client.id, client });
      onCaseChange?.(newCase.id);
      setShowClientSelector(false);
    } catch (e) { console.error('openCase error', e); }
  }, [activeTurn, onCaseChange]);

  // Finalize and close the active case
  const finalizeCase = useCallback(async (summary, doExport, doCal) => {
    if (!activeCase) return;
    const transcript = (() => {
      try { return JSON.parse(localStorage.getItem(`lumen_case_chat_${activeCase.id}`) || '[]'); }
      catch { return []; }
    })();
    const durationSeconds = Math.floor(
      (Date.now() - new Date(activeCase.opened_at || Date.now()).getTime()) / 1000
    );
    try {
      await window.lumen.cases.close(activeCase.id, {
        duration_seconds: durationSeconds,
        branch_id:        activeBranch?.id   || null,
        branch_name:      activeBranch?.name || '',
        chat_transcript:  transcript,
        summary,
      });
      if (doExport) exportCaseAsTxt(activeCase, summary, transcript, activeBranch);
      if (doCal) {
        try {
          await window.lumen.ac3.pushToCalendar(
            { title: `Caso ${activeCase.case_number}`, notes: summary },
            `${activeCase.case_number} — ${activeCase.client?.name || 'Cliente'}`,
            null
          );
        } catch {}
      }
      setActiveCase(null);
      setActiveBranch(null);
      onCaseChange?.(null);
      setShowFinalizeModal(false);
      window.lumen.cases.search({}).then((r) => setRecentCases((r || []).slice(0, 5))).catch(() => {});
    } catch (e) { console.error('finalizeCase error', e); }
  }, [activeCase, activeBranch, onCaseChange]);

  const visibleEmails = activeBranch
    ? emailTemplates.filter((e) => e.branch_id === activeBranch.id || !e.branch_id)
    : emailTemplates.filter((e) => !e.branch_id);

  const navigate = onNavigate || (() => {});

  // Helper: absolute drag-handle style on the right edge of a panel wrapper
  const dragHandleStyle = (side = 'right') => ({
    position: 'absolute',
    [side]: -3,
    top: 0, bottom: 0,
    width: 6, cursor: 'col-resize', zIndex: 20,
    background: 'transparent',
    transition: 'background 0.15s',
  });

  // ── Helpers to render each panel in its dock zone ──────────
  const DRAG_HOVER = (e, on) => { e.currentTarget.style.background = on ? 'rgba(126,63,242,0.45)' : 'transparent'; };

  // Renders Templates in its docked position (left/right/bottom handled by caller)
  const tplPanel = (
    tplCollapsed
      ? <CollapsedStrip key="tpl-strip" label="Plantillas" side={tplDock === 'right' ? 'right' : 'left'} onExpand={toggleTpl} />
      : <div key="tpl-panel" style={{ width: tplDock !== 'bottom' ? tplWidth : '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', [tplDock === 'right' ? 'borderLeft' : 'borderRight']: '1px solid var(--lumen-border)' }}>
          <TemplatesPanel templates={textTemplates} onCollapse={toggleTpl} dockPos={tplDock} onDock={setTplDock} />
          <div onMouseDown={(e) => startTplDrag(e, tplDock === 'right' ? -1 : 1)} style={dragHandleStyle(tplDock === 'right' ? 'left' : 'right')}
            onMouseEnter={(e) => DRAG_HOVER(e, true)} onMouseLeave={(e) => DRAG_HOVER(e, false)} />
        </div>
  );

  const spPanel = (
    spCollapsed
      ? <CollapsedStrip key="sp-strip" label="Speeches" side={spDock === 'right' ? 'right' : 'left'} onExpand={toggleSp} />
      : <div key="sp-panel" style={{ width: spDock !== 'bottom' ? spWidth : '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', [spDock === 'right' ? 'borderLeft' : 'borderRight']: '1px solid var(--lumen-border)' }}>
          <SpeechesPanel speeches={speeches} onCollapse={toggleSp} dockPos={spDock} onDock={setSpDock} />
          <div onMouseDown={(e) => startSpDrag(e, spDock === 'right' ? -1 : 1)} style={dragHandleStyle(spDock === 'right' ? 'left' : 'right')}
            onMouseEnter={(e) => DRAG_HOVER(e, true)} onMouseLeave={(e) => DRAG_HOVER(e, false)} />
        </div>
  );

  const rightPanel = (
    rightCollapsed
      ? <CollapsedStrip key="right-strip" label="Info" side={rightDock === 'left' ? 'left' : 'right'} onExpand={toggleRight} />
      : <div key="right-panel" style={{ width: rightDock !== 'bottom' ? rightWidth : '100%', flexShrink: 0, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', [rightDock === 'left' ? 'borderRight' : 'borderLeft']: '1px solid var(--lumen-border)' }}>
          <div onMouseDown={(e) => startRightDrag(e, rightDock === 'left' ? 1 : -1)} style={dragHandleStyle(rightDock === 'left' ? 'right' : 'left')}
            onMouseEnter={(e) => DRAG_HOVER(e, true)} onMouseLeave={(e) => DRAG_HOVER(e, false)} />
          <RightPanel activeBranch={activeBranch} emailTemplates={visibleEmails} calEvents={calEvents} calLoading={calLoading}
            onCalRefresh={loadCalEvents} topPolicies={topPolicies} onNavigate={navigate}
            onOpenContacts={() => setShowContacts(true)} onCollapse={toggleRight}
            activeCase={activeCase} clientCases={clientCases} dockPos={rightDock} onDock={setRightDock} />
        </div>
  );

  // Separate panels by dock position
  const leftPanels  = [tplDock === 'left'   && tplPanel,   spDock === 'left'   && spPanel,   rightDock === 'left'   && rightPanel].filter(Boolean);
  const rightPanels = [tplDock === 'right'  && tplPanel,   spDock === 'right'  && spPanel,   rightDock === 'right'  && rightPanel].filter(Boolean);
  const bottomPanels = [tplDock === 'bottom' && tplPanel,   spDock === 'bottom' && spPanel,   rightDock === 'bottom' && rightPanel].filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', overflow: 'hidden', background: 'var(--lumen-bg)' }}>

      {/* ── Main row: left | center | right ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Left-docked panels */}
        {leftPanels}

      {/* CENTER — CaseHub / Active case / Decision Wizard */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden', position: 'relative' }}>

        {/* Header */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Cpu size={13} style={{ color: 'var(--lumen-text-secondary)' }} />
          <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--lumen-text)', margin: 0 }}>
            Decisiones
          </h2>
          {activeCase ? (
            <>
              <span style={{ color: 'var(--lumen-border)', fontSize: 14 }}>/</span>
              <span style={{ fontSize: 11, color: 'var(--lumen-accent)', fontFamily: 'monospace', fontWeight: 700 }}>{activeCase.case_number}</span>
              <span style={{ fontSize: 11, color: 'var(--lumen-text-muted)' }}>
                {activeCase.client ? [activeCase.client.name, activeCase.client.last_name].filter(Boolean).join(' ') : ''}
              </span>
              {activeBranch && (
                <>
                  <span style={{ color: 'var(--lumen-border)', fontSize: 14 }}>/</span>
                  <span style={{ fontSize: 11, color: activeBranch.color || 'var(--lumen-accent)', fontWeight: 600 }}>{activeBranch.name}</span>
                </>
              )}
            </>
          ) : null}
          <div style={{ flex: 1 }} />
          {activeCase ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 20, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Clock size={10} style={{ color: '#10b981' }} />
                <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#10b981', fontWeight: 700 }}>{elapsedTime}</span>
              </div>
              <button
                onClick={() => setShowFinalizeModal(true)}
                style={{ padding: '4px 12px', borderRadius: 5, fontSize: 10, fontWeight: 700, cursor: 'pointer', background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', letterSpacing: '0.04em' }}
              >
                Finalizar
              </button>
            </div>
          ) : null}
        </div>

        {/* Body */}
        {activeCase ? (
          activeBranch ? (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <DecisionWizard branch={activeBranch} onBack={() => setActiveBranch(null)} />
            </div>
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
              {branches.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', opacity: 0.55 }}>
                  <GitBranch size={36} style={{ color: 'var(--lumen-text-muted)', marginBottom: 14 }} />
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: 6 }}>Sin ramas configuradas</p>
                  <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                    Ve a <strong>Configuración → Árbol de Decisiones</strong><br />para crear tus ramas.
                  </p>
                  <button
                    onClick={() => navigate('settings')}
                    style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 20, fontSize: 12, background: 'rgba(126,63,242,0.15)', border: '1px dashed rgba(126,63,242,0.4)', color: 'var(--lumen-accent)', cursor: 'pointer' }}
                  >
                    <Settings size={14} /> Ir a Configuración
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>
                    Selecciona una rama para este caso
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                    {branches.map((br, idx) => (
                      <BranchCard key={br.id} branch={br} index={idx} onClick={() => setActiveBranch(br)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        ) : (
          <CaseHub
            activeTurn={activeTurn}
            recentCases={recentCases}
            onNewCase={() => setShowClientSelector(true)}
            onSearchHistory={() => setShowHistoryModal(true)}
            onTurnStart={async () => {
              try { const t = await window.lumen.turns.create(); setActiveTurn(t); } catch {}
            }}
            onTurnClose={async () => {
              if (!activeTurn) return;
              try {
                await window.lumen.turns.close(activeTurn.id, 'Turno cerrado manualmente');
                setActiveTurn(null);
              } catch {}
            }}
          />
        )}

        {/* Overlays inside CENTER (position: absolute) */}
        {showClientSelector && (
          <ClientSelectorPanel onSelect={openCase} onClose={() => setShowClientSelector(false)} />
        )}
        {showFinalizeModal && activeCase && (
          <FinalizeModal
            activeCase={activeCase}
            activeBranch={activeBranch}
            onConfirm={finalizeCase}
            onCancel={() => setShowFinalizeModal(false)}
          />
        )}
        {showHistoryModal && !caseDetailData && (
          <HistoryModal
            onClose={() => setShowHistoryModal(false)}
            onViewDetail={(c) => setCaseDetailData(c)}
          />
        )}
        {caseDetailData && (
          <CaseDetailModal
            caseData={caseDetailData}
            onClose={() => setCaseDetailData(null)}
          />
        )}
      </div>

        {/* Right-docked panels */}
        {rightPanels}

        {/* Contacts panel — slide-in drawer */}
        {showContacts && (
          <ContactsPanel onClose={() => setShowContacts(false)} />
        )}
      </div>

      {/* ── Bottom-docked panels ── */}
      {bottomPanels.length > 0 && (
        <div style={{ display: 'flex', borderTop: '1px solid var(--lumen-border)', flexShrink: 0 }}>
          {bottomPanels.map((panel, i) => {
            // Each bottom panel gets a height-controlled wrapper with top drag handle
            const [panelH, startHDrag] = i === 0
              ? [tplH, startTplHDrag]
              : i === 1
              ? [spH, startSpHDrag]
              : [rightH, startRightHDrag];
            return (
              <div key={i} style={{ flex: 1, height: panelH, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', borderRight: i < bottomPanels.length - 1 ? '1px solid var(--lumen-border)' : 'none' }}>
                {/* Top drag handle */}
                <div
                  onMouseDown={startHDrag}
                  style={{ position: 'absolute', top: -3, left: 0, right: 0, height: 6, cursor: 'row-resize', zIndex: 20, background: 'transparent', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(126,63,242,0.45)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                />
                {panel}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
