import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cpu, Plus, Copy, Check, ChevronDown, ChevronUp, ChevronLeft,
  Trash2, Edit3, Save, X, CalendarDays, Loader2, RefreshCw,
  Settings, Users, AlertTriangle, Mail, GitBranch, ArrowDown,
  Circle, Diamond, Flag, Send, MessageSquare, BookOpen,
  Tag, Layers,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const TEMPLATE_CATEGORIES = [
  { id: 'saludo',         label: 'SALUDO',              color: '#4ade80' },
  { id: 'preguntas',      label: 'PREGUNTAS DE SONDEO', color: '#60a5fa' },
  { id: 'confirmacion',   label: 'CONFIRMACIÓN',        color: '#a78bfa' },
  { id: 'disculpa',       label: 'DISCULPA',            color: '#f87171' },
  { id: 'agradecimiento', label: 'AGRADECIMIENTO',      color: '#fbbf24' },
  { id: 'ausencia',       label: 'AUSENCIA',            color: '#94a3b8' },
  { id: 'tarjeta',        label: 'TARJETA DE ACCESO',   color: '#fb923c' },
  { id: 'reembolso',      label: 'REEMBOLSO',           color: '#34d399' },
  { id: 'configuraciones',label: 'CONFIGURACIONES',     color: '#e879f9' },
  { id: 'despedida',      label: 'DESPEDIDA',           color: '#38bdf8' },
];

const BRANCH_COLORS = [
  '#7E3FF2', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#84CC16',
];

const NODE_TYPES = [
  { id: 'paso',      label: 'Paso',        Icon: Circle,  color: '#60a5fa' },
  { id: 'decision',  label: 'Decisión',    Icon: Diamond, color: '#fbbf24' },
  { id: 'accion',    label: 'Acción',      Icon: Layers,  color: '#4ade80' },
  { id: 'escalacion',label: 'Escalación',  Icon: AlertTriangle, color: '#f87171' },
  { id: 'fin',       label: 'Fin',         Icon: Flag,    color: '#94a3b8' },
];

