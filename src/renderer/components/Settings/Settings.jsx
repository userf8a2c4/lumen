import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings as SettingsIcon, Key, Cpu, Check, Eye, EyeOff,
  Mail, CalendarDays, Wifi, WifiOff, Palette, LogOut,
  RefreshCw, Info, Tag, RotateCcw, Plus, Trash2, X,
  GitBranch, ChevronDown, ChevronUp, Save, Loader2,
  Zap, AlertTriangle, ArrowDown, ArrowUp, CornerDownRight,
  Target, MessageSquare, HelpCircle, Briefcase, Utensils,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const MODELS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'Rápido · Recomendado' },
  { id: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro',   desc: 'Máximo rendimiento · Requiere billing' },
];

const ACCENT_PRESETS = ['#ffffff', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#06b6d4'];

const NAV_LABEL_DEFS = [
  { id: 'dashboard', default: 'Dashboard',     hint: 'Pantalla de inicio' },
  { id: 'ac3',       default: 'Decisiones',    hint: 'Centro de decisiones AC3' },
  { id: 'knowledge', default: 'Biblioteca',    hint: 'Base de conocimiento / políticas' },
  { id: 'contacts',  default: 'Directorio',    hint: 'Contactos y directorio' },
  { id: 'notes',     default: 'Notas',         hint: 'Notas personales' },
  { id: 'settings',  default: 'Configuración', hint: 'Esta sección' },
];

const TEMPLATE_CATEGORIES = [
  { id: 'saludo',          label: 'Saludo',              color: '#4ade80' },
  { id: 'preguntas',       label: 'Preguntas de sondeo', color: '#60a5fa' },
  { id: 'confirmacion',    label: 'Confirmación',        color: '#a78bfa' },
  { id: 'disculpa',        label: 'Disculpa',            color: '#f87171' },
  { id: 'agradecimiento',  label: 'Agradecimiento',      color: '#fbbf24' },
  { id: 'ausencia',        label: 'Ausencia',            color: '#94a3b8' },
  { id: 'tarjeta',         label: 'Tarjeta de acceso',   color: '#fb923c' },
  { id: 'reembolso',       label: 'Reembolso',           color: '#34d399' },
  { id: 'configuraciones', label: 'Configuraciones',     color: '#e879f9' },
  { id: 'despedida',       label: 'Despedida',           color: '#38bdf8' },
];

const BRANCH_COLORS = [
  '#7E3FF2', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#84CC16',
];

function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

// ─── Shared style helpers ────────────────────────────────────────────────────

const INPUT = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--lumen-border)',
  borderRadius: 5, padding: '6px 10px', color: 'var(--lumen-text)', fontSize: 12,
  outline: 'none', width: '100%', boxSizing: 'border-box',
};
const TEXTAREA = { ...INPUT, resize: 'vertical', lineHeight: 1.5 };
const BTN_GHOST = {
  background: 'none', border: '1px solid var(--lumen-border)', borderRadius: 5,
  padding: '5px 10px', color: 'var(--lumen-text-muted)', cursor: 'pointer', fontSize: 11,
  display: 'flex', alignItems: 'center', gap: 4,
};
const BTN_ACCENT = {
  background: 'rgba(126,63,242,0.15)', border: '1px solid rgba(126,63,242,0.35)',
  borderRadius: 5, padding: '5px 12px', color: 'var(--lumen-accent)', cursor: 'pointer', fontSize: 11,
  display: 'flex', alignItems: 'center', gap: 4,
};
const BTN_DANGER = {
  background: 'none', border: 'none', cursor: 'pointer', padding: '3px 5px',
  color: 'rgba(239,68,68,0.55)', display: 'flex', alignItems: 'center',
};

// ─── Row wrapper ──────────────────────────────────────────────────────────────

