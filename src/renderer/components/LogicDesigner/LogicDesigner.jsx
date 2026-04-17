/**
 * LUMEN — No-Code Logic Designer  (SpaceX Stealth Aesthetic)
 * Canvas drag-and-drop para diseñar flujos del Motor AC3.
 * Nodos: Inicio · Decisión · Acción · Arsenal
 * Conexiones SVG Bezier · Draft / Publicar
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  GitBranch, Plus, Trash2, Save, Play,
  ChevronLeft, X, Check, Zap, HelpCircle,
  CheckSquare, Circle, RotateCcw,
} from 'lucide-react';

// ─── Palette ──────────────────────────────────────────────────────────────────

const PALETTE = {
  start:    { label: 'Inicio',   color: '#7E3FF2', border: 'rgba(126,63,242,0.4)', glass: 'rgba(126,63,242,0.06)', w: 110, h: 44 },
  decision: { label: 'Decisión', color: '#60a5fa', border: 'rgba(96,165,250,0.35)', glass: 'rgba(59,130,246,0.05)', w: 224, h: 82 },
  action:   { label: 'Acción',   color: '#34d399', border: 'rgba(52,211,153,0.35)', glass: 'rgba(16,185,129,0.05)', w: 204, h: 66 },
  arsenal:  { label: 'Arsenal',  color: '#fbbf24', border: 'rgba(251,191,36,0.35)', glass: 'rgba(245,158,11,0.05)', w: 204, h: 66 },
};

const HANDLE_COLOR = { out: '#6b7280', yes: '#34d399', no: '#f87171', in: '#6b7280' };
const OUTPUT_H     = { start: ['out'], decision: ['yes', 'no'], action: ['out'], arsenal: [] };
const INPUT_H      = { start: [], decision: ['in'], action: ['in'], arsenal: ['in'] };

// ─── Geometry ─────────────────────────────────────────────────────────────────

function nodeHandles(n) {
  const p  = PALETTE[n.type];
  const cx = n.x + p.w / 2;
  const cy = n.y + p.h / 2;
  switch (n.type) {
    case 'start':    return { out: { x: cx,        y: n.y + p.h } };
    case 'decision': return { in: { x: cx, y: n.y }, yes: { x: n.x + p.w, y: cy }, no: { x: cx, y: n.y + p.h } };
    case 'action':   return { in: { x: cx, y: n.y }, out: { x: cx, y: n.y + p.h } };
    case 'arsenal':  return { in: { x: cx, y: n.y } };
    default:         return {};
  }
}

function bezier(x1, y1, x2, y2) {
  const cp = Math.max(55, Math.abs(y2 - y1) * 0.55);
  return `M ${x1} ${y1} C ${x1} ${y1 + cp} ${x2} ${y2 - cp} ${x2} ${y2}`;
}

// ─── SVG arrow defs ───────────────────────────────────────────────────────────

const ARROW_DEFS = (
  <defs>
    {[...Object.keys(HANDLE_COLOR), 'temp'].map((k) => (
      <marker key={k} id={`arr-${k}`} viewBox="0 0 10 10"
        refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
        <path d="M 0 1 L 9 5 L 0 9 z"
          fill={k === 'temp' ? '#7E3FF2' : (HANDLE_COLOR[k] || '#6b7280')} />
      </marker>
    ))}
  </defs>
);

// ─── Connection SVG ───────────────────────────────────────────────────────────

function ConnLine({ conn, nodes, selected, onClick }) {
  const src = nodes.find((n) => n.id === conn.fromId);
  const tgt = nodes.find((n) => n.id === conn.toId);
  if (!src || !tgt) return null;
  const sh = nodeHandles(src)[conn.fromHandle];
  const th = nodeHandles(tgt)[conn.toHandle];
  if (!sh || !th) return null;
  const col   = HANDLE_COLOR[conn.fromHandle] || '#6b7280';
  const midX  = (sh.x + th.x) / 2;
  const midY  = (sh.y + th.y) / 2;
  const label = conn.fromHandle === 'yes' ? 'Sí' : conn.fromHandle === 'no' ? 'No' : null;

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <path d={bezier(sh.x, sh.y, th.x, th.y)} fill="none" stroke="transparent" strokeWidth={14} />
      <path d={bezier(sh.x, sh.y, th.x, th.y)} fill="none"
        stroke={selected ? '#9B5BFF' : col}
        strokeWidth={selected ? 2.5 : 1.5}
        opacity={0.8}
        markerEnd={`url(#arr-${conn.fromHandle})`} />
      {label && (
        <g transform={`translate(${midX},${midY})`}>
          <rect x={-14} y={-10} width={28} height={20} rx={10}
            fill={label === 'Sí' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)'}
            stroke={label === 'Sí' ? '#34d399' : '#f87171'} strokeWidth={1} />
          <text textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={700}
            fill={label === 'Sí' ? '#34d399' : '#f87171'}>{label}</text>
        </g>
      )}
    </g>
  );
}

// ─── Node component ───────────────────────────────────────────────────────────

function FlowNode({ node, selected, connecting, onMouseDown, onHandleDown, onHandleClick }) {
  const p  = PALETTE[node.type];
  const hs = nodeHandles(node);
  const dimmed = connecting && connecting.fromId !== node.id;

  return (
    <div
      onMouseDown={(e) => onMouseDown(e, node.id)}
      style={{
        position: 'absolute',
        left: node.x, top: node.y,
        width: p.w, height: p.h,
        background: selected
          ? `rgba(126,63,242,0.1)`
          : p.glass,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${selected ? 'rgba(126,63,242,0.6)' : p.border}`,
        borderRadius: node.type === 'start' ? 22 : 12,
        boxShadow: selected
          ? `0 0 0 2px rgba(126,63,242,0.25), 0 4px 20px rgba(0,0,0,0.5)`
          : `0 2px 12px rgba(0,0,0,0.4)`,
        cursor: 'grab',
        userSelect: 'none',
        opacity: dimmed ? 0.3 : 1,
        transition: 'opacity 0.15s, box-shadow 0.15s',
        zIndex: selected ? 10 : 2,
      }}
    >
      {/* ── Node body ── */}
      {node.type === 'start' && (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
          <Circle size={11} style={{ color: p.color }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: p.color, letterSpacing: '0.08em' }}>INICIO</span>
        </div>
      )}

      {node.type === 'decision' && (
        <div style={{ padding: '9px 12px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
            <HelpCircle size={10} style={{ color: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Decisión</span>
          </div>
          <p style={{ margin: 0, fontSize: 11.5, color: node.question ? '#e8e8ed' : '#3a3a50', lineHeight: 1.4, wordBreak: 'break-word' }}>
            {node.question || 'Sin pregunta...'}
          </p>
        </div>
      )}

      {node.type === 'action' && (
        <div style={{ padding: '9px 12px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <CheckSquare size={10} style={{ color: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Acción</span>
          </div>
          <p style={{ margin: 0, fontSize: 11.5, color: node.text ? '#e8e8ed' : '#3a3a50', lineHeight: 1.4, wordBreak: 'break-word' }}>
            {node.text || 'Sin texto...'}
          </p>
        </div>
      )}

      {node.type === 'arsenal' && (
        <div style={{ padding: '9px 12px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <Zap size={10} style={{ color: p.color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Arsenal</span>
          </div>
          <p style={{ margin: 0, fontSize: 11.5, color: node.scriptRef ? '#e8e8ed' : '#3a3a50', lineHeight: 1.4, wordBreak: 'break-word' }}>
            {node.scriptRef || 'Sin script...'}
          </p>
        </div>
      )}

      {/* ── Handles ── */}
      {Object.entries(hs).map(([hk, hp]) => {
        const isOut  = OUTPUT_H[node.type]?.includes(hk);
        const isIn   = INPUT_H[node.type]?.includes(hk);
        const active = isIn && !!connecting;

        return (
          <div key={hk}
            onMouseDown={(e) => { e.stopPropagation(); if (isOut) onHandleDown(e, node.id, hk); }}
            onClick={(e)     => { e.stopPropagation(); if (isIn && connecting) onHandleClick(node.id, hk); }}
            style={{
              position: 'absolute',
              left: hp.x - node.x - 6, top: hp.y - node.y - 6,
              width: 12, height: 12, borderRadius: '50%',
              background: active ? '#7E3FF2' : HANDLE_COLOR[hk] || '#6b7280',
              border: '1.5px solid rgba(0,0,0,0.6)',
              cursor: isOut ? 'crosshair' : (active ? 'pointer' : 'default'),
              zIndex: 20,
              boxShadow: active ? '0 0 0 4px rgba(126,63,242,0.3)' : 'none',
              transition: 'box-shadow 0.15s, background 0.15s',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Properties panel ─────────────────────────────────────────────────────────

function PropsPanel({ node, onChange, onDelete, onClose }) {
  const [vals, setVals] = useState({ question: node.question || '', text: node.text || '', scriptRef: node.scriptRef || '' });
  const p = PALETTE[node.type];

  useEffect(() => {
    setVals({ question: node.question || '', text: node.text || '', scriptRef: node.scriptRef || '' });
  }, [node.id]);

  const update = (key, val) => {
    const next = { ...vals, [key]: val };
    setVals(next);
    onChange({ ...node, ...next });
  };

  const inputStyle = {
    width: '100%', background: 'rgba(17,17,24,0.9)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10, padding: '8px 10px', color: '#e8e8ed', fontSize: 12, outline: 'none',
    boxSizing: 'border-box', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5,
    transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      position: 'absolute', right: 14, top: 54, width: 248, zIndex: 60,
      background: 'rgba(16,16,22,0.92)',
      backdropFilter: 'blur(24px) saturate(1.4)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      padding: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14, gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: '#e8e8ed', flex: 1 }}>{p.label}</span>
        <button onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#5a5a6e', lineHeight: 0 }}>
          <X size={13} />
        </button>
      </div>

      {/* Fields */}
      {node.type === 'decision' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#5a5a6e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Pregunta
          </label>
          <textarea rows={3} value={vals.question}
            onChange={(e) => update('question', e.target.value)}
            placeholder="¿Presentó comprobante?"
            style={inputStyle} />
        </div>
      )}

      {node.type === 'action' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#5a5a6e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Acción a realizar
          </label>
          <textarea rows={3} value={vals.text}
            onChange={(e) => update('text', e.target.value)}
            placeholder="Solicitar comprobante al residente..."
            style={inputStyle} />
        </div>
      )}

      {node.type === 'arsenal' && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: '#5a5a6e', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
            Referencia de script
          </label>
          <input type="text" value={vals.scriptRef}
            onChange={(e) => update('scriptRef', e.target.value)}
            placeholder="script_multa_pago"
            style={inputStyle} />
          <p style={{ fontSize: 10, color: '#3a3a50', marginTop: 6, lineHeight: 1.4 }}>
            ID del script que ejecutará el Motor AC3 al llegar a este nodo.
          </p>
        </div>
      )}

      {node.type === 'start' && (
        <p style={{ fontSize: 12, color: '#5a5a6e', marginBottom: 12 }}>
          Nodo de entrada del flujo. Conéctalo al primer nodo de decisión.
        </p>
      )}

      <button onClick={onDelete}
        style={{
          width: '100%', padding: '8px 0', background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10,
          color: '#f87171', fontSize: 12, fontWeight: 500, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}>
        <Trash2 size={12} /> Eliminar nodo
      </button>
    </div>
  );
}

// ─── Flow list (home screen) ───────────────────────────────────────────────────

function FlowList({ flows, onCreate, onOpen, onDelete }) {
  const [newName,   setNewName]   = useState('');
  const [creating,  setCreating]  = useState(false);

  const submit = async () => {
    if (!newName.trim()) return;
    await onCreate(newName.trim());
    setNewName('');
    setCreating(false);
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="bento-card mb-4 flex items-center justify-between">
        <div className="module-header">
          <div className="module-icon" style={{ background: 'rgba(126,63,242,0.08)' }}>
            <GitBranch size={22} style={{ color: 'var(--lumen-accent)' }} />
          </div>
          <div>
            <h2>Diseñador de Lógica</h2>
            <p>Flujos No-Code para el Motor AC3</p>
          </div>
        </div>
        <button onClick={() => setCreating(true)} className="btn-accent">
          <Plus size={15} /> Nuevo flujo
        </button>
      </div>

      {/* New flow input */}
      {creating && (
        <div className="bento-card mb-3">
          <p className="text-xs font-medium mb-3" style={{ color: 'var(--lumen-text-secondary)' }}>
            Nombre del flujo
          </p>
          <div className="flex gap-2">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') setCreating(false); }}
              className="dark-input flex-1" placeholder="Ej: Flujo de Pagos" autoFocus />
            <button onClick={submit} disabled={!newName.trim()} className="btn-accent !py-2 !px-3">
              <Check size={14} />
            </button>
            <button onClick={() => setCreating(false)} className="btn-ghost !py-2 !px-3">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Flow list */}
      {flows.length === 0 && !creating ? (
        <div className="bento-card flex flex-col items-center justify-center py-16">
          <GitBranch size={42} strokeWidth={1} style={{ color: 'var(--lumen-text-muted)' }} className="mb-3" />
          <p className="text-[13px]" style={{ color: 'var(--lumen-text-secondary)' }}>
            No hay flujos. Crea el primero.
          </p>
          <p className="text-[11px] mt-1 text-center max-w-xs" style={{ color: 'var(--lumen-text-muted)' }}>
            Diseña árboles de decisión visuales que el Motor AC3 seguirá para resolver casos.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {flows.map((flow) => {
            const nodeCount = (() => { try { return JSON.parse(flow.nodes || '[]').length; } catch { return 0; } })();
            const pub = flow.status === 'published';

            return (
              <button key={flow.id} onClick={() => onOpen(flow)}
                className="bento-card interactive w-full text-left group"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(126,63,242,0.08)' }}>
                    <GitBranch size={17} style={{ color: 'var(--lumen-accent)' }} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--lumen-text)' }}>{flow.name}</p>
                    <p className="text-[11px]" style={{ color: 'var(--lumen-text-muted)' }}>
                      {nodeCount} nodo{nodeCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                    background: pub ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
                    color: pub ? '#34d399' : '#fbbf24',
                    border: `1px solid ${pub ? 'rgba(52,211,153,0.25)' : 'rgba(251,191,36,0.25)'}`,
                  }}>
                    {pub ? '● Publicado' : '○ Borrador'}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(flow.id); }}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: '#f87171' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Canvas editor ────────────────────────────────────────────────────────────

function FlowEditor({ flow: init, onBack, onFlowUpdated }) {
  const [nodes,       setNodes]       = useState(() => { try { return JSON.parse(init.nodes || '[]'); } catch { return []; } });
  const [conns,       setConns]       = useState(() => { try { return JSON.parse(init.connections || '[]'); } catch { return []; } });
  const [selected,    setSelected]    = useState(null);
  const [connecting,  setConnecting]  = useState(null);
  const [pan,         setPan]         = useState({ x: 80, y: 80 });
  const [scale,       setScale]       = useState(1);
  const [flowName,    setFlowName]    = useState(init.name);
  const [status,      setStatus]      = useState(init.status || 'draft');
  const [savedMsg,    setSavedMsg]    = useState('');
  const [saving,      setSaving]      = useState(false);

  const canvasRef  = useRef(null);
  const panRef     = useRef(null);
  const dragRef    = useRef(null);
  const historyRef = useRef([]);   // undo stack

  // Push to undo history
  const pushHistory = () => {
    historyRef.current = [...historyRef.current.slice(-20), { nodes: [...nodes], conns: [...conns] }];
  };

  const undo = () => {
    const prev = historyRef.current.pop();
    if (!prev) return;
    setNodes(prev.nodes);
    setConns(prev.conns);
    setSelected(null);
  };

  // Screen → canvas coords
  const toCanvas = useCallback((sx, sy) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: (sx - r.left - pan.x) / scale, y: (sy - r.top - pan.y) / scale };
  }, [pan, scale]);

  // Add node at canvas center
  const addNode = (type) => {
    const r  = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0, width: 800, height: 500 };
    const p  = PALETTE[type];
    const cc = toCanvas(r.left + r.width / 2, r.top + r.height / 2);
    const id = `n-${Date.now()}`;
    pushHistory();
    setNodes((prev) => [...prev, {
      id, type,
      x: cc.x - p.w / 2, y: cc.y - p.h / 2,
      ...(type === 'decision' ? { question: '' }  : {}),
      ...(type === 'action'   ? { text: '' }       : {}),
      ...(type === 'arsenal'  ? { scriptRef: '' }  : {}),
    }]);
    setSelected(id);
  };

  // Node drag
  const onNodeDown = (e, id) => {
    e.stopPropagation();
    if (connecting) { setConnecting(null); return; }
    const n = nodes.find((x) => x.id === id);
    setSelected(id);
    dragRef.current = { id, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y };
  };

  // Canvas pan
  const onCanvasDown = (e) => {
    const tag = e.target.tagName;
    if (tag !== 'DIV' && tag !== 'svg' && tag !== 'SVG') return;
    if (connecting) { setConnecting(null); return; }
    setSelected(null);
    panRef.current = { sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
  };

  const onMouseMove = (e) => {
    if (dragRef.current) {
      const dx = (e.clientX - dragRef.current.sx) / scale;
      const dy = (e.clientY - dragRef.current.sy) / scale;
      setNodes((p) => p.map((n) => n.id === dragRef.current.id
        ? { ...n, x: dragRef.current.ox + dx, y: dragRef.current.oy + dy }
        : n));
    } else if (panRef.current) {
      setPan({ x: panRef.current.ox + (e.clientX - panRef.current.sx), y: panRef.current.oy + (e.clientY - panRef.current.sy) });
    }
    if (connecting) {
      const pos = toCanvas(e.clientX, e.clientY);
      setConnecting((c) => ({ ...c, tx: pos.x, ty: pos.y }));
    }
  };

  const onMouseUp = () => { dragRef.current = null; panRef.current = null; };

  const onWheel = (e) => {
    e.preventDefault();
    setScale((s) => Math.max(0.3, Math.min(2.2, +(s + (e.deltaY > 0 ? -0.07 : 0.07)).toFixed(2))));
  };

  // Handle connection start
  const onHandleDown = (e, id, hk) => {
    e.preventDefault();
    const pos = toCanvas(e.clientX, e.clientY);
    setConnecting({ fromId: id, fromHandle: hk, tx: pos.x, ty: pos.y });
    setSelected(null);
  };

  // Handle connection complete
  const onHandleClick = (toId, toHandle) => {
    if (!connecting || connecting.fromId === toId) { setConnecting(null); return; }
    const exists = conns.some((c) => c.fromId === connecting.fromId && c.fromHandle === connecting.fromHandle);
    if (!exists) {
      pushHistory();
      setConns((p) => [...p, { id: `c-${Date.now()}`, fromId: connecting.fromId, fromHandle: connecting.fromHandle, toId, toHandle }]);
    }
    setConnecting(null);
  };

  // Delete selected
  const deleteSel = () => {
    if (!selected) return;
    pushHistory();
    if (selected.startsWith('n-')) {
      setNodes((p) => p.filter((n) => n.id !== selected));
      setConns((p) => p.filter((c) => c.fromId !== selected && c.toId !== selected));
    } else {
      setConns((p) => p.filter((c) => c.id !== selected));
    }
    setSelected(null);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSel();
      if (e.key === 'Escape') { setConnecting(null); setSelected(null); }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [selected, nodes, conns]);

  // Save
  const save = async (newStatus) => {
    setSaving(true);
    const s = newStatus || status;
    try {
      await window.lumen.logic.save(init.id, { name: flowName, description: init.description || '', nodes, connections: conns, status: s });
      setStatus(s);
      setSavedMsg(s === 'published' ? '¡Publicado y activo!' : 'Guardado');
      onFlowUpdated?.();
      setTimeout(() => setSavedMsg(''), 2500);
    } finally { setSaving(false); }
  };

  const selNode = nodes.find((n) => n.id === selected);
  const pub     = status === 'published';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 88px)', minHeight: 500, background: '#000000' }}>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', flexShrink: 0, zIndex: 40,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px) saturate(1.2)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Back */}
        <button onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#5a5a6e', padding: '4px 8px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, transition: 'color 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e8e8ed'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#5a5a6e'; }}>
          <ChevronLeft size={14} /> Flujos
        </button>

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.05)' }} />

        {/* Flow name */}
        <input value={flowName} onChange={(e) => setFlowName(e.target.value)}
          style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 600, color: '#e8e8ed', minWidth: 100 }} />

        {/* Status badge */}
        <span style={{
          padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700,
          background: pub ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.08)',
          color: pub ? '#34d399' : '#fbbf24',
          border: `1px solid ${pub ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}`,
        }}>
          {pub ? '● Publicado' : '○ Borrador'}
        </span>

        {savedMsg && (
          <span style={{ fontSize: 11, color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={11} /> {savedMsg}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Zoom indicator */}
        <span style={{ fontSize: 10, color: '#3a3a50', fontFamily: 'monospace', marginRight: 4 }}>
          {Math.round(scale * 100)}%
        </span>

        {/* Undo */}
        <button onClick={undo} title="Deshacer (Ctrl+Z)"
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, cursor: 'pointer', padding: '5px 8px', color: '#5a5a6e', display: 'flex' }}>
          <RotateCcw size={13} />
        </button>

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.05)' }} />

        {/* Node palette */}
        {[
          { type: 'start',    icon: <Circle size={11} /> },
          { type: 'decision', icon: <HelpCircle size={11} /> },
          { type: 'action',   icon: <CheckSquare size={11} /> },
          { type: 'arsenal',  icon: <Zap size={11} /> },
        ].map(({ type, icon }) => (
          <button key={type} onClick={() => addNode(type)} title={`Agregar ${PALETTE[type].label}`}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
              background: `${PALETTE[type].glass}`, border: `1px solid ${PALETTE[type].border}`,
              borderRadius: 9, cursor: 'pointer', fontSize: 11, fontWeight: 500, color: PALETTE[type].color,
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(255,255,255,0.04)`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = PALETTE[type].glass; }}>
            {icon} {PALETTE[type].label}
          </button>
        ))}

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.05)' }} />

        {/* Save */}
        <button onClick={() => save('draft')} disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 9, cursor: 'pointer', fontSize: 12, color: '#8b8b9e', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#e8e8ed'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8b8b9e'; }}>
          <Save size={12} /> Guardar
        </button>

        {/* Publish */}
        <button onClick={() => save('published')} disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px',
            background: 'linear-gradient(135deg, #7E3FF2 0%, #9B5BFF 100%)',
            border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'white',
            boxShadow: '0 2px 12px rgba(126,63,242,0.35)', transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(126,63,242,0.5)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(126,63,242,0.35)'; }}>
          <Play size={12} /> Publicar
        </button>
      </div>

      {/* ── Canvas ── */}
      <div ref={canvasRef}
        onMouseDown={onCanvasDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onWheel={onWheel}
        style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          cursor: connecting ? 'crosshair' : 'default',
          background: '#000000',
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)
          `,
          backgroundSize: '28px 28px',
        }}>

        {/* Transformed layer */}
        <div style={{ position: 'absolute', inset: 0, transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})`, transformOrigin: '0 0' }}>
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
            {ARROW_DEFS}
            {conns.map((c) => (
              <ConnLine key={c.id} conn={c} nodes={nodes} selected={selected === c.id}
                onClick={() => setSelected(c.id)} />
            ))}
            {/* Temp line */}
            {connecting?.tx !== undefined && (() => {
              const src = nodes.find((n) => n.id === connecting.fromId);
              if (!src) return null;
              const sh = nodeHandles(src)[connecting.fromHandle];
              if (!sh) return null;
              return (
                <path d={bezier(sh.x, sh.y, connecting.tx, connecting.ty)}
                  fill="none" stroke="#7E3FF2" strokeWidth={1.5} strokeDasharray="6 3"
                  opacity={0.65} markerEnd="url(#arr-temp)"
                  style={{ pointerEvents: 'none' }} />
              );
            })()}
          </svg>

          {nodes.map((n) => (
            <FlowNode key={n.id} node={n} selected={selected === n.id}
              connecting={connecting}
              onMouseDown={onNodeDown}
              onHandleDown={onHandleDown}
              onHandleClick={onHandleClick} />
          ))}
        </div>

        {/* Props panel (outside transform) */}
        {selNode && (
          <PropsPanel
            node={selNode}
            onChange={(upd) => setNodes((p) => p.map((n) => n.id === upd.id ? upd : n))}
            onDelete={deleteSel}
            onClose={() => setSelected(null)} />
        )}

        {/* Empty hint */}
        {nodes.length === 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <GitBranch size={52} strokeWidth={0.8} style={{ color: 'rgba(126,63,242,0.12)', marginBottom: 14 }} />
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.12)', textAlign: 'center', lineHeight: 1.7 }}>
              Agrega nodos desde la barra superior<br />
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.07)' }}>
                Arrastra para mover · Scroll para zoom · Del para eliminar · Ctrl+Z deshacer
              </span>
            </p>
          </div>
        )}

        {/* Connecting hint */}
        {connecting && (
          <div style={{
            position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(126,63,242,0.12)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(126,63,242,0.3)', borderRadius: 20,
            padding: '5px 16px', fontSize: 11, color: '#9B5BFF', pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}>
            Haz clic en la entrada ● de otro nodo &nbsp;·&nbsp; Escape para cancelar
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function LogicDesigner() {
  const [flows,      setFlows]      = useState([]);
  const [active,     setActive]     = useState(null);
  const [loading,    setLoading]    = useState(true);

  const load = async () => {
    const data = await window.lumen.logic.getAll();
    setFlows(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onCreate = async (name) => {
    const flow = await window.lumen.logic.create({ name });
    await load();
    setActive(flow);
  };

  const onDelete = async (id) => {
    if (!confirm('¿Eliminar este flujo?')) return;
    await window.lumen.logic.delete(id);
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: 'rgba(126,63,242,0.2)', borderTopColor: 'var(--lumen-accent)' }} />
      </div>
    );
  }

  if (active) {
    return (
      <FlowEditor
        flow={active}
        onBack={() => { setActive(null); load(); }}
        onFlowUpdated={load} />
    );
  }

  return (
    <FlowList
      flows={flows}
      onCreate={onCreate}
      onOpen={setActive}
      onDelete={onDelete} />
  );
}
