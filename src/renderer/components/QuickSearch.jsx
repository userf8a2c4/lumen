import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, FileText, BookOpen, Users, MessageSquare, X, ArrowRight, Loader2 } from 'lucide-react';

/* ── Config ─────────────────────────────────────────────── */
const CATEGORIES = [
  { id: 'all',      label: 'Todos' },
  { id: 'notes',    label: 'Notas',      icon: FileText,      color: '#6366f1' },
  { id: 'policies', label: 'Biblioteca', icon: BookOpen,      color: '#10b981' },
  { id: 'contacts', label: 'Contactos',  icon: Users,         color: '#f59e0b' },
  { id: 'speeches', label: 'Speeches',   icon: MessageSquare, color: '#8b5cf6' },
];

const ICON_MAP = {
  notes:    { Icon: FileText,      color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  label: 'Nota'      },
  policies: { Icon: BookOpen,      color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Política'  },
  contacts: { Icon: Users,         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Contacto'  },
  speeches: { Icon: MessageSquare, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Speech'    },
};

/* Strip HTML tags for plain-text excerpts */
function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/* ── Result row ─────────────────────────────────────────── */
function ResultRow({ result, active, onClick }) {
  const ref = useRef(null);
  const meta = ICON_MAP[result.type] || ICON_MAP.notes;
  const { Icon } = meta;

  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({ block: 'nearest' });
    }
  }, [active]);

  const excerpt = stripHtml(result.excerpt || '');

  return (
    <button
      ref={ref}
      onClick={onClick}
      className="w-full flex items-start gap-3 px-4 py-2.5 transition-colors"
      style={{
        background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Icon badge */}
      <div style={{
        width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: meta.bg, flexShrink: 0, marginTop: 1,
      }}>
        <Icon size={14} style={{ color: meta.color }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--lumen-text)', truncate: true }}>
            {result.name || '(sin nombre)'}
          </span>
          {result.extra && (
            <span style={{
              fontSize: 10, padding: '1px 6px', borderRadius: 999, background: meta.bg,
              color: meta.color, flexShrink: 0, fontWeight: 500,
            }}>
              {result.extra}
            </span>
          )}
        </div>
        {excerpt && (
          <p style={{
            fontSize: 11, color: 'var(--lumen-text-muted)', marginTop: 1,
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}>
            {excerpt.slice(0, 120)}
          </p>
        )}
      </div>

      {/* Arrow */}
      <ArrowRight size={12} style={{ color: 'var(--lumen-text-muted)', opacity: active ? 0.7 : 0, flexShrink: 0, marginTop: 7 }} />
    </button>
  );
}

/* ── Main component ─────────────────────────────────────── */
export default function QuickSearch({ onClose, onNavigate }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [results, setResults] = useState({ notes: [], policies: [], contacts: [], speeches: [] });
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  /* Auto-focus */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* Keyboard: Escape closes */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  /* Search with debounce */
  const doSearch = useCallback((q) => {
    clearTimeout(debounceRef.current);
    if (!q.trim() || q.trim().length < 2) {
      setResults({ notes: [], policies: [], contacts: [], speeches: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await window.lumen.quickSearch(q.trim());
        setResults(r || { notes: [], policies: [], contacts: [], speeches: [] });
        setActiveIdx(0);
      } catch (err) {
        console.error('QuickSearch error:', err);
      } finally {
        setLoading(false);
      }
    }, 220);
  }, []);

  const handleInput = (e) => {
    const v = e.target.value;
    setQuery(v);
    doSearch(v);
  };

  /* Flatten results for keyboard nav */
  const flat = [
    ...results.notes.map((r) => ({ ...r, type: 'notes' })),
    ...results.policies.map((r) => ({ ...r, type: 'policies' })),
    ...results.contacts.map((r) => ({ ...r, type: 'contacts' })),
    ...results.speeches.map((r) => ({ ...r, type: 'speeches' })),
  ].filter((r) => filter === 'all' || r.type === filter);

  const total = flat.length;

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, total - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && total > 0) {
      e.preventDefault();
      handleSelect(flat[activeIdx]);
    }
  };

  const handleSelect = (result) => {
    onClose();
    if (!result) return;
    switch (result.type) {
      case 'notes':    onNavigate('notes',    { openNoteId: result.id });    break;
      case 'policies': onNavigate('knowledge', { openPolicyId: result.id }); break;
      case 'contacts': onNavigate('ac3',      { openContactId: result.id }); break;
      case 'speeches': onNavigate('ac3',      { openSpeechId: result.id });  break;
      default:         onNavigate('dashboard');
    }
  };

  /* Filtered view: grouped by type (only non-empty groups) */
  const groups = [
    { key: 'notes',    items: results.notes.map((r) => ({ ...r, type: 'notes' })) },
    { key: 'policies', items: results.policies.map((r) => ({ ...r, type: 'policies' })) },
    { key: 'contacts', items: results.contacts.map((r) => ({ ...r, type: 'contacts' })) },
    { key: 'speeches', items: results.speeches.map((r) => ({ ...r, type: 'speeches' })) },
  ].filter((g) => g.items.length > 0 && (filter === 'all' || filter === g.key));

  const hasResults = groups.length > 0;
  const showEmpty  = query.trim().length >= 2 && !loading && !hasResults;

  /* Running active index counter across groups */
  let runningIdx = 0;

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '12vh',
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 620,
          background: 'var(--lumen-card)',
          border: '1px solid var(--lumen-border)',
          borderRadius: 16,
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          maxHeight: '70vh',
        }}
      >
        {/* Input row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid var(--lumen-border)',
        }}>
          {loading
            ? <Loader2 size={18} style={{ color: 'var(--lumen-accent)', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
            : <Search size={18} style={{ color: 'var(--lumen-text-muted)', flexShrink: 0 }} />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Buscar notas, políticas, contactos, speeches..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 15, color: 'var(--lumen-text)',
              fontFamily: 'inherit',
            }}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults({ notes: [], policies: [], contacts: [], speeches: [] }); inputRef.current?.focus(); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--lumen-text-muted)', display: 'flex' }}
            >
              <X size={16} />
            </button>
          )}
          <kbd style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 5, flexShrink: 0,
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--lumen-border)',
            color: 'var(--lumen-text-muted)', fontFamily: 'monospace',
          }}>Esc</kbd>
        </div>

        {/* Category filter pills */}
        <div style={{
          display: 'flex', gap: 6, padding: '10px 14px',
          borderBottom: '1px solid var(--lumen-border)',
          overflowX: 'auto',
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setFilter(cat.id); setActiveIdx(0); }}
              style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
                border: filter === cat.id ? `1px solid ${cat.color || 'var(--lumen-accent)'}` : '1px solid transparent',
                background: filter === cat.id
                  ? (cat.color ? `${cat.color}20` : 'rgba(255,255,255,0.08)')
                  : 'rgba(255,255,255,0.04)',
                color: filter === cat.id
                  ? (cat.color || 'var(--lumen-accent)')
                  : 'var(--lumen-text-muted)',
              }}
            >
              {cat.Icon && <cat.Icon size={10} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {!query.trim() && (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <Search size={28} strokeWidth={1} style={{ color: 'var(--lumen-text-muted)', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: 'var(--lumen-text-secondary)' }}>Escribe para buscar en todo LUMEN</p>
              <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', marginTop: 4 }}>
                Notas · Políticas · Contactos · Speeches
              </p>
            </div>
          )}

          {showEmpty && (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: 'var(--lumen-text-secondary)' }}>
                Sin resultados para <strong>"{query}"</strong>
              </p>
            </div>
          )}

          {groups.map((group) => {
            const meta = ICON_MAP[group.key];
            return (
              <div key={group.key}>
                {/* Group header */}
                <div style={{
                  padding: '8px 18px 4px',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <meta.Icon size={11} style={{ color: meta.color }} />
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--lumen-text-muted)' }}>
                    {meta.label}s
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)' }}>({group.items.length})</span>
                </div>
                {group.items.map((result) => {
                  const isActive = runningIdx === activeIdx;
                  const idx = runningIdx;
                  runningIdx++;
                  return (
                    <ResultRow
                      key={`${result.type}-${result.id}`}
                      result={result}
                      active={isActive}
                      onClick={() => handleSelect(result)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer hint */}
        {total > 0 && (
          <div style={{
            borderTop: '1px solid var(--lumen-border)',
            padding: '8px 18px',
            display: 'flex', gap: 16, alignItems: 'center',
          }}>
            <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)' }}>
              <kbd style={{ fontFamily: 'monospace', fontSize: 9, padding: '1px 4px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--lumen-border)' }}>↑↓</kbd> navegar
            </span>
            <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)' }}>
              <kbd style={{ fontFamily: 'monospace', fontSize: 9, padding: '1px 4px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--lumen-border)' }}>↵</kbd> abrir
            </span>
            <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)', marginLeft: 'auto' }}>
              {total} resultado{total !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