function Row({ label, icon: Icon, iconColor = 'var(--lumen-accent)', children, hint, collapsible, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '18px 0' }}>
      <div
        className="flex items-center gap-2 mb-3"
        onClick={collapsible ? () => setOpen((v) => !v) : undefined}
        style={collapsible ? { cursor: 'pointer', userSelect: 'none' } : {}}
      >
        <Icon size={13} style={{ color: iconColor, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lumen-text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase', flex: 1 }}>
          {label}
        </span>
        {collapsible && (
          open
            ? <ChevronUp size={12} style={{ color: 'var(--lumen-text-muted)' }} />
            : <ChevronDown size={12} style={{ color: 'var(--lumen-text-muted)' }} />
        )}
      </div>
      {(!collapsible || open) && (
        <>
          {children}
          {hint && <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', marginTop: 8, lineHeight: 1.5 }}>{hint}</p>}
        </>
      )}
    </div>
  );
}

// ─── Text Templates Editor ────────────────────────────────────────────────────

function TextTemplatesEditor() {
  const [templates, setTemplates]     = useState([]);
  const [editingId, setEditingId]     = useState(null);
  const [editData, setEditData]       = useState({});
  const [addingCat, setAddingCat]     = useState(null);
  const [newTitle, setNewTitle]       = useState('');
  const [newContent, setNewContent]   = useState('');
  const [expanded, setExpanded]       = useState(() => new Set(['saludo']));
  const [saving, setSaving]           = useState(false);

  const load = useCallback(async () => {
    try { setTemplates(await window.lumen.ac3.textTemplates.getAll() || []); } catch {}
  }, []);
  useEffect(() => { load(); }, []);

  const toggle = (id) => setExpanded((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const startEdit = (t) => { setEditingId(t.id); setEditData({ title: t.title, content: t.content }); };
  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async (t) => {
    setSaving(true);
    try {
      const saved = await window.lumen.ac3.textTemplates.update(t.id, { ...t, ...editData });
      setTemplates((p) => p.map((x) => x.id === t.id ? saved : x));
      setEditingId(null);
    } catch { } finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('¿Eliminar esta plantilla?')) return;
    await window.lumen.ac3.textTemplates.delete(id);
    setTemplates((p) => p.filter((x) => x.id !== id));
  };

  const add = async (cat) => {
    if (!newTitle.trim()) return;
    try {
      const saved = await window.lumen.ac3.textTemplates.create({ category: cat.id, title: newTitle.trim(), content: newContent.trim(), order_idx: 99 });
      setTemplates((p) => [...p, saved]);
      setAddingCat(null); setNewTitle(''); setNewContent('');
    } catch {}
  };

  return (
    <div>
      {TEMPLATE_CATEGORIES.map((cat) => {
        const items = templates.filter((t) => t.category === cat.id);
        const isOpen = expanded.has(cat.id);
        return (
          <div key={cat.id} style={{ marginBottom: 6, border: '1px solid var(--lumen-border)', borderRadius: 6, overflow: 'hidden' }}>
            <button
              onClick={() => toggle(cat.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lumen-text-secondary)' }}>{cat.label}</span>
                <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)', fontFamily: 'monospace' }}>{items.length}</span>
              </div>
              {isOpen ? <ChevronUp size={11} style={{ color: 'var(--lumen-text-muted)' }} /> : <ChevronDown size={11} style={{ color: 'var(--lumen-text-muted)' }} />}
            </button>

            {isOpen && (
              <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)' }}>
                {items.map((t) => (
                  <div key={t.id} style={{ marginBottom: 8, padding: 10, border: '1px solid var(--lumen-border)', borderRadius: 5, background: 'rgba(255,255,255,0.02)' }}>
                    {editingId === t.id ? (
                      <>
                        <input value={editData.title || ''} onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))}
                          style={{ ...INPUT, marginBottom: 6 }} placeholder="Título..." />
                        <textarea value={editData.content || ''} onChange={(e) => setEditData((p) => ({ ...p, content: e.target.value }))}
                          rows={3} style={{ ...TEXTAREA, marginBottom: 6 }} placeholder="Texto..." />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => saveEdit(t)} style={BTN_ACCENT} disabled={saving}>
                            {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Guardar
                          </button>
                          <button onClick={cancelEdit} style={BTN_GHOST}><X size={11} /> Cancelar</button>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: 3 }}>{t.title}</p>
                          <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', lineHeight: 1.4 }} className="line-clamp-2">{t.content}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                          <button onClick={() => startEdit(t)} style={BTN_GHOST} title="Editar">✎</button>
                          <button onClick={() => del(t.id)} style={BTN_DANGER}><Trash2 size={12} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {addingCat === cat.id ? (
                  <div style={{ padding: 10, border: '1px dashed rgba(126,63,242,0.35)', borderRadius: 5, background: 'rgba(126,63,242,0.04)' }}>
                    <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                      style={{ ...INPUT, marginBottom: 6 }} placeholder="Título de la plantilla..." />
                    <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)}
                      rows={3} style={{ ...TEXTAREA, marginBottom: 6 }} placeholder="Texto a copiar..." />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => add(cat)} style={BTN_ACCENT}><Plus size={11} /> Agregar</button>
                      <button onClick={() => { setAddingCat(null); setNewTitle(''); setNewContent(''); }} style={BTN_GHOST}><X size={11} /> Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setAddingCat(cat.id)} style={{ ...BTN_GHOST, width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}>
                    <Plus size={10} /> Agregar plantilla
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

// ─── Email Templates Editor ───────────────────────────────────────────────────

function EmailTemplatesEditor() {
  const [templates, setTemplates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData,  setEditData]  = useState({});
  const [adding,    setAdding]    = useState(false);
  const [newData,   setNewData]   = useState({ label: '', subject: '', body: '' });
  const [saving,    setSaving]    = useState(false);

  useEffect(() => {
    window.lumen.ac3.emailTemplates.getAll().then(setTemplates).catch(() => {});
  }, []);

  const startEdit = (t) => { setEditingId(t.id); setEditData({ label: t.label, subject: t.subject, body: t.body }); };
  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async (t) => {
    setSaving(true);
    try {
      const saved = await window.lumen.ac3.emailTemplates.update(t.id, { ...t, ...editData });
      setTemplates((p) => p.map((x) => x.id === t.id ? saved : x));
      setEditingId(null);
    } catch {} finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('¿Eliminar este template de email?')) return;
    await window.lumen.ac3.emailTemplates.delete(id);
    setTemplates((p) => p.filter((x) => x.id !== id));
  };

  const add = async () => {
    if (!newData.label.trim()) return;
    try {
      const saved = await window.lumen.ac3.emailTemplates.create({ ...newData, branch_id: null });
      setTemplates((p) => [...p, saved]);
      setAdding(false); setNewData({ label: '', subject: '', body: '' });
    } catch {}
  };

  const emailInputStyle = { ...INPUT, marginBottom: 6 };

  return (
    <div>
      {templates.length === 0 && !adding && (
        <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', marginBottom: 10 }}>Sin templates de email aún.</p>
      )}
      {templates.map((t) => (
        <div key={t.id} style={{ marginBottom: 8, padding: 10, border: '1px solid var(--lumen-border)', borderRadius: 6, background: 'rgba(255,255,255,0.02)' }}>
          {editingId === t.id ? (
            <>
              <input value={editData.label || ''} onChange={(e) => setEditData((p) => ({ ...p, label: e.target.value }))}
                style={emailInputStyle} placeholder="Etiqueta..." />
              <input value={editData.subject || ''} onChange={(e) => setEditData((p) => ({ ...p, subject: e.target.value }))}
                style={emailInputStyle} placeholder="Asunto del email..." />
              <textarea value={editData.body || ''} onChange={(e) => setEditData((p) => ({ ...p, body: e.target.value }))}
                rows={4} style={{ ...TEXTAREA, marginBottom: 6 }} placeholder="Cuerpo del email..." />
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => saveEdit(t)} style={BTN_ACCENT} disabled={saving}>
                  {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Guardar
                </button>
                <button onClick={cancelEdit} style={BTN_GHOST}><X size={11} /> Cancelar</button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: 2 }}>{t.label}</p>
                {t.subject && <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', marginBottom: 2 }}>Asunto: {t.subject}</p>}
                <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', lineHeight: 1.4 }} className="line-clamp-2">{t.body}</p>
              </div>
              <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                <button onClick={() => startEdit(t)} style={BTN_GHOST} title="Editar">✎</button>
                <button onClick={() => del(t.id)} style={BTN_DANGER}><Trash2 size={12} /></button>
              </div>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div style={{ padding: 10, border: '1px dashed rgba(126,63,242,0.35)', borderRadius: 6, background: 'rgba(126,63,242,0.04)' }}>
          <input autoFocus value={newData.label} onChange={(e) => setNewData((p) => ({ ...p, label: e.target.value }))}
            style={emailInputStyle} placeholder="Etiqueta (ej. Reembolso aprobado)..." />
          <input value={newData.subject} onChange={(e) => setNewData((p) => ({ ...p, subject: e.target.value }))}
            style={emailInputStyle} placeholder="Asunto del email..." />
          <textarea value={newData.body} onChange={(e) => setNewData((p) => ({ ...p, body: e.target.value }))}
            rows={4} style={{ ...TEXTAREA, marginBottom: 6 }} placeholder="Cuerpo del email..." />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={add} style={BTN_ACCENT}><Plus size={11} /> Agregar</button>
            <button onClick={() => { setAdding(false); setNewData({ label: '', subject: '', body: '' }); }} style={BTN_GHOST}><X size={11} /> Cancelar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ ...BTN_GHOST, width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}>
          <Plus size={10} /> Agregar template de email
        </button>
      )}
    </div>
  );
}

// ─── Speeches Editor ──────────────────────────────────────────────────────────

const SPEECH_CATEGORY_COLOR = '#a78bfa';

function SpeechesEditor() {
  const [speeches,    setSpeeches]    = useState([]);
  const [editingId,   setEditingId]   = useState(null);
  const [editData,    setEditData]    = useState({});
  const [adding,      setAdding]      = useState(false);
  const [newData,     setNewData]     = useState({ category: '', title: '', content: '' });
  const [saving,      setSaving]      = useState(false);
  const [expandedCat, setExpandedCat] = useState(() => new Set());

  useEffect(() => {
    window.lumen.ac3.speeches.getAll().then(setSpeeches).catch(() => {});
  }, []);

  const categories = [...new Set(speeches.map((s) => s.category))].sort();

  const toggleCat = (cat) => setExpandedCat((prev) => {
    const s = new Set(prev);
    s.has(cat) ? s.delete(cat) : s.add(cat);
    return s;
  });

  const startEdit = (sp) => {
    setEditingId(sp.id);
    setEditData({ category: sp.category, title: sp.title, content: sp.content });
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async (sp) => {
    setSaving(true);
    try {
      const saved = await window.lumen.ac3.speeches.update(sp.id, { ...sp, ...editData });
      setSpeeches((p) => p.map((x) => x.id === sp.id ? saved : x));
      setEditingId(null);
    } catch {} finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('¿Eliminar este speech?')) return;
    await window.lumen.ac3.speeches.delete(id);
    setSpeeches((p) => p.filter((x) => x.id !== id));
  };

  const add = async () => {
    if (!newData.title.trim() || !newData.content.trim()) return;
    try {
      const saved = await window.lumen.ac3.speeches.create({
        category: newData.category.trim() || 'General',
        title: newData.title.trim(),
        content: newData.content.trim(),
        order_idx: speeches.length,
      });
      setSpeeches((p) => [...p, saved]);
      setAdding(false);
      setNewData({ category: '', title: '', content: '' });
      // Auto-expand category
      setExpandedCat((prev) => new Set([...prev, saved.category]));
    } catch {}
  };

  return (
    <div>
      {/* Categories */}
      {categories.length === 0 && !adding && (
        <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', marginBottom: 10 }}>Sin speeches aún. Agrega guiones para tus llamadas.</p>
      )}

      {categories.map((cat) => {
        const items = speeches.filter((s) => s.category === cat);
        const open  = expandedCat.has(cat);
        return (
          <div key={cat} style={{ marginBottom: 6, border: '1px solid var(--lumen-border)', borderRadius: 6, overflow: 'hidden' }}>
            <button
              onClick={() => toggleCat(cat)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(167,139,250,0.04)', border: 'none', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: SPEECH_CATEGORY_COLOR }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lumen-text)' }}>{cat}</span>
                <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)' }}>({items.length})</span>
              </div>
              {open ? <ChevronUp size={12} style={{ color: 'var(--lumen-text-muted)' }} /> : <ChevronDown size={12} style={{ color: 'var(--lumen-text-muted)' }} />}
            </button>

            {open && (
              <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid var(--lumen-border)' }}>
                {items.map((sp) => (
                  <div key={sp.id} style={{ marginBottom: 8, padding: 10, border: '1px solid var(--lumen-border)', borderRadius: 6, background: 'rgba(255,255,255,0.02)' }}>
                    {editingId === sp.id ? (
                      <>
                        <input value={editData.category || ''} onChange={(e) => setEditData((p) => ({ ...p, category: e.target.value }))}
                          style={{ ...INPUT, marginBottom: 6 }} placeholder="Categoría..." />
                        <input value={editData.title || ''} onChange={(e) => setEditData((p) => ({ ...p, title: e.target.value }))}
                          style={{ ...INPUT, marginBottom: 6 }} placeholder="Título del speech..." />
                        <textarea value={editData.content || ''} onChange={(e) => setEditData((p) => ({ ...p, content: e.target.value }))}
                          rows={5} style={{ ...TEXTAREA, marginBottom: 6 }} placeholder="Guión completo..." />
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => saveEdit(sp)} style={BTN_ACCENT} disabled={saving}>
                            {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />} Guardar
                          </button>
                          <button onClick={cancelEdit} style={BTN_GHOST}><X size={11} /> Cancelar</button>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: 3 }}>{sp.title}</p>
                          <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', lineHeight: 1.5 }} className="line-clamp-3">{sp.content}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                          <button onClick={() => startEdit(sp)} style={BTN_GHOST} title="Editar">✎</button>
                          <button onClick={() => del(sp.id)} style={BTN_DANGER}><Trash2 size={12} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add form */}
      {adding ? (
        <div style={{ padding: 12, border: '1px dashed rgba(167,139,250,0.35)', borderRadius: 6, background: 'rgba(167,139,250,0.04)', marginTop: 8 }}>
          <input autoFocus value={newData.category} onChange={(e) => setNewData((p) => ({ ...p, category: e.target.value }))}
            style={{ ...INPUT, marginBottom: 6 }} placeholder="Categoría (ej. Apertura, Cierre, Objeción)..." />
          <input value={newData.title} onChange={(e) => setNewData((p) => ({ ...p, title: e.target.value }))}
            style={{ ...INPUT, marginBottom: 6 }} placeholder="Título del guión..." />
          <textarea value={newData.content} onChange={(e) => setNewData((p) => ({ ...p, content: e.target.value }))}
            rows={5} style={{ ...TEXTAREA, marginBottom: 6 }} placeholder="Escribe aquí el guión completo de voz..." />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={add} style={BTN_ACCENT}><Plus size={11} /> Agregar speech</button>
            <button onClick={() => { setAdding(false); setNewData({ category: '', title: '', content: '' }); }} style={BTN_GHOST}><X size={11} /> Cancelar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ ...BTN_GHOST, width: '100%', justifyContent: 'center', borderStyle: 'dashed', marginTop: 6 }}>
          <Plus size={10} /> Agregar speech
        </button>
      )}
    </div>
  );
}

// ─── Branch & Node Editor ─────────────────────────────────────────────────────

function BranchNodeEditor({ branch: initialBranch, onSaved, onDeleted }) {
  const [name,   setName]   = useState(initialBranch.name);
  const [color,  setColor]  = useState(initialBranch.color || '#7E3FF2');
  const [nodes,  setNodes]  = useState(() => {
    const raw = Array.isArray(initialBranch.nodes) ? initialBranch.nodes : [];
    return raw.map((n) => ({
      id:           n.id,
      title:        n.title || '',
      instructions: n.instructions || '',
      speech:       n.speech || n.note || '',
      outcome:      n.outcome || '',
      options:      Array.isArray(n.options) ? n.options : [],
    }));
  });
  const [openNodes, setOpenNodes] = useState(() => new Set());  // collapsed by default
  const [dirty,  setDirty]  = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);

  const mark = () => { setDirty(true); setSaved(false); };

  const updateNode = (id, changes) => { setNodes((p) => p.map((n) => n.id === id ? { ...n, ...changes } : n)); mark(); };
  const deleteNode = (id) => { setNodes((p) => p.filter((n) => n.id !== id)); mark(); };
  const addNode = () => {
    const id = `n${makeId()}`;
    setNodes((p) => [...p, { id, title: 'Nuevo paso', instructions: '', speech: '', outcome: '', options: [] }]);
    mark();
  };

  const addOption = (nodeId) => {
    const optId = `o${makeId()}`;
    setNodes((p) => p.map((n) => n.id === nodeId
      ? { ...n, options: [...n.options, { id: optId, label: 'Opción', next_node_id: null }] }
      : n
    ));
    mark();
  };
  const updateOption = (nodeId, optId, changes) => {
    setNodes((p) => p.map((n) => n.id === nodeId
      ? { ...n, options: n.options.map((o) => o.id === optId ? { ...o, ...changes } : o) }
      : n
    ));
    mark();
  };
  const deleteOption = (nodeId, optId) => {
    setNodes((p) => p.map((n) => n.id === nodeId ? { ...n, options: n.options.filter((o) => o.id !== optId) } : n));
    mark();
  };
  const moveNode = (id, dir) => {
    setNodes((p) => {
      const idx = p.findIndex((n) => n.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= p.length) return p;
      const next = [...p];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    mark();
  };
  const toggleNodeOpen = (id) => setOpenNodes((prev) => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await window.lumen.ac3.branches.update(initialBranch.id, { ...initialBranch, name, color, nodes });
      setSaved(true); setDirty(false);
      onSaved?.(updated);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { alert('Error al guardar: ' + e.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar la rama "${name}"? Esta acción no se puede deshacer.`)) return;
    await window.lumen.ac3.branches.delete(initialBranch.id);
    onDeleted?.(initialBranch.id);
  };

  const nodeOptions = nodes.map((n) => ({ id: n.id, title: n.title }));

  return (
    <div style={{ padding: '10px 0' }}>
      {/* Branch meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {BRANCH_COLORS.map((c) => (
          <button key={c} onClick={() => { setColor(c); mark(); }}
            style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: color === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
        ))}
        <input value={name} onChange={(e) => { setName(e.target.value); mark(); }}
          style={{ ...INPUT, flex: 1 }} placeholder="Nombre de la rama..." />
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, padding: '8px 12px',
        background: `${color}08`, border: `1px solid ${color}25`, borderRadius: 6,
      }}>
        <GitBranch size={12} style={{ color }} />
        <span style={{ fontSize: 11, color: 'var(--lumen-text-muted)' }}>
          <strong style={{ color: 'var(--lumen-text)' }}>{nodes.length}</strong> paso{nodes.length !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 11, color: 'var(--lumen-text-muted)' }}>·</span>
        <span style={{ fontSize: 11, color: 'var(--lumen-text-muted)' }}>
          <strong style={{ color: 'var(--lumen-text)' }}>{nodes.filter(n => (!n.options || n.options.length === 0) && n.outcome).length}</strong> resultado{nodes.filter(n => (!n.options || n.options.length === 0) && n.outcome).length !== 1 ? 's' : ''}
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setOpenNodes(new Set(nodes.map(n => n.id)))} style={{ ...BTN_GHOST, fontSize: 10 }}>
          <ChevronDown size={10} /> Expandir todo
        </button>
        <button onClick={() => setOpenNodes(new Set())} style={{ ...BTN_GHOST, fontSize: 10 }}>
          <ChevronUp size={10} /> Colapsar
        </button>
      </div>

      {/* Nodes */}
      {nodes.map((node, idx) => {
        const isOpen = openNodes.has(node.id);
        const isTerminal = (!node.options || node.options.length === 0);
        const hasOutcome = Boolean(node.outcome);
        return (
        <div key={node.id} style={{ marginBottom: 8, border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: '0 6px 6px 0', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>

          {/* Header — click to collapse/expand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', cursor: 'pointer' }}
               onClick={() => toggleNodeOpen(node.id)}>
            <span style={{ fontSize: 9, fontFamily: 'monospace', color, fontWeight: 700, minWidth: 46 }}>PASO {idx + 1}</span>
            {isTerminal && hasOutcome && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#10b981', textTransform: 'uppercase', padding: '2px 6px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 3 }}>
                <Target size={9} style={{ display: 'inline', marginRight: 3, verticalAlign: '-1px' }} />Hoja
              </span>
            )}
            {!isTerminal && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase', padding: '2px 6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--lumen-border)', borderRadius: 3 }}>
                <HelpCircle size={9} style={{ display: 'inline', marginRight: 3, verticalAlign: '-1px' }} />{node.options.length} op{node.options.length !== 1 ? 'c.' : '.'}
              </span>
            )}
            <span style={{ flex: 1, fontSize: 12, color: 'var(--lumen-text)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {node.title || <em style={{ color: 'var(--lumen-text-muted)', fontWeight: 400 }}>Sin título</em>}
            </span>
            <button onClick={(e) => { e.stopPropagation(); moveNode(node.id, -1); }}
                    disabled={idx === 0}
                    style={{ ...BTN_GHOST, padding: '4px 6px', opacity: idx === 0 ? 0.3 : 1 }} title="Subir">
              <ArrowUp size={11} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); moveNode(node.id, +1); }}
                    disabled={idx === nodes.length - 1}
                    style={{ ...BTN_GHOST, padding: '4px 6px', opacity: idx === nodes.length - 1 ? 0.3 : 1 }} title="Bajar">
              <ArrowDown size={11} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); deleteNode(node.id); }} style={BTN_DANGER} title="Eliminar paso">
              <Trash2 size={11} />
            </button>
            {isOpen ? <ChevronUp size={12} style={{ color: 'var(--lumen-text-muted)' }} /> : <ChevronDown size={12} style={{ color: 'var(--lumen-text-muted)' }} />}
          </div>

          {/* Body */}
          {isOpen && (
            <div style={{ padding: '0 12px 12px 12px', borderTop: '1px solid var(--lumen-border)' }}>
              {/* Title / question */}
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <HelpCircle size={9} /> Pregunta / título
                </label>
                <input value={node.title} onChange={(e) => updateNode(node.id, { title: e.target.value })}
                  style={{ ...INPUT, marginBottom: 8, fontWeight: 600 }} placeholder="¿Cuántas máquinas te interesan?" />
              </div>

              {/* Instructions */}
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Info size={9} /> Instrucciones internas
                </label>
                <textarea value={node.instructions || ''} onChange={(e) => updateNode(node.id, { instructions: e.target.value })}
                  rows={2} style={{ ...TEXTAREA, marginBottom: 8 }} placeholder="Nota para ti — qué significa este paso, cuándo aplicarlo..." />
              </div>

              {/* Speech */}
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color, textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MessageSquare size={9} /> Script — qué decir al cliente
                </label>
                <textarea value={node.speech || ''} onChange={(e) => updateNode(node.id, { speech: e.target.value })}
                  rows={3} style={{ ...TEXTAREA, marginBottom: 8 }} placeholder='"Hola, antes de continuar necesito saber..."' />
              </div>

              {/* Outcome (terminal) */}
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: hasOutcome ? '#10b981' : 'var(--lumen-text-muted)', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Target size={9} /> Resultado final {hasOutcome ? '' : '(opcional, solo si es nodo hoja)'}
                </label>
                <input value={node.outcome || ''} onChange={(e) => updateNode(node.id, { outcome: e.target.value })}
                  style={{ ...INPUT, marginBottom: 10, fontWeight: 600 }} placeholder="$120.000" />
              </div>

              {/* Options */}
              <div>
                <label style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                  Opciones de ramificación
                </label>
                {node.options.length === 0 && (
                  <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', fontStyle: 'italic', marginBottom: 6 }}>
                    Sin opciones → este paso es un nodo hoja (muestra el resultado final).
                  </p>
                )}
                {node.options.map((opt) => {
                  const targetNode = nodes.find((n) => n.id === opt.next_node_id);
                  return (
                  <div key={opt.id} style={{ marginBottom: 6, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)', borderRadius: 5 }}>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 4 }}>
                      <input value={opt.label} onChange={(e) => updateOption(node.id, opt.id, { label: e.target.value })}
                        style={{ ...INPUT, flex: 1, fontSize: 11 }} placeholder="Texto del botón (ej: '1 máquina')" />
                      <button onClick={() => deleteOption(node.id, opt.id)} style={BTN_DANGER} title="Eliminar opción"><X size={11} /></button>
                    </div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center', paddingLeft: 4 }}>
                      <CornerDownRight size={11} style={{ color: 'var(--lumen-text-muted)', flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)', flexShrink: 0 }}>va a:</span>
                      <select
                        value={opt.next_node_id || ''}
                        onChange={(e) => updateOption(node.id, opt.id, { next_node_id: e.target.value || null })}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--lumen-border)', borderRadius: 5, padding: '5px 7px', color: targetNode ? color : 'var(--lumen-text-muted)', fontSize: 11, cursor: 'pointer', outline: 'none', fontWeight: targetNode ? 600 : 400 }}
                      >
                        <option value="">(siguiente en secuencia)</option>
                        {nodeOptions.filter((n) => n.id !== node.id).map((n) => (
                          <option key={n.id} value={n.id}>{n.title || '(sin título)'}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );})}
                <button onClick={() => addOption(node.id)} style={{ ...BTN_GHOST, fontSize: 10, borderStyle: 'dashed', width: '100%', justifyContent: 'center' }}>
                  <Plus size={9} /> Agregar opción
                </button>
              </div>
            </div>
          )}
        </div>
      );})}

      {/* Add node */}
      <button onClick={addNode} style={{ ...BTN_GHOST, width: '100%', justifyContent: 'center', borderStyle: 'dashed', marginBottom: 12 }}>
        <Plus size={11} /> Agregar paso
      </button>

      {/* Save / Delete */}
      <div style={{ display: 'flex', gap: 8 }}>
        {dirty && (
          <button onClick={handleSave} disabled={saving} style={BTN_ACCENT}>
            {saving ? <><Loader2 size={11} className="animate-spin" /> Guardando</> : saved ? <><Check size={11} /> Guardado</> : <><Save size={11} /> Guardar rama</>}
          </button>
        )}
        {saved && !dirty && (
          <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={11} /> Guardado
          </span>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={handleDelete} style={{ ...BTN_GHOST, color: '#f87171', borderColor: 'rgba(239,68,68,0.25)' }}>
          <Trash2 size={11} /> Eliminar rama
        </button>
      </div>
    </div>
  );
}

function DecisionTreeEditor() {
  const [branches,   setBranches]   = useState([]);
  const [expanded,   setExpanded]   = useState(null); // branch id
  const [newName,    setNewName]    = useState('');
  const [newColor,   setNewColor]   = useState('#7E3FF2');
  const [addingBr,   setAddingBr]   = useState(false);
  const [creating,   setCreating]   = useState(false);

  useEffect(() => {
    window.lumen.ac3.branches.getAll().then(setBranches).catch(() => {});
  }, []);

  const createBranch = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const br = await window.lumen.ac3.branches.create({ name: newName.trim(), color: newColor, nodes: [], order_idx: branches.length });
      setBranches((p) => [...p, br]);
      setExpanded(br.id);
      setAddingBr(false); setNewName(''); setNewColor('#7E3FF2');
    } catch {} finally { setCreating(false); }
  };

  return (
    <div>
      {branches.length === 0 && !addingBr && (
        <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', marginBottom: 10 }}>Sin ramas aún. Crea la primera.</p>
      )}

      {branches.map((br) => (
        <div key={br.id} style={{ marginBottom: 8, border: '1px solid var(--lumen-border)', borderRadius: 6, overflow: 'hidden' }}>
          <button
            onClick={() => setExpanded((v) => v === br.id ? null : br.id)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'rgba(255,255,255,0.02)', border: 'none', cursor: 'pointer', borderLeft: `3px solid ${br.color || '#7E3FF2'}` }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--lumen-text)', flex: 1, textAlign: 'left' }}>{br.name}</span>
            <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)', fontFamily: 'monospace' }}>
              {Array.isArray(br.nodes) ? br.nodes.length : 0} pasos
            </span>
            {expanded === br.id
              ? <ChevronUp size={12} style={{ color: 'var(--lumen-text-muted)' }} />
              : <ChevronDown size={12} style={{ color: 'var(--lumen-text-muted)' }} />}
          </button>

          {expanded === br.id && (
            <div style={{ padding: '0 12px 12px', background: 'rgba(255,255,255,0.01)' }}>
              <BranchNodeEditor
                key={br.id}
                branch={br}
                onSaved={(updated) => setBranches((p) => p.map((x) => x.id === updated.id ? updated : x))}
                onDeleted={(id) => { setBranches((p) => p.filter((x) => x.id !== id)); setExpanded(null); }}
              />
            </div>
          )}
        </div>
      ))}

      {addingBr ? (
        <div style={{ padding: 12, border: '1px dashed rgba(126,63,242,0.4)', borderRadius: 6, background: 'rgba(126,63,242,0.04)' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            {BRANCH_COLORS.map((c) => (
              <button key={c} onClick={() => setNewColor(c)}
                style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: newColor === c ? '2px solid white' : '2px solid transparent', cursor: 'pointer', padding: 0, flexShrink: 0 }} />
            ))}
          </div>
          <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createBranch(); if (e.key === 'Escape') setAddingBr(false); }}
            style={{ ...INPUT, marginBottom: 8 }} placeholder="Nombre de la rama (ej. Reembolso, Acceso urgente...)" />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={createBranch} disabled={!newName.trim() || creating} style={BTN_ACCENT}>
              {creating ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />} Crear rama
            </button>
            <button onClick={() => { setAddingBr(false); setNewName(''); }} style={BTN_GHOST}><X size={11} /> Cancelar</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAddingBr(true)} style={{ ...BTN_GHOST, width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}>
          <Plus size={11} /> Nueva rama
        </button>
      )}
    </div>
  );
}

// ─── LU Chat History ─────────────────────────────────────────────────────────

const LU_STORAGE_KEY = 'lumen_lu_history';

function LuHistorySection() {
  const [sessions, setSessions] = useState([]);

  const reload = () => {
    try { setSessions(JSON.parse(localStorage.getItem(LU_STORAGE_KEY) || '[]')); } catch { setSessions([]); }
  };

  useEffect(() => { reload(); }, []);

  const deleteSession = (id) => {
    const updated = sessions.filter((s) => s.id !== id);
    localStorage.setItem(LU_STORAGE_KEY, JSON.stringify(updated));
    setSessions(updated);
  };

  const deleteAll = () => {
    if (!confirm('¿Borrar todo el historial de conversaciones con LU?')) return;
    localStorage.removeItem(LU_STORAGE_KEY);
    setSessions([]);
  };

  const exportSession = (session) => {
    const lines = [];
    lines.push(`Conversación con LU — ${new Date(session.startedAt).toLocaleString()}`);
    lines.push('='.repeat(60));
    session.messages.forEach((m) => {
      lines.push('');
      lines.push(m.role === 'user' ? '▶ Tú:' : '◀ LU:');
      lines.push(m.text || '');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LU_chat_${session.startedAt.slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAll = () => {
    if (sessions.length === 0) return;
    const lines = ['HISTORIAL COMPLETO DE CONVERSACIONES CON LU', '='.repeat(60), ''];
    sessions.forEach((session) => {
      lines.push(`Conversación — ${new Date(session.startedAt).toLocaleString()}`);
      lines.push('-'.repeat(40));
      session.messages.forEach((m) => {
        lines.push(m.role === 'user' ? '▶ Tú:' : '◀ LU:');
        lines.push(m.text || '');
        lines.push('');
      });
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LU_historial_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (sessions.length === 0) {
    return (
      <div style={{ fontSize: 12, color: 'var(--lumen-text-muted)', padding: '10px 0', lineHeight: 1.6 }}>
        Sin conversaciones guardadas. Cada vez que presiones <strong style={{ color: 'var(--lumen-text-secondary)' }}>+ Nuevo Chat</strong> en LU,
        la conversación anterior se archiva aquí automáticamente.
      </div>
    );
  }

  return (
    <div>
      {/* Actions row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <button onClick={exportAll} style={BTN_GHOST}>
          <X size={11} style={{ display: 'none' }} />
          ↓ Exportar todo
        </button>
        <button onClick={deleteAll} style={{ ...BTN_GHOST, color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}>
          Borrar historial
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--lumen-text-muted)', alignSelf: 'center' }}>
          {sessions.length} conversación{sessions.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Session list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
        {sessions.map((session) => {
          const date = new Date(session.startedAt);
          const msgCount = session.messages?.length || 0;
          const preview = session.messages?.find((m) => m.role === 'user')?.text || '';
          return (
            <div key={session.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 6,
              border: '1px solid var(--lumen-border)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color: 'var(--lumen-text-secondary)', fontWeight: 500 }}>
                    {date.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)' }}>
                    {date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span style={{
                    fontSize: 9, padding: '1px 5px', borderRadius: 999,
                    background: 'rgba(255,255,255,0.06)', color: 'var(--lumen-text-muted)',
                  }}>
                    {msgCount} mensajes
                  </span>
                </div>
                {preview && (
                  <p style={{
                    fontSize: 11, color: 'var(--lumen-text-muted)',
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}>
                    {preview.slice(0, 80)}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => exportSession(session)}
                  title="Exportar como .txt"
                  style={{ ...BTN_GHOST, padding: '3px 8px', fontSize: 10 }}
                >
                  Exportar
                </button>
                <button
                  onClick={() => deleteSession(session.id)}
                  title="Eliminar"
                  style={BTN_DANGER}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export default function Settings({ onModelChange, sectionLabels, onSectionLabelsChange }) {
  const [apiKey,       setApiKey]       = useState('');
  const [apiKeyInput,  setApiKeyInput]  = useState('');
  const [showKey,      setShowKey]      = useState(false);
  const [model,        setModel]        = useState('gemini-2.5-flash');
  const [email,        setEmail]        = useState('');
  const [emailInput,   setEmailInput]   = useState('');
  const [accentColor,  setAccentColor]  = useState('#ffffff');
  const [calConnected, setCalConnected] = useState(false);
  const [calBusy,      setCalBusy]      = useState(false);
  const [version,      setVersion]      = useState('');
  const [checking,     setChecking]     = useState(false);
  const [saved,        setSaved]        = useState('');
  const [labelInputs,  setLabelInputs]  = useState(() => {
    const d = {}; NAV_LABEL_DEFS.forEach((x) => { d[x.id] = x.default; }); return d;
  });
  const [labelSaved,   setLabelSaved]   = useState(false);
  const [testingAi,    setTestingAi]    = useState(false);
  const [aiTestResult, setAiTestResult] = useState(null); // { ok, message, ... }
  const [caseIdMode,   setCaseIdMode]   = useState('auto');
  const [showPromos,   setShowPromos]   = useState(true);

  const flash = (tag) => { setSaved(tag); setTimeout(() => setSaved(''), 2000); };

  useEffect(() => {
    if (sectionLabels) setLabelInputs((p) => ({ ...p, ...sectionLabels }));
  }, [sectionLabels]);

  useEffect(() => {
    Promise.all([
      window.lumen.settings.getApiKey(),
      window.lumen.settings.getModel(),
      window.lumen.settings.getUserEmail(),
      window.lumen.settings.getAccentColor(),
      window.lumen.app.getVersion(),
      window.lumen.calendar.isAuthenticated(),
      window.lumen.settings.getCaseIdMode(),
      window.lumen.settings.getShowPromos(),
    ]).then(([k, m, em, ac, v, conn, cim, sp]) => {
      setApiKey(k ? k.slice(0, 7) + '…' + k.slice(-4) : '');
      setModel(MODELS.find((x) => x.id === m) ? m : 'gemini-2.5-flash');
      setEmail(em || ''); setEmailInput(em || '');
      if (ac) { setAccentColor(ac); document.documentElement.style.setProperty('--lumen-accent', ac); }
      setVersion(v || '');
      setCalConnected(conn);
      setCaseIdMode(cim || 'auto');
      setShowPromos(sp !== false);
    }).catch(() => {});
  }, []);

  const saveKey = async () => {
    if (!apiKeyInput.trim()) return;
    await window.lumen.settings.setApiKey(apiKeyInput.trim());
    setApiKey(apiKeyInput.slice(0, 7) + '…' + apiKeyInput.slice(-4));
    setApiKeyInput(''); flash('key');
  };

  const saveEmail = async () => {
    const v = emailInput.trim();
    if (v === email) return;
    await window.lumen.settings.setUserEmail(v);
    setEmail(v); flash('email');
  };

  const saveModel = async (id) => {
    setModel(id);
    await window.lumen.settings.setModel(id);
    onModelChange?.(id);
  };

  const saveAccent = async (color) => {
    setAccentColor(color);
    document.documentElement.style.setProperty('--lumen-accent', color);
    await window.lumen.settings.setAccentColor(color).catch(() => {});
  };

  const connectCal = async () => {
    setCalBusy(true);
    try { await window.lumen.calendar.connect(); setCalConnected(true); flash('cal'); }
    catch (e) { alert(`Error al conectar Google Calendar:\n${e.message}`); }
    finally { setCalBusy(false); }
  };

  const disconnectCal = async () => {
    if (!confirm('¿Desconectar Google Calendar?')) return;
    await window.lumen.calendar.disconnect();
    setCalConnected(false);
  };

  const saveLabelInput = (id, value) => {
    const t = value.trim();
    if (!t) return;
    const nl = { ...(sectionLabels || {}), ...labelInputs, [id]: t };
    setLabelInputs((p) => ({ ...p, [id]: t }));
    onSectionLabelsChange?.(nl);
    setLabelSaved(true);
    setTimeout(() => setLabelSaved(false), 2000);
  };

  const resetLabels = () => {
    const d = {}; NAV_LABEL_DEFS.forEach((x) => { d[x.id] = x.default; });
    setLabelInputs(d); onSectionLabelsChange?.(d);
    setLabelSaved(true); setTimeout(() => setLabelSaved(false), 2000);
  };

  const checkUpdate = async () => {
    setChecking(true);
    try { await window.lumen.updater.check(); }
    catch {}
    finally { setTimeout(() => setChecking(false), 1500); }
  };

  const testAiConnection = async () => {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await window.lumen.ai.testConnection();
      setAiTestResult(res);
    } catch (e) {
      setAiTestResult({ ok: false, message: e?.message || 'Error desconocido' });
    } finally {
      setTestingAi(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SettingsIcon size={15} style={{ color: 'var(--lumen-accent)' }} />
        </div>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--lumen-text)', letterSpacing: '0.02em' }}>Configuración</h1>
          <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', marginTop: 1 }}>LUMEN v{version}</p>
        </div>
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

      {/* ── LEFT COLUMN — config ──────────────────────────── */}
      <div className="bento-card" style={{ padding: '0 20px' }}>

        {/* Correo */}
        {!calConnected && (
          <Row label="Tu correo" icon={Mail} iconColor="#4285F4" hint="Solo se guarda localmente.">
            <div className="flex gap-2">
              <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveEmail()} onBlur={saveEmail}
                placeholder="tu.nombre@gmail.com" className="dark-input flex-1" />
              {saved === 'email' && <span className="flex items-center gap-1 text-[11px]" style={{ color: '#10b981' }}><Check size={11} /> Guardado</span>}
            </div>
          </Row>
        )}

        {/* API Key */}
        {!apiKey && (
          <Row label="Google AI — API Key" icon={Key}
            hint={<>Cifrada con DPAPI. Obtén tu key en <span style={{ color: 'var(--lumen-accent)' }}>aistudio.google.com</span></>}>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input type={showKey ? 'text' : 'password'} value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveKey()}
                  placeholder="AIza…" className="dark-input !font-mono !pr-9" style={{ fontSize: 12 }} />
                <button onClick={() => setShowKey(!showKey)}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  {showKey ? <EyeOff size={12} style={{ color: 'var(--lumen-text-muted)' }} /> : <Eye size={12} style={{ color: 'var(--lumen-text-muted)' }} />}
                </button>
              </div>
              <button onClick={saveKey} disabled={!apiKeyInput.trim()} className="btn-accent !py-2 !px-4">
                {saved === 'key' ? <><Check size={11} /> OK</> : 'Guardar'}
              </button>
            </div>
          </Row>
        )}

        {/* Motor Gemini */}
        <Row label="Motor Gemini" icon={Cpu}>
          <div className="flex gap-2">
            {MODELS.map((m) => {
              const active = model === m.id;
              return (
                <button key={m.id} onClick={() => saveModel(m.id)} style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  background: active ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.15s',
                }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: active ? 'var(--lumen-accent)' : 'var(--lumen-text)', marginBottom: 2 }}>{m.label}</p>
                  <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)' }}>{m.desc}</p>
                </button>
              );
            })}
          </div>
        </Row>

        {/* Google Calendar */}
        <Row label="Google Calendar" icon={CalendarDays} iconColor="#4285F4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {calConnected
                ? <><Wifi size={13} style={{ color: '#10b981' }} /><span style={{ fontSize: 12, color: '#10b981' }}>Conectado</span></>
                : <><WifiOff size={13} style={{ color: 'var(--lumen-text-muted)' }} /><span style={{ fontSize: 12, color: 'var(--lumen-text-muted)' }}>Sin conectar</span></>}
              {saved === 'cal' && <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 3 }}><Check size={10} /> Listo</span>}
            </div>
            {calConnected
              ? <button onClick={disconnectCal} style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}>Desconectar</button>
              : <button onClick={connectCal} disabled={calBusy} className="btn-accent">
                  {calBusy ? <><RefreshCw size={12} className="animate-spin" /> Conectando…</> : <><Wifi size={12} /> Conectar con Google</>}
                </button>}
          </div>
        </Row>

        {/* Color acento */}
        <Row label="Color de acento" icon={Palette} iconColor={accentColor}>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {ACCENT_PRESETS.map((c) => (
                <button key={c} onClick={() => saveAccent(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer', outline: accentColor === c ? '2px solid white' : '2px solid transparent', outlineOffset: 2, transition: 'outline 0.15s, transform 0.15s', transform: accentColor === c ? 'scale(1.2)' : 'scale(1)' }} />
              ))}
            </div>
            <input type="color" value={accentColor} onChange={(e) => saveAccent(e.target.value)} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'none', cursor: 'pointer', padding: 2 }} />
            <button onClick={() => saveAccent('#ffffff')} style={{ fontSize: 11, color: 'var(--lumen-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Reset</button>
          </div>
        </Row>

        {/* Nombres secciones */}
        <Row label="Nombres de secciones" icon={Tag} iconColor="#a78bfa"
          hint="Renombra cada sección. Los cambios se guardan automáticamente.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {NAV_LABEL_DEFS.map((def) => (
              <div key={def.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)', minWidth: 90, letterSpacing: '0.04em' }}>{def.hint}</span>
                <input type="text" value={labelInputs[def.id] ?? def.default}
                  onChange={(e) => setLabelInputs((p) => ({ ...p, [def.id]: e.target.value }))}
                  onBlur={(e) => saveLabelInput(def.id, e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveLabelInput(def.id, e.target.value)}
                  placeholder={def.default}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--lumen-border)', borderRadius: 5, padding: '6px 10px', color: 'var(--lumen-text)', fontSize: 12, outline: 'none' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'; }}
                />
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <button onClick={resetLabels} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 5, fontSize: 11, background: 'none', border: '1px solid var(--lumen-border)', color: 'var(--lumen-text-muted)', cursor: 'pointer' }}>
                <RotateCcw size={11} /> Restablecer nombres
              </button>
              {labelSaved && <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={11} /> Guardado</span>}
            </div>
          </div>
        </Row>

        {/* Diagnóstico de IA */}
        <Row label="Diagnóstico de Gemini" icon={Zap} iconColor="#fbbf24"
          hint="Verifica que la API Key actual puede generar respuestas. Útil si LU o el análisis AC3 no responden.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                onClick={testAiConnection}
                disabled={testingAi}
                className="btn-accent"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {testingAi
                  ? <><Loader2 size={12} className="animate-spin" /> Probando…</>
                  : <><Zap size={12} /> Probar conexión</>}
              </button>
              {aiTestResult && aiTestResult.keyPreview && (
                <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)', fontFamily: 'monospace' }}>
                  Key: {aiTestResult.keyPreview}
                </span>
              )}
            </div>

            {aiTestResult && (
              <div style={{
                padding: '10px 12px',
                borderRadius: 6,
                background: aiTestResult.ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${aiTestResult.ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  {aiTestResult.ok
                    ? <Check size={14} style={{ color: '#10b981', marginTop: 1, flexShrink: 0 }} />
                    : <AlertTriangle size={14} style={{ color: '#f87171', marginTop: 1, flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 11, fontWeight: 600,
                      color: aiTestResult.ok ? '#10b981' : '#f87171',
                      marginBottom: 4,
                    }}>
                      {aiTestResult.ok
                        ? `Conexión OK · ${aiTestResult.model || 'gemini'}`
                        : 'Fallo de conexión'}
                    </p>
                    {aiTestResult.ok ? (
                      <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', lineHeight: 1.5 }}>
                        Respuesta recibida: "{aiTestResult.sample}"
                      </p>
                    ) : (
                      <p style={{ fontSize: 11, color: 'var(--lumen-text)', lineHeight: 1.55 }}>
                        {aiTestResult.message}
                      </p>
                    )}
                    {!aiTestResult.ok && aiTestResult.raw && (
                      <details style={{ marginTop: 6 }}>
                        <summary style={{ fontSize: 10, color: 'var(--lumen-text-muted)', cursor: 'pointer' }}>
                          Ver error técnico
                        </summary>
                        <pre style={{
                          fontSize: 9, color: 'var(--lumen-text-muted)',
                          background: 'rgba(0,0,0,0.3)', padding: 6, marginTop: 4,
                          borderRadius: 3, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                          maxHeight: 120, overflowY: 'auto',
                        }}>
                          {aiTestResult.raw}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Row>

        {/* ── SISTEMA DE CASOS ── */}
        <Row label="Sistema de casos" icon={Briefcase} iconColor="#60a5fa"
          hint="Define cómo se identifican los casos en Decisiones. En modo automático se genera un ID único (CASO-YYYYMMDD-NNNN). En modo manual podés ingresar el número de caso externo.">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--lumen-text)', fontWeight: 500, marginBottom: 2 }}>
                {caseIdMode === 'auto' ? 'ID automático' : 'ID manual / externo'}
              </p>
              <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', lineHeight: 1.4 }}>
                {caseIdMode === 'auto'
                  ? 'CASO-YYYYMMDD-NNNN generado al abrir el caso'
                  : 'Ingresás el número de caso al iniciar'}
              </p>
            </div>
            {/* Inline toggle switch */}
            <button
              onClick={() => {
                const next = caseIdMode === 'auto' ? 'manual' : 'auto';
                setCaseIdMode(next);
                window.lumen.settings.setCaseIdMode(next).catch(() => {});
              }}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                position: 'relative', flexShrink: 0, transition: 'background 0.2s',
                background: caseIdMode === 'manual' ? 'rgba(96,165,250,0.7)' : 'rgba(255,255,255,0.12)',
              }}
              title={caseIdMode === 'auto' ? 'Cambiar a manual' : 'Cambiar a automático'}
            >
              <span style={{
                position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
                left: caseIdMode === 'manual' ? 23 : 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
        </Row>

        {/* ── PROMOCIONES ── */}
        <Row label="Promociones de comida" icon={Utensils} iconColor="#f59e0b"
          hint="Muestra una tabla con promociones de negocios de comida cerca de Toluca de Lerdo en el Dashboard. Se actualiza al abrir el Dashboard.">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
            <div>
              <p style={{ fontSize: 12, color: 'var(--lumen-text)', fontWeight: 500, marginBottom: 2 }}>
                {showPromos ? 'Widget activo' : 'Widget oculto'}
              </p>
              <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', lineHeight: 1.4 }}>
                {showPromos ? 'Visible en Dashboard' : 'No aparece en el Dashboard'}
              </p>
            </div>
            <button
              onClick={() => {
                const next = !showPromos;
                setShowPromos(next);
                window.lumen.settings.setShowPromos(next).catch(() => {});
              }}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                position: 'relative', flexShrink: 0, transition: 'background 0.2s',
                background: showPromos ? 'rgba(245,158,11,0.7)' : 'rgba(255,255,255,0.12)',
              }}
            >
              <span style={{
                position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
                left: showPromos ? 23 : 3,
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>
        </Row>

        {/* Sistema */}
        <Row label="Sistema" icon={Info}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span style={{ fontSize: 11, color: 'var(--lumen-text-muted)' }}>
                Version <code style={{ fontFamily: 'monospace', color: 'var(--lumen-text-secondary)' }}>v{version}</code>
              </span>
              <span style={{ fontSize: 11, color: 'var(--lumen-text-muted)' }}>
                Motor <span style={{ color: '#4285F4' }}>Google Gemini</span>
              </span>
            </div>
            <button onClick={checkUpdate} disabled={checking} className="btn-ghost !py-1.5 !px-3" style={{ fontSize: 11 }}>
              <RefreshCw size={11} className={checking ? 'animate-spin' : ''} />
              {checking ? 'Verificando…' : 'Actualizar'}
            </button>
          </div>
        </Row>

        {/* Salir */}
        <div style={{ padding: '16px 0' }}>
          <button onClick={() => window.lumen.app.quit()}
            className="flex items-center gap-2"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12, color: 'var(--lumen-text-muted)', transition: 'color 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--lumen-text-muted)'; }}>
            <LogOut size={13} /> Salir de LUMEN
          </button>
        </div>

      </div>{/* END left col */}

      {/* ── RIGHT COLUMN — content editors ───────────────── */}
      <div className="bento-card" style={{ padding: '0 20px' }}>

        {/* ── PLANTILLAS DE TEXTO ── */}
        <Row label="Plantillas de texto" icon={Tag} iconColor="#4ade80" collapsible>
          <TextTemplatesEditor />
        </Row>

        {/* ── PLANTILLAS DE EMAIL ── */}
        <Row label="Plantillas de email" icon={Mail} iconColor="#60a5fa" collapsible>
          <EmailTemplatesEditor />
        </Row>

        {/* ── SPEECHES / GUIONES ── */}
        <Row label="Speeches y guiones" icon={MessageSquare} iconColor="#a78bfa" collapsible
          hint="Guiones de voz para guiar conversaciones con clientes. Disponibles en Decisiones con modo teleprompter.">
          <SpeechesEditor />
        </Row>

        {/* ── ÁRBOL DE DECISIONES ── */}
        <Row label="Árbol de decisiones" icon={GitBranch} iconColor="#a78bfa" collapsible
          hint="Crea ramas y define los pasos del proceso. Cada paso tiene un speech (qué decir) y opciones de selección para el agente.">
          <DecisionTreeEditor />
        </Row>

        {/* ── HISTORIAL DE CHAT LU ── */}
        <Row label="Historial de chat con LU" icon={MessageSquare} iconColor="#7c6af7" collapsible
          hint="Las conversaciones con LU se archivan cada vez que inicias un nuevo chat. Puedes exportarlas como .txt o eliminarlas desde aquí.">
          <LuHistorySection />
        </Row>

      </div>{/* END right col */}

      </div>{/* END grid */}
    </div>
  );
}
