import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Plus, Save, Check, Loader2, RefreshCw } from 'lucide-react';

const NODE_W  = 256;
const NODE_H  = 370; // approximate height for connection midpoint calculations
// Connection: source exits right side of node, enters left side of target
function srcPoint(node) {
  return { x: node.x + NODE_W, y: node.y + NODE_H / 2 };
}
function dstPoint(node) {
  return { x: node.x, y: node.y + NODE_H / 2 };
}

let _seq = 0;
const uid = () => `n${Date.now()}${++_seq}`;

function findRoots(nodes) {
  const pointed = new Set(
    nodes.flatMap(n => (n.options || []).map(o => o.next_node_id).filter(Boolean))
  );
  return nodes.filter(n => !pointed.has(n.id));
}

// Horizontal tree layout: root left, children right
function autoLayout(nodes) {
  if (!nodes.length) return [];
  const roots = findRoots(nodes);
  if (!roots.length) {
    return nodes.map((n, i) => ({ ...n, x: 80 + Math.floor(i / 3) * 320, y: 80 + (i % 3) * 420 }));
  }
  const GAP_X = 320; // horizontal gap between levels
  const GAP_Y = 420; // vertical gap between siblings

  function subtreeH(id, seen = new Set()) {
    if (seen.has(id)) return 1;
    seen.add(id);
    const n = nodes.find(x => x.id === id);
    if (!n) return 1;
    const ch = (n.options || []).filter(o => o.next_node_id).map(o => o.next_node_id);
    return ch.length ? ch.reduce((s, c) => s + subtreeH(c, new Set(seen)), 0) : 1;
  }

  const pos = {};
  function place(id, x, cy, seen = new Set()) {
    if (seen.has(id)) return;
    seen.add(id);
    pos[id] = { x, y: cy - NODE_H / 2 };
    const n = nodes.find(x => x.id === id);
    if (!n) return;
    const ch = (n.options || []).filter(o => o.next_node_id).map(o => o.next_node_id);
    if (!ch.length) return;
    const th = ch.reduce((s, c) => s + subtreeH(c) * GAP_Y, 0) - GAP_Y;
    let ty = cy - th / 2;
    ch.forEach(c => {
      const h = subtreeH(c) * GAP_Y;
      place(c, x + GAP_X, ty + h / 2, new Set(seen));
      ty += h;
    });
  }

  let ry = 300;
  roots.forEach(r => {
    const h = subtreeH(r.id) * GAP_Y;
    place(r.id, 60, ry + h / 2);
    ry += h + GAP_Y;
  });

  return nodes.map(n => ({ ...n, x: pos[n.id]?.x ?? (n.x ?? 60), y: pos[n.id]?.y ?? (n.y ?? 60) }));
}

function assignHierarchicalIds(nodes) {
  const roots = findRoots(nodes);
  if (!roots.length) return nodes;
  const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const map = {};

  function walk(id, hid, seen = new Set()) {
    if (seen.has(id)) return;
    seen.add(id);
    map[id] = hid;
    const n = nodes.find(x => x.id === id);
    if (!n) return;
    (n.options || []).filter(o => o.next_node_id).forEach((o, i) => {
      if (!map[o.next_node_id]) walk(o.next_node_id, `${hid}.${i + 1}`, new Set(seen));
    });
  }

  roots.forEach((r, i) => walk(r.id, LETTERS[i] || `N${i}`));

  return nodes.map(n => ({
    ...n,
    id: map[n.id] || n.id,
    options: (n.options || []).map(o => ({
      ...o,
      next_node_id: o.next_node_id ? (map[o.next_node_id] || o.next_node_id) : null,
    })),
  }));
}