function makeNodeId() {
  return `n${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Small helpers ─────────────────────────────────────────────────────────────

function toast(msg, setMsg) {
  setMsg(msg);
  setTimeout(() => setMsg(''), 2000);
}

// ─── Templates Panel (left column) ────────────────────────────────────────────

function TemplatesPanel({ templates, onUpdate, onDelete, onCreate }) {
  const [expandedCats, setExpandedCats]   = useState(() => new Set(['saludo']));
  const [copying, setCopying]             = useState(null);
  const [editingId, setEditingId]         = useState(null);
  const [editContent, setEditContent]     = useState('');
  const [editTitle, setEditTitle]         = useState('');
  const [addingCat, setAddingCat]         = useState(null);
  const [newTitle, setNewTitle]           = useState('');
  const [newContent, setNewContent]       = useState('');

  const toggleCat = (id) => setExpandedCats((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const copyText = async (t) => {
    try { await navigator.clipboard.writeText(t.content); } catch {}
    setCopying(t.id);
    setTimeout(() => setCopying(null), 1500);
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditContent(t.content);
  };

  const saveEdit = async (t) => {
    await onUpdate(t.id, { ...t, title: editTitle, content: editContent });
    setEditingId(null);
  };

  const handleAdd = async (cat) => {
    if (!newTitle.trim()) return;
    await onCreate({ category: cat.id, title: newTitle.trim(), content: newContent.trim(), order_idx: 99 });
    setAddingCat(null); setNewTitle(''); setNewContent('');
  };

  return (
    <div style={{
      width: 230, flexShrink: 0, display: 'flex', flexDirection: 'column',
      borderRight: '1px solid var(--lumen-border)', overflowY: 'auto', background: 'rgba(255,255,255,0.01)',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--lumen-border)' }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase' }}>
          Plantillas de texto
        </span>
      </div>

      {TEMPLATE_CATEGORIES.map((cat) => {
        const catTemplates = templates.filter((t) => t.category === cat.id);
        const isOpen = expandedCats.has(cat.id);
        return (
          <div key={cat.id} style={{ borderBottom: '1px solid var(--lumen-border)' }}>
            {/* Category header */}
            <button
              onClick={() => toggleCat(cat.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--lumen-text-secondary)', textTransform: 'uppercase' }}>
                  {cat.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--lumen-text-muted)' }}>{catTemplates.length}</span>
                {isOpen ? <ChevronUp size={10} style={{ color: 'var(--lumen-text-muted)' }} /> : <ChevronDown size={10} style={{ color: 'var(--lumen-text-muted)' }} />}
              </div>
            </button>

            {isOpen && (
              <div style={{ padding: '0 8px 6px' }}>
                {catTemplates.map((t) => (
                  <div key={t.id} style={{
                    marginBottom: 4, borderRadius: 5, border: '1px solid var(--lumen-border)',
                    background: 'rgba(255,255,255,0.02)',
                  }}>
                    {editingId === t.id ? (
                      <div style={{ padding: '8px' }}>
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          style={{
                            width: '100%', background: 'transparent', border: '1px solid var(--lumen-border)',
                            borderRadius: 3, padding: '3px 6px', color: 'var(--lumen-text)', fontSize: 11,
                            marginBottom: 4, boxSizing: 'border-box', outline: 'none',
                          }}
                        />
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          style={{
                            width: '100%', background: 'transparent', border: '1px solid var(--lumen-border)',
                            borderRadius: 3, padding: '4px 6px', color: 'var(--lumen-text)', fontSize: 10,
                            resize: 'none', boxSizing: 'border-box', outline: 'none', lineHeight: 1.5,
                          }}
                        />
                        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                          <button onClick={() => saveEdit(t)} style={{ flex: 1, fontSize: 10, padding: '3px 0', background: 'rgba(126,63,242,0.15)', border: '1px solid rgba(126,63,242,0.3)', borderRadius: 3, color: 'var(--lumen-accent)', cursor: 'pointer' }}>
                            Guardar
                          </button>
                          <button onClick={() => setEditingId(null)} style={{ fontSize: 10, padding: '3px 6px', background: 'none', border: '1px solid var(--lumen-border)', borderRadius: 3, color: 'var(--lumen-text-muted)', cursor: 'pointer' }}>
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '6px 8px' }}>
                        <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: 3, lineHeight: 1.3 }}>{t.title}</p>
                        <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', lineHeight: 1.45, marginBottom: 5 }} className="line-clamp-2">{t.content}</p>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => copyText(t)} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                            fontSize: 9, padding: '3px 0', borderRadius: 3, cursor: 'pointer', border: 'none',
                            background: copying === t.id ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
                            color: copying === t.id ? '#4ade80' : 'var(--lumen-text-muted)', transition: 'all 0.15s',
                          }}>
                            {copying === t.id ? <><Check size={9} />Copiado</> : <><Copy size={9} />Copiar</>}
                          </button>
                          <button onClick={() => startEdit(t)} style={{ padding: '3px 5px', borderRadius: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)' }}>
                            <Edit3 size={9} />
                          </button>
                          <button onClick={() => onDelete(t.id)} style={{ padding: '3px 5px', borderRadius: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.5)' }}>
                            <Trash2 size={9} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add template */}
                {addingCat === cat.id ? (
                  <div style={{ padding: '6px', border: '1px solid var(--lumen-border)', borderRadius: 5, background: 'rgba(255,255,255,0.02)' }}>
                    <input
                      autoFocus
                      value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Título..."
                      style={{ width: '100%', background: 'transparent', border: '1px solid var(--lumen-border)', borderRadius: 3, padding: '3px 6px', color: 'var(--lumen-text)', fontSize: 10, marginBottom: 4, boxSizing: 'border-box', outline: 'none' }}
                    />
                    <textarea
                      value={newContent} onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Texto del template..."
                      rows={3}
                      style={{ width: '100%', background: 'transparent', border: '1px solid var(--lumen-border)', borderRadius: 3, padding: '4px 6px', color: 'var(--lumen-text)', fontSize: 10, resize: 'none', boxSizing: 'border-box', outline: 'none', lineHeight: 1.5 }}
                    />
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <button onClick={() => handleAdd(cat)} style={{ flex: 1, fontSize: 10, padding: '3px 0', background: 'rgba(126,63,242,0.15)', border: '1px solid rgba(126,63,242,0.3)', borderRadius: 3, color: 'var(--lumen-accent)', cursor: 'pointer' }}>
                        Agregar
                      </button>
                      <button onClick={() => { setAddingCat(null); setNewTitle(''); setNewContent(''); }} style={{ fontSize: 10, padding: '3px 6px', background: 'none', border: '1px solid var(--lumen-border)', borderRadius: 3, color: 'var(--lumen-text-muted)', cursor: 'pointer' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingCat(cat.id)}
                    style={{ width: '100%', fontSize: 9, padding: '5px 0', background: 'none', border: '1px dashed var(--lumen-border)', borderRadius: 4, color: 'var(--lumen-text-muted)', cursor: 'pointer', letterSpacing: '0.05em' }}
                  >
                    + Agregar
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Branch Builder (visual tree editor) ──────────────────────────────────────

function BranchBuilder({ branch, onSave, onBack, onDelete }) {
  const [name, setName]       = useState(branch.name);
  const [color, setColor]     = useState(branch.color || '#7E3FF2');
  const [desc, setDesc]       = useState(branch.description || '');
  const [nodes, setNodes]     = useState(() => Array.isArray(branch.nodes) ? branch.nodes : []);
  const [editingNode, setEditingNode] = useState(null); // node id being edited
  const [dirty, setDirty]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  const mark = () => setDirty(true);

  const addNode = () => {
    const newNode = { id: makeNodeId(), type: 'paso', title: 'Nuevo paso', note: '', yes_label: 'Sí', no_label: 'No' };
    setNodes((prev) => [...prev, newNode]);
    setEditingNode(newNode.id);
    mark();
  };

  const updateNode = (id, changes) => {
    setNodes((prev) => prev.map((n) => n.id === id ? { ...n, ...changes } : n));
    mark();
  };

  const deleteNode = (id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    if (editingNode === id) setEditingNode(null);
    mark();
  };

  const moveNode = (id, dir) => {
    setNodes((prev) => {
      const idx = prev.findIndex((n) => n.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    mark();
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...branch, name, color, description: desc, nodes });
    setSaving(false);
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const nodeTypeConfig = (type) => NODE_TYPES.find((t) => t.id === type) || NODE_TYPES[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Builder header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', padding: '4px 6px', borderRadius: 4 }}>
          <ChevronLeft size={14} />
          <span style={{ fontSize: 11 }}>Ramas</span>
        </button>
        <div style={{ width: 1, height: 16, background: 'var(--lumen-border)' }} />
        {/* Color picker */}
        <div style={{ display: 'flex', gap: 5 }}>
          {BRANCH_COLORS.map((c) => (
            <button key={c} onClick={() => { setColor(c); mark(); }} style={{
              width: 14, height: 14, borderRadius: '50%', background: c, border: color === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer', padding: 0,
            }} />
          ))}
        </div>
        <input
          value={name} onChange={(e) => { setName(e.target.value); mark(); }}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--lumen-text)', fontSize: 13, fontWeight: 600 }}
          placeholder="Nombre de la rama..."
        />
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {dirty && (
            <button onClick={handleSave} disabled={saving} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 5, fontSize: 11, cursor: 'pointer',
              background: 'rgba(126,63,242,0.15)', border: '1px solid rgba(126,63,242,0.35)', color: 'var(--lumen-accent)',
            }}>
              {saving ? <><Loader2 size={11} className="animate-spin" />Guardando</> : saved ? <><Check size={11} />Guardado</> : <><Save size={11} />Guardar</>}
            </button>
          )}
          <button onClick={() => onDelete(branch.id)} style={{ padding: '5px 8px', borderRadius: 5, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Description */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--lumen-border)', flexShrink: 0 }}>
        <input
          value={desc} onChange={(e) => { setDesc(e.target.value); mark(); }}
          placeholder="Descripción breve de esta rama (opcional)..."
          style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--lumen-text-muted)', fontSize: 11, boxSizing: 'border-box' }}
        />
      </div>

      {/* Nodes list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {nodes.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', opacity: 0.4 }}>
            <GitBranch size={28} style={{ color: 'var(--lumen-text-muted)', marginBottom: 12 }} />
            <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', textAlign: 'center' }}>
              Sin pasos todavía.<br />Agrega el primero con el botón de abajo.
            </p>
          </div>
        )}

        {nodes.map((node, idx) => {
          const cfg = nodeTypeConfig(node.type);
          const NodeIcon = cfg.Icon;
          const isEditing = editingNode === node.id;

          return (
            <div key={node.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Node card */}
              <div style={{
                width: '100%', maxWidth: 480, borderRadius: 8,
                border: `1px solid ${isEditing ? cfg.color + '55' : 'var(--lumen-border)'}`,
                background: isEditing ? `${cfg.color}08` : 'rgba(255,255,255,0.02)',
                transition: 'all 0.15s',
              }}>
                {/* Node header bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderBottom: isEditing ? `1px solid ${cfg.color}22` : '1px solid var(--lumen-border)' }}>
                  <NodeIcon size={12} style={{ color: cfg.color, flexShrink: 0 }} />
                  {isEditing ? (
                    <select
                      value={node.type}
                      onChange={(e) => updateNode(node.id, { type: e.target.value })}
                      style={{ background: 'transparent', border: 'none', outline: 'none', color: cfg.color, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', cursor: 'pointer' }}
                    >
                      {NODE_TYPES.map((t) => <option key={t.id} value={t.id} style={{ background: '#111' }}>{t.label.toUpperCase()}</option>)}
                    </select>
                  ) : (
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: cfg.color, textTransform: 'uppercase' }}>{cfg.label}</span>
                  )}
                  <div style={{ flex: 1 }} />
                  {/* Move buttons */}
                  <button onClick={() => moveNode(node.id, -1)} disabled={idx === 0} style={{ padding: 2, background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.2 : 0.5, color: 'var(--lumen-text-muted)' }}>
                    <ChevronUp size={11} />
                  </button>
                  <button onClick={() => moveNode(node.id, 1)} disabled={idx === nodes.length - 1} style={{ padding: 2, background: 'none', border: 'none', cursor: idx === nodes.length - 1 ? 'default' : 'pointer', opacity: idx === nodes.length - 1 ? 0.2 : 0.5, color: 'var(--lumen-text-muted)' }}>
                    <ChevronDown size={11} />
                  </button>
                  <button onClick={() => setEditingNode(isEditing ? null : node.id)} style={{ padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer', color: isEditing ? 'var(--lumen-accent)' : 'var(--lumen-text-muted)' }}>
                    <Edit3 size={11} />
                  </button>
                  <button onClick={() => deleteNode(node.id)} style={{ padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.5)' }}>
                    <X size={11} />
                  </button>
                </div>

                {/* Node body */}
                <div style={{ padding: '8px 10px' }}>
                  {isEditing ? (
                    <>
                      <input
                        autoFocus
                        value={node.title}
                        onChange={(e) => updateNode(node.id, { title: e.target.value })}
                        placeholder="Título del paso..."
                        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'var(--lumen-text)', fontSize: 12, fontWeight: 600, marginBottom: 6, boxSizing: 'border-box' }}
                      />
                      <textarea
                        value={node.note}
                        onChange={(e) => updateNode(node.id, { note: e.target.value })}
                        placeholder="Nota o instrucción (opcional)..."
                        rows={2}
                        style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--lumen-border)', borderRadius: 4, padding: '5px 7px', color: 'var(--lumen-text-muted)', fontSize: 11, resize: 'none', boxSizing: 'border-box', outline: 'none', lineHeight: 1.5 }}
                      />
                      {node.type === 'decision' && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                          <input
                            value={node.yes_label || 'Sí'}
                            onChange={(e) => updateNode(node.id, { yes_label: e.target.value })}
                            placeholder="Rama Sí"
                            style={{ flex: 1, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 4, padding: '4px 7px', color: '#4ade80', fontSize: 10, outline: 'none' }}
                          />
                          <input
                            value={node.no_label || 'No'}
                            onChange={(e) => updateNode(node.id, { no_label: e.target.value })}
                            placeholder="Rama No"
                            style={{ flex: 1, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 4, padding: '4px 7px', color: '#f87171', fontSize: 10, outline: 'none' }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: node.note ? 4 : 0, lineHeight: 1.35 }}>{node.title}</p>
                      {node.note && <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', lineHeight: 1.5 }}>{node.note}</p>}
                      {node.type === 'decision' && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 3, background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }}>{node.yes_label || 'Sí'}</span>
                          <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 3, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}>{node.no_label || 'No'}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Connector arrow */}
              {idx < nodes.length - 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0' }}>
                  <div style={{ width: 1, height: 10, background: 'var(--lumen-border)' }} />
                  <ArrowDown size={10} style={{ color: 'var(--lumen-border)' }} />
                </div>
              )}
            </div>
          );
        })}

        {/* Add step button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: nodes.length > 0 ? 12 : 0 }}>
          {nodes.length > 0 && (
            <>
              <div style={{ width: 1, height: 10, background: 'var(--lumen-border)' }} />
              <ArrowDown size={10} style={{ color: 'var(--lumen-border)', marginBottom: 4 }} />
            </>
          )}
          <button
            onClick={addNode}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 18px', borderRadius: 20, fontSize: 11,
              background: 'rgba(126,63,242,0.08)', border: '1px dashed rgba(126,63,242,0.35)',
              color: 'var(--lumen-accent)', cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <Plus size={12} /> Agregar paso
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Branch grid card ──────────────────────────────────────────────────────────

function BranchCard({ branch, index, onClick, onDelete }) {
  return (
    <button
      onClick={onClick}
      className="group"
      style={{
        background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)',
        borderRadius: 8, padding: '14px', textAlign: 'left', cursor: 'pointer',
        transition: 'all 0.15s', position: 'relative',
        borderLeft: `3px solid ${branch.color || '#7E3FF2'}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = (branch.color || '#7E3FF2') + '88'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'var(--lumen-border)'; e.currentTarget.style.borderLeftColor = branch.color || '#7E3FF2'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: branch.color || '#7E3FF2', letterSpacing: '0.08em' }}>
          RAMA #{index + 1}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(branch.id); }}
          style={{ padding: 3, background: 'none', border: 'none', cursor: 'pointer', opacity: 0, color: 'rgba(239,68,68,0.6)', transition: 'opacity 0.15s' }}
          className="group-hover:opacity-100"
          onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = 0; }}
        >
          <Trash2 size={10} />
        </button>
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

// ─── Right Panel ───────────────────────────────────────────────────────────────

function RightPanel({ activeBranch, emailTemplates, onEmailCreate, onEmailUpdate, onEmailDelete, calEvents, calLoading, onCalRefresh, topPolicies, onNavigate }) {
  const [luOpen, setLuOpen]         = useState(false);
  const [luMessages, setLuMessages] = useState([]);
  const [luInput, setLuInput]       = useState('');
  const [luSending, setLuSending]   = useState(false);
  const [editEmailId, setEditEmailId] = useState(null);
  const [editEmailData, setEditEmailData] = useState({});
  const [addingEmail, setAddingEmail] = useState(false);
  const [newEmail, setNewEmail]       = useState({ label: '', subject: '', body: '' });
  const luEndRef = useRef(null);

  useEffect(() => {
    if (luOpen && luEndRef.current) luEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [luMessages, luOpen]);

  const sendLu = async () => {
    const msg = luInput.trim();
    if (!msg || luSending) return;
    setLuInput('');
    setLuMessages((p) => [...p, { role: 'user', text: msg }]);
    setLuSending(true);
    try {
      const res = await Promise.race([
        window.lumen.ai.analyze(msg, { model: 'gemini-2.0-flash', searchMode: 'local' }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('Tiempo de espera agotado (30s)')), 30000)),
      ]);
      const text = typeof res === 'string' ? res : (res?.analysis || String(res || '(sin respuesta)'));
      setLuMessages((p) => [...p, { role: 'assistant', text }]);
    } catch (e) {
      setLuMessages((p) => [...p, { role: 'assistant', text: `⚠ ${e?.message || 'Error al conectar'}` }]);
    } finally { setLuSending(false); }
  };

  return (
    <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--lumen-border)', minHeight: 0 }}>

      {/* Action buttons */}
      <div style={{ padding: '12px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
        <button
          onClick={() => onNavigate('settings')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--lumen-border)', borderRadius: 6, cursor: 'pointer', transition: 'background 0.12s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        >
          <Settings size={13} style={{ color: 'var(--lumen-accent)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lumen-text)' }}>Configuración</span>
        </button>
        <button
          onClick={() => onNavigate('contacts')}
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

      {/* Scrollable middle section */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>

        {/* Top 5 Policies */}
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

        {/* Calendar mini-widget */}
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

        {/* Email Templates for active branch */}
        <div style={{ borderBottom: '1px solid var(--lumen-border)' }}>
          <div style={{ padding: '8px 12px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={10} style={{ color: 'var(--lumen-text-muted)' }} />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase' }}>
                {activeBranch ? `Emails — ${activeBranch.name}` : 'Templates de email'}
              </span>
            </div>
            <button onClick={() => setAddingEmail(true)} style={{ padding: 2, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-accent)' }}>
              <Plus size={10} />
            </button>
          </div>

          <div style={{ padding: '0 8px 8px' }}>
            {addingEmail && (
              <div style={{ marginBottom: 6, padding: '8px', border: '1px solid var(--lumen-border)', borderRadius: 5, background: 'rgba(255,255,255,0.02)' }}>
                <input value={newEmail.label} onChange={(e) => setNewEmail((p) => ({ ...p, label: e.target.value }))} placeholder="Etiqueta..." style={{ width: '100%', background: 'transparent', border: '1px solid var(--lumen-border)', borderRadius: 3, padding: '3px 6px', color: 'var(--lumen-text)', fontSize: 10, marginBottom: 4, boxSizing: 'border-box', outline: 'none' }} />
                <input value={newEmail.subject} onChange={(e) => setNewEmail((p) => ({ ...p, subject: e.target.value }))} placeholder="Asunto..." style={{ width: '100%', background: 'transparent', border: '1px solid var(--lumen-border)', borderRadius: 3, padding: '3px 6px', color: 'var(--lumen-text)', fontSize: 10, marginBottom: 4, boxSizing: 'border-box', outline: 'none' }} />
                <textarea value={newEmail.body} onChange={(e) => setNewEmail((p) => ({ ...p, body: e.target.value }))} placeholder="Cuerpo del email..." rows={3} style={{ width: '100%', background: 'transparent', border: '1px solid var(--lumen-border)', borderRadius: 3, padding: '4px 6px', color: 'var(--lumen-text)', fontSize: 10, resize: 'none', boxSizing: 'border-box', outline: 'none', lineHeight: 1.5 }} />
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  <button onClick={async () => { await onEmailCreate({ ...newEmail, branch_id: activeBranch?.id || null }); setAddingEmail(false); setNewEmail({ label: '', subject: '', body: '' }); }} style={{ flex: 1, fontSize: 10, padding: '3px 0', background: 'rgba(126,63,242,0.15)', border: '1px solid rgba(126,63,242,0.3)', borderRadius: 3, color: 'var(--lumen-accent)', cursor: 'pointer' }}>Agregar</button>
                  <button onClick={() => setAddingEmail(false)} style={{ fontSize: 10, padding: '3px 6px', background: 'none', border: '1px solid var(--lumen-border)', borderRadius: 3, color: 'var(--lumen-text-muted)', cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            )}

            {emailTemplates.length === 0 && !addingEmail && (
              <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', padding: '2px 4px', lineHeight: 1.4 }}>
                {activeBranch ? `Sin templates para ${activeBranch.name}.` : 'Sin templates. Agrega uno con +'}
              </p>
            )}

            {emailTemplates.map((em) => (
              <div key={em.id} style={{ marginBottom: 4, padding: '6px 8px', border: '1px solid var(--lumen-border)', borderRadius: 5, background: 'rgba(255,255,255,0.02)' }}>
                {editEmailId === em.id ? (
                  <>
                    <input value={editEmailData.label || ''} onChange={(e) => setEditEmailData((p) => ({ ...p, label: e.target.value }))} style={{ width: '100%', background: 'transparent', border: '1px solid var(--lumen-border)', borderRadius: 3, padding: '3px 6px', color: 'var(--lumen-text)', fontSize: 10, marginBottom: 3, boxSizing: 'border-box', outline: 'none' }} />
                    <input value={editEmailData.subject || ''} onChange={(e) => setEditEmailData((p) => ({ ...p, subject: e.target.value }))} style={{ width: '100%', background: 'transparent', border: '1px solid var(--lumen-border)', borderRadius: 3, padding: '3px 6px', color: 'var(--lumen-text)', fontSize: 10, marginBottom: 3, boxSizing: 'border-box', outline: 'none' }} />
                    <textarea value={editEmailData.body || ''} onChange={(e) => setEditEmailData((p) => ({ ...p, body: e.target.value }))} rows={3} style={{ width: '100%', background: 'transparent', border: '1px solid var(--lumen-border)', borderRadius: 3, padding: '4px 6px', color: 'var(--lumen-text)', fontSize: 10, resize: 'none', boxSizing: 'border-box', outline: 'none', lineHeight: 1.5 }} />
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <button onClick={async () => { await onEmailUpdate(em.id, editEmailData); setEditEmailId(null); }} style={{ flex: 1, fontSize: 10, padding: '3px 0', background: 'rgba(126,63,242,0.15)', border: '1px solid rgba(126,63,242,0.3)', borderRadius: 3, color: 'var(--lumen-accent)', cursor: 'pointer' }}>Guardar</button>
                      <button onClick={() => setEditEmailId(null)} style={{ fontSize: 10, padding: '3px 6px', background: 'none', border: '1px solid var(--lumen-border)', borderRadius: 3, color: 'var(--lumen-text-muted)', cursor: 'pointer' }}>✕</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--lumen-text)' }}>{em.label}</span>
                      <div style={{ display: 'flex', gap: 2 }}>
                        <button onClick={() => { setEditEmailId(em.id); setEditEmailData({ label: em.label, subject: em.subject, body: em.body }); }} style={{ padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)' }}><Edit3 size={9} /></button>
                        <button onClick={() => onEmailDelete(em.id)} style={{ padding: '2px 4px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(239,68,68,0.5)' }}><Trash2 size={9} /></button>
                      </div>
                    </div>
                    {em.subject && <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', marginBottom: 1 }}>Asunto: {em.subject}</p>}
                    <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', lineHeight: 1.4 }} className="line-clamp-2">{em.body}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* LU Chat bar — pinned to bottom */}
      <div style={{ borderTop: '1px solid var(--lumen-border)', flexShrink: 0 }}>
        {/* Toggle bar */}
        <button
          onClick={() => setLuOpen((p) => !p)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 12px', background: luOpen ? 'rgba(126,63,242,0.08)' : 'transparent',
            border: 'none', cursor: 'pointer', transition: 'background 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MessageSquare size={11} style={{ color: luOpen ? 'var(--lumen-accent)' : 'var(--lumen-text-muted)' }} />
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.10em', color: luOpen ? 'var(--lumen-accent)' : 'var(--lumen-text-muted)', textTransform: 'uppercase' }}>
              LU — Chat IA
            </span>
            {luSending && <Loader2 size={9} className="animate-spin" style={{ color: 'var(--lumen-accent)' }} />}
          </div>
          {luOpen ? <ChevronDown size={11} style={{ color: 'var(--lumen-text-muted)' }} /> : <ChevronUp size={11} style={{ color: 'var(--lumen-text-muted)' }} />}
        </button>

        {/* Chat panel */}
        {luOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 220, borderTop: '1px solid var(--lumen-border)' }}>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {luMessages.length === 0 && (
                <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', textAlign: 'center', padding: '10px 0', lineHeight: 1.5 }}>
                  Consulta políticas, redacta respuestas o pide ayuda.
                </p>
              )}
              {luMessages.map((m, i) => (
                <div key={i} style={{
                  marginBottom: 6, padding: '5px 8px', borderRadius: 5, fontSize: 10, lineHeight: 1.5,
                  background: m.role === 'user' ? 'rgba(126,63,242,0.12)' : 'rgba(255,255,255,0.04)',
                  color: m.role === 'user' ? 'rgba(255,255,255,0.9)' : 'var(--lumen-text-secondary)',
                  textAlign: m.role === 'user' ? 'right' : 'left',
                  border: `1px solid ${m.role === 'user' ? 'rgba(126,63,242,0.25)' : 'var(--lumen-border)'}`,
                }}>
                  {m.text}
                </div>
              ))}
              <div ref={luEndRef} />
            </div>

            {/* Input */}
            <div style={{ display: 'flex', gap: 5, padding: '6px 8px', borderTop: '1px solid var(--lumen-border)', flexShrink: 0 }}>
              <input
                value={luInput}
                onChange={(e) => setLuInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendLu(); } }}
                placeholder="Pregunta algo..."
                style={{ flex: 1, background: 'transparent', border: '1px solid var(--lumen-border)', borderRadius: 4, padding: '5px 8px', color: 'var(--lumen-text)', fontSize: 10, outline: 'none' }}
              />
              <button onClick={sendLu} disabled={luSending || !luInput.trim()} style={{
                padding: '5px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                background: 'rgba(126,63,242,0.2)', color: 'var(--lumen-accent)',
                opacity: (luSending || !luInput.trim()) ? 0.4 : 1,
              }}>
                <Send size={10} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AC3({ navigateTo: onNavigate }) {
  const [branches, setBranches]             = useState([]);
  const [activeBranch, setActiveBranch]     = useState(null);
  const [textTemplates, setTextTemplates]   = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [calEvents, setCalEvents]           = useState([]);
  const [calLoading, setCalLoading]         = useState(false);
  const [topPolicies, setTopPolicies]       = useState([]);
  const [showNewBranch, setShowNewBranch]   = useState(false);
  const [newBranchName, setNewBranchName]   = useState('');
  const [newBranchColor, setNewBranchColor] = useState('#7E3FF2');
  const newBranchRef = useRef(null);

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

  useEffect(() => {
    loadAll();
    loadCalEvents();
  }, []);

  // Email templates filtered by active branch (or all general if none)
  const visibleEmailTemplates = activeBranch
    ? emailTemplates.filter((e) => e.branch_id === activeBranch.id || !e.branch_id)
    : emailTemplates.filter((e) => !e.branch_id);

  // ── Branch CRUD ──────────────────────────────────────────────────────────────

  const createBranch = async () => {
    if (!newBranchName.trim()) return;
    const br = await window.lumen.ac3.branches.create({
      name: newBranchName.trim(),
      color: newBranchColor,
      nodes: [],
      order_idx: branches.length,
    });
    setBranches((p) => [...p, br]);
    setShowNewBranch(false);
    setNewBranchName('');
    setActiveBranch(br);
  };

  const saveBranch = async (updated) => {
    const saved = await window.lumen.ac3.branches.update(updated.id, updated);
    setBranches((p) => p.map((b) => b.id === saved.id ? saved : b));
    setActiveBranch(saved);
  };

  const deleteBranch = async (id) => {
    if (!confirm('¿Eliminar esta rama?')) return;
    await window.lumen.ac3.branches.delete(id);
    setBranches((p) => p.filter((b) => b.id !== id));
    if (activeBranch?.id === id) setActiveBranch(null);
  };

  // ── Text Templates CRUD ──────────────────────────────────────────────────────

  const updateTextTemplate = async (id, data) => {
    const saved = await window.lumen.ac3.textTemplates.update(id, data);
    setTextTemplates((p) => p.map((t) => t.id === id ? saved : t));
  };

  const deleteTextTemplate = async (id) => {
    await window.lumen.ac3.textTemplates.delete(id);
    setTextTemplates((p) => p.filter((t) => t.id !== id));
  };

  const createTextTemplate = async (data) => {
    const saved = await window.lumen.ac3.textTemplates.create(data);
    setTextTemplates((p) => [...p, saved]);
  };

  // ── Email Templates CRUD ─────────────────────────────────────────────────────

  const createEmailTemplate = async (data) => {
    const saved = await window.lumen.ac3.emailTemplates.create(data);
    setEmailTemplates((p) => [...p, saved]);
  };

  const updateEmailTemplate = async (id, data) => {
    const saved = await window.lumen.ac3.emailTemplates.update(id, data);
    setEmailTemplates((p) => p.map((e) => e.id === id ? saved : e));
  };

  const deleteEmailTemplate = async (id) => {
    await window.lumen.ac3.emailTemplates.delete(id);
    setEmailTemplates((p) => p.filter((e) => e.id !== id));
  };

  // ── Navigate (pass-through to parent) ───────────────────────────────────────
  const navigate = onNavigate || (() => {});

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden', background: 'var(--lumen-bg)' }}>

      {/* LEFT — Text templates panel */}
      <TemplatesPanel
        templates={textTemplates}
        onUpdate={updateTextTemplate}
        onDelete={deleteTextTemplate}
        onCreate={createTextTemplate}
      />

      {/* CENTER — Branches grid / builder */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
          {!activeBranch && (
            <button
              onClick={() => { setShowNewBranch(true); setTimeout(() => newBranchRef.current?.focus(), 50); }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 5, fontSize: 11, cursor: 'pointer', background: 'rgba(126,63,242,0.12)', border: '1px solid rgba(126,63,242,0.3)', color: 'var(--lumen-accent)' }}
            >
              <Plus size={12} /> Nueva rama
            </button>
          )}
        </div>

        {activeBranch ? (
          /* Branch builder */
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <BranchBuilder
              branch={activeBranch}
              onSave={saveBranch}
              onBack={() => setActiveBranch(null)}
              onDelete={deleteBranch}
            />
          </div>
        ) : (
          /* Branches grid */
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {/* New branch form */}
            {showNewBranch && (
              <div style={{ marginBottom: 16, padding: '14px', border: '1px solid rgba(126,63,242,0.3)', borderRadius: 8, background: 'rgba(126,63,242,0.05)' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: 10 }}>Nueva rama</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  {BRANCH_COLORS.map((c) => (
                    <button key={c} onClick={() => setNewBranchColor(c)} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: newBranchColor === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
                  ))}
                </div>
                <input
                  ref={newBranchRef}
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') createBranch(); if (e.key === 'Escape') { setShowNewBranch(false); setNewBranchName(''); } }}
                  placeholder="Nombre de la rama (ej. Reembolso rápido, Acceso urgente...)"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--lumen-border)', borderRadius: 5, padding: '7px 10px', color: 'var(--lumen-text)', fontSize: 12, outline: 'none', boxSizing: 'border-box', marginBottom: 8 }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={createBranch} disabled={!newBranchName.trim()} style={{ flex: 1, padding: '7px 0', borderRadius: 5, fontSize: 11, background: 'rgba(126,63,242,0.2)', border: '1px solid rgba(126,63,242,0.35)', color: 'var(--lumen-accent)', cursor: 'pointer', opacity: newBranchName.trim() ? 1 : 0.5 }}>
                    Crear rama
                  </button>
                  <button onClick={() => { setShowNewBranch(false); setNewBranchName(''); }} style={{ padding: '7px 14px', borderRadius: 5, fontSize: 11, background: 'none', border: '1px solid var(--lumen-border)', color: 'var(--lumen-text-muted)', cursor: 'pointer' }}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {branches.length === 0 && !showNewBranch ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', opacity: 0.5 }}>
                <GitBranch size={36} style={{ color: 'var(--lumen-text-muted)', marginBottom: 14 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: 6 }}>Sin ramas de decisión</p>
                <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
                  Crea tu primera rama para definir un flujo de atención paso a paso.<br />
                  Cada rama es un proceso distinto (reembolso, acceso, queja, etc.)
                </p>
                <button
                  onClick={() => { setShowNewBranch(true); setTimeout(() => newBranchRef.current?.focus(), 50); }}
                  style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 20px', borderRadius: 20, fontSize: 12, background: 'rgba(126,63,242,0.15)', border: '1px dashed rgba(126,63,242,0.4)', color: 'var(--lumen-accent)', cursor: 'pointer' }}
                >
                  <Plus size={14} /> Crear primera rama
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                {branches.map((br, idx) => (
                  <BranchCard
                    key={br.id}
                    branch={br}
                    index={idx}
                    onClick={() => setActiveBranch(br)}
                    onDelete={deleteBranch}
                  />
                ))}
                {/* Add new branch card */}
                <button
                  onClick={() => { setShowNewBranch(true); setTimeout(() => newBranchRef.current?.focus(), 50); }}
                  style={{
                    background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--lumen-border)', borderRadius: 8,
                    padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 6, cursor: 'pointer', minHeight: 90, transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(126,63,242,0.4)'; e.currentTarget.style.background = 'rgba(126,63,242,0.04)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--lumen-border)'; e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}
                >
                  <Plus size={16} style={{ color: 'var(--lumen-text-muted)' }} />
                  <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)', fontWeight: 600 }}>Nueva rama</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT — action panel */}
      <RightPanel
        activeBranch={activeBranch}
        emailTemplates={visibleEmailTemplates}
        onEmailCreate={createEmailTemplate}
        onEmailUpdate={updateEmailTemplate}
        onEmailDelete={deleteEmailTemplate}
        calEvents={calEvents}
        calLoading={calLoading}
        onCalRefresh={loadCalEvents}
        topPolicies={topPolicies}
        onNavigate={navigate}
      />
    </div>
  );
}