export default function BranchCanvas({ branch, onClose, onSaved }) {
  const [nodes, setNodes]           = useState(() => {
    const raw = Array.isArray(branch.nodes) ? branch.nodes : [];
    return raw.map(n => ({ ...n, x: n.x ?? 80, y: n.y ?? 80 }));
  });
  const [color]                     = useState(branch.color || '#7E3FF2');
  const [connecting, setConnecting] = useState(null); // { nodeId, optId }
  const [dirty, setDirty]           = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [pan, setPan]               = useState({ x: 0, y: 0 });
  const [reloading, setReloading]   = useState(false);

  const dragRef  = useRef(null); // { nodeId, sx, sy, ox, oy }
  const panRef   = useRef(null); // { sx, sy, ox, oy }
  const movedRef = useRef(false);
  const canvasRef = useRef(null);
  const nodesRef  = useRef(nodes);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);

  const mark = () => { setDirty(true); setSaved(false); };

  const reloadFromDB = async () => {
    setReloading(true);
    try {
      const all = await window.lumen.ac3.branches.getAll();
      const fresh = all.find(b => b.id === branch.id);
      if (fresh) {
        const freshNodes = (Array.isArray(fresh.nodes) ? fresh.nodes : []).map(n => ({ ...n, x: n.x ?? 80, y: n.y ?? 80 }));
        setNodes(freshNodes);
        setDirty(false);
        onSaved?.(fresh);
      }
    } catch { /* silent */ } finally { setReloading(false); }
  };

  // Listen for /admin apply events from LU chat
  useEffect(() => {
    const onBranchUpdated = (e) => {
      if (e.detail?.id === branch.id) reloadFromDB();
    };
    window.addEventListener('lumen:branch-updated', onBranchUpdated);
    return () => window.removeEventListener('lumen:branch-updated', onBranchUpdated);
  }, [branch.id]);

  // Global mouse + keyboard handlers
  useEffect(() => {
    const onMove = (e) => {
      if (dragRef.current) {
        movedRef.current = true;
        const { nodeId, sx, sy, ox, oy } = dragRef.current;
        setNodes(p => p.map(n => n.id === nodeId ? { ...n, x: ox + (e.clientX - sx), y: oy + (e.clientY - sy) } : n));
      } else if (panRef.current) {
        const { sx, sy, ox, oy } = panRef.current;
        setPan({ x: ox + (e.clientX - sx), y: oy + (e.clientY - sy) });
      }
    };
    const onUp = () => {
      if (movedRef.current) setDirty(true);
      movedRef.current = false;
      dragRef.current = null;
      panRef.current = null;
    };
    const onKey = (e) => { if (e.key === 'Escape') setConnecting(null); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const startNodeDrag = (e, nodeId) => {
    e.stopPropagation();
    const node = nodesRef.current.find(n => n.id === nodeId);
    if (!node) return;
    dragRef.current = { nodeId, sx: e.clientX, sy: e.clientY, ox: node.x, oy: node.y };
  };

  const startPan = (e) => {
    if (e.button !== 0) return;
    if (connecting) { setConnecting(null); return; }
    panRef.current = { sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
  };

  const addNode = () => {
    const canvas = canvasRef.current;
    const cx = canvas ? canvas.clientWidth / 2 : 500;
    const cy = canvas ? canvas.clientHeight / 2 : 300;
    setNodes(p => [...p, {
      id: uid(), question: '', speech: '', instructions: '', options: [],
      x: cx - pan.x - NODE_W / 2,
      y: cy - pan.y - 100,
    }]);
    mark();
  };

  const updateNode = (id, changes) => {
    setNodes(p => p.map(n => n.id === id ? { ...n, ...changes } : n));
    mark();
  };

  const deleteNode = (id) => {
    setNodes(p => {
      const rest = p.filter(n => n.id !== id);
      return rest.map(n => ({
        ...n,
        options: (n.options || []).map(o => o.next_node_id === id ? { ...o, next_node_id: null } : o),
      }));
    });
    if (connecting?.nodeId === id) setConnecting(null);
    mark();
  };

  const addOption = (nodeId) => {
    setNodes(p => p.map(n => n.id === nodeId
      ? { ...n, options: [...(n.options || []), { id: uid(), label: 'Opción', next_node_id: null }] }
      : n
    ));
    mark();
  };

  const updateOption = (nodeId, optId, changes) => {
    setNodes(p => p.map(n => n.id === nodeId
      ? { ...n, options: (n.options || []).map(o => o.id === optId ? { ...o, ...changes } : o) }
      : n
    ));
    mark();
  };

  const deleteOption = (nodeId, optId) => {
    setNodes(p => p.map(n => n.id === nodeId
      ? { ...n, options: (n.options || []).filter(o => o.id !== optId) }
      : n
    ));
    mark();
  };

  const handleConnect = (e, nodeId, optId) => {
    e.stopPropagation();
    setConnecting(prev =>
      prev?.nodeId === nodeId && prev?.optId === optId ? null : { nodeId, optId }
    );
  };

  const handleNodeClick = (e, nodeId) => {
    if (!connecting) return;
    e.stopPropagation();
    if (connecting.nodeId === nodeId) { setConnecting(null); return; }
    updateOption(connecting.nodeId, connecting.optId, { next_node_id: nodeId });
    setConnecting(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalNodes = assignHierarchicalIds(nodes);
      const updated = await window.lumen.ac3.branches.update(branch.id, { ...branch, color, nodes: finalNodes });
      setNodes(finalNodes);
      setDirty(false);
      setSaved(true);
      onSaved?.(updated);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      alert('Error al guardar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAutoLayout = () => { setNodes(p => autoLayout(p)); mark(); };

  const pointed = useMemo(() =>
    new Set(nodes.flatMap(n => (n.options || []).map(o => o.next_node_id).filter(Boolean))),
    [nodes]
  );
  const isRoot     = id => !pointed.has(id);
  const isTerminal = id => {
    const n = nodes.find(x => x.id === id);
    return n && (n.options || []).every(o => !o.next_node_id);
  };

  // SVG horizontal bezier paths (left → right)
  const paths = useMemo(() => {
    const result = [];
    nodes.forEach(node => {
      (node.options || []).forEach((opt) => {
        if (!opt.next_node_id) return;
        const target = nodes.find(n => n.id === opt.next_node_id);
        if (!target) return;
        const s = srcPoint(node);
        const d = dstPoint(target);
        const dx = Math.max(Math.abs(d.x - s.x) * 0.45, 60);
        result.push({
          key: `${node.id}-${opt.id}`,
          d: `M${s.x},${s.y} C${s.x + dx},${s.y} ${d.x - dx},${d.y} ${d.x},${d.y}`,
        });
      });
    });
    return result;
  }, [nodes]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0c0c10', display: 'flex', flexDirection: 'column',
      fontFamily: 'var(--lumen-font, Inter, sans-serif)',
    }}>

      {/* ── Toolbar ── */}
      <div style={{
        height: 52, flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10,
        background: '#111116',
      }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>{branch.name}</span>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Editor de árbol
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>
          {nodes.length} nodo{nodes.length !== 1 ? 's' : ''}
        </span>
        <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
        <button
          onClick={reloadFromDB}
          disabled={reloading}
          title="Recargar desde base de datos (útil tras usar /admin en LU)"
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 5, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.45)', fontSize: 11, cursor: reloading ? 'wait' : 'pointer' }}
        >
          <RefreshCw size={11} className={reloading ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={handleAutoLayout}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 5, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.55)', fontSize: 11, cursor: 'pointer' }}
        >
          ⊞ Organizar árbol
        </button>
        <button
          onClick={addNode}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 5, background: 'rgba(126,63,242,0.13)', border: '1px solid rgba(126,63,242,0.35)', color: '#a78bfa', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
        >
          <Plus size={12} /> Nuevo nodo
        </button>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 5, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', color: '#10b981', fontSize: 11, cursor: saving ? 'wait' : 'pointer', fontWeight: 600 }}
          >
            {saving ? <Loader2 size={11} className="animate-spin" /> : saved ? <Check size={11} /> : <Save size={11} />}
            {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar cambios'}
          </button>
        )}
        {!dirty && saved && (
          <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={11} /> Guardado
          </span>
        )}
        <button
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 5, background: 'transparent', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer' }}
        >
          <X size={12} /> Cerrar
        </button>
      </div>

      {/* ── Canvas ── */}
      <div
        ref={canvasRef}
        onMouseDown={startPan}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          cursor: connecting ? 'crosshair' : 'default',
          background: '#0c0c10',
        }}
      >
        {/* Dot grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x % 24}px ${pan.y % 24}px`,
        }} />

        {/* Pan layer */}
        <div style={{ position: 'absolute', left: pan.x, top: pan.y }}>

          {/* SVG connections */}
          <svg style={{ position: 'absolute', overflow: 'visible', pointerEvents: 'none', left: 0, top: 0, width: 1, height: 1 }}>
            <defs>
              <marker id="bc-arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="rgba(126,63,242,0.7)" />
              </marker>
            </defs>
            {paths.map(p => (
              <path key={p.key} d={p.d} stroke="rgba(126,63,242,0.38)" strokeWidth={1.5} fill="none" markerEnd="url(#bc-arr)" />
            ))}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const root  = isRoot(node.id);
            const term  = isTerminal(node.id);
            const isTarget = !!connecting && connecting.nodeId !== node.id;
            return (
              <div
                key={node.id}
                onClick={e => handleNodeClick(e, node.id)}
                style={{
                  position: 'absolute', left: node.x, top: node.y, width: NODE_W,
                  background: '#14141c',
                  border: isTarget
                    ? '1.5px solid rgba(96,165,250,0.55)'
                    : `1.5px solid ${root ? color : 'rgba(255,255,255,0.1)'}`,
                  borderTop: `3px solid ${root ? color : term ? '#3B82F6' : 'rgba(255,255,255,0.13)'}`,
                  borderRadius: 8,
                  boxShadow: isTarget
                    ? '0 0 0 3px rgba(96,165,250,0.1), 0 6px 30px rgba(0,0,0,0.6)'
                    : '0 4px 24px rgba(0,0,0,0.55)',
                  cursor: connecting ? 'pointer' : 'default',
                  transition: 'border-color 0.12s, box-shadow 0.12s',
                }}
              >
                {/* Drag handle header */}
                <div
                  onMouseDown={e => startNodeDrag(e, node.id)}
                  style={{
                    padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'move', userSelect: 'none',
                    background: root ? `${color}12` : 'transparent',
                    borderRadius: '6px 6px 0 0',
                  }}
                >
                  <span style={{
                    fontSize: 8, fontWeight: 700,
                    color: root ? color : term ? '#3B82F6' : 'rgba(255,255,255,0.28)',
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                  }}>
                    {root ? '⬡ Raíz' : term ? '■ Terminal' : '◇ Decisión'}
                  </span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.04em' }}>⠿</span>
                  <button
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); deleteNode(node.id); }}
                    style={{ padding: '1px 5px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.45)', borderRadius: 3, fontSize: 11, lineHeight: 1 }}
                  >✕</button>
                </div>

                {/* Fields */}
                <div style={{ padding: '10px 10px 8px' }} onMouseDown={e => e.stopPropagation()}>

                  <label style={FIELD_LABEL}>Pregunta central</label>
                  <textarea
                    value={node.question || ''}
                    onChange={e => updateNode(node.id, { question: e.target.value })}
                    rows={2}
                    placeholder="¿Cuál es el problema?"
                    style={{ ...TA_BASE, fontWeight: 600, fontSize: 12 }}
                  />

                  <label style={{ ...FIELD_LABEL, color: 'rgba(167,139,250,0.7)', marginTop: 8 }}>Sugerencia al cliente</label>
                  <textarea
                    value={node.speech || ''}
                    onChange={e => updateNode(node.id, { speech: e.target.value })}
                    rows={2}
                    placeholder="Texto para enviar al cliente…"
                    style={{ ...TA_BASE, background: 'rgba(126,63,242,0.05)', border: '1px solid rgba(126,63,242,0.13)' }}
                  />

                  <label style={{ ...FIELD_LABEL, color: 'rgba(96,165,250,0.65)', marginTop: 8 }}>Para ti (interno)</label>
                  <textarea
                    value={node.instructions || ''}
                    onChange={e => updateNode(node.id, { instructions: e.target.value })}
                    rows={2}
                    placeholder="Qué verificar, en qué fijarte…"
                    style={{ ...TA_BASE, background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.11)' }}
                  />

                  {/* Options */}
                  <div style={{ marginTop: 10 }}>
                    <label style={FIELD_LABEL}>Opciones del cliente</label>
                    {(node.options || []).map(opt => {
                      const isConn  = connecting?.nodeId === node.id && connecting?.optId === opt.id;
                      const hasConn = !!opt.next_node_id;
                      const tgt     = hasConn ? nodes.find(n => n.id === opt.next_node_id) : null;
                      return (
                        <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, flexShrink: 0, width: 14, textAlign: 'center' }}>○</span>
                          <input
                            value={opt.label || ''}
                            onChange={e => updateOption(node.id, opt.id, { label: e.target.value })}
                            placeholder="Opción…"
                            style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '4px 7px', color: '#fff', fontSize: 11, outline: 'none', fontFamily: 'inherit', minWidth: 0 }}
                          />
                          {hasConn ? (
                            <button
                              onClick={() => updateOption(node.id, opt.id, { next_node_id: null })}
                              title={`Conectado a: "${tgt?.question || opt.next_node_id}". Clic para desconectar.`}
                              style={BTN_CONNECTED}
                            >✓</button>
                          ) : (
                            <button
                              onClick={e => handleConnect(e, node.id, opt.id)}
                              title="Conectar a otro nodo"
                              style={{ ...BTN_CONNECT_IDLE, ...(isConn ? BTN_CONNECT_ACTIVE : {}) }}
                            >→</button>
                          )}
                          <button
                            onClick={() => deleteOption(node.id, opt.id)}
                            style={{ width: 18, height: 18, borderRadius: 3, background: 'none', border: 'none', color: 'rgba(239,68,68,0.38)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}
                          >✕</button>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => addOption(node.id)}
                      style={{ width: '100%', marginTop: 2, padding: '4px 0', borderRadius: 4, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.28)', cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' }}
                    >+ agregar opción</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {nodes.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, pointerEvents: 'none' }}>
            <div style={{ fontSize: 54, opacity: 0.1 }}>◇</div>
            <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
              Canvas vacío<br />
              Presiona <strong style={{ color: 'rgba(126,63,242,0.55)' }}>Nuevo nodo</strong> para empezar
            </p>
          </div>
        )}

        {/* Connecting mode banner */}
        {connecting && (
          <div style={{
            position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)',
            padding: '8px 20px',
            background: 'rgba(126,63,242,0.18)', border: '1px solid rgba(126,63,242,0.45)',
            borderRadius: 20, color: '#a78bfa', fontSize: 12,
            pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            Haz clic en el nodo destino &nbsp;·&nbsp; <span style={{ opacity: 0.6 }}>ESC para cancelar</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Style constants ───────────────────────────────────────────────────────────

const FIELD_LABEL = {
  fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.32)',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  display: 'block', marginBottom: 3,
};

const TA_BASE = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 5, padding: '6px 8px',
  color: 'rgba(255,255,255,0.88)', fontSize: 11,
  resize: 'vertical', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.45,
};

const BTN_CONNECTED = {
  width: 24, height: 24, borderRadius: 4,
  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
  color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 12, flexShrink: 0,
};

const BTN_CONNECT_IDLE = {
  width: 24, height: 24, borderRadius: 4,
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
  color: 'rgba(255,255,255,0.38)', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', fontSize: 13, flexShrink: 0, transition: 'all 0.12s',
};

const BTN_CONNECT_ACTIVE = {
  background: 'rgba(126,63,242,0.22)',
  border: '1px solid rgba(126,63,242,0.6)',
  color: '#a78bfa',
};
