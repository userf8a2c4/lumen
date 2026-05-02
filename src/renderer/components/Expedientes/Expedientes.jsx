import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen, Search, Clock, User, GitBranch, Tag,
  ChevronRight, X, FileText, Copy, Check, StickyNote,
  MessageSquare, Layers, BookOpen, Mail, AlignLeft,
  CalendarDays, Filter, ChevronDown,
} from 'lucide-react';

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(secs) {
  if (!secs || secs <= 0) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

const RESOURCE_ICONS = {
  text_template: AlignLeft,
  email_template: Mail,
  speech: MessageSquare,
  policy: BookOpen,
};
const RESOURCE_LABELS = {
  text_template: 'Plantilla texto',
  email_template: 'Plantilla email',
  speech: 'Speech',
  policy: 'Política',
};
const RESOURCE_COLORS = {
  text_template: '#60a5fa',
  email_template: '#34d399',
  speech: '#f59e0b',
  policy: '#a78bfa',
};

// ─── Case detail modal ────────────────────────────────────────────────────────

function DetailModal({ caseData, onClose }) {
  const [notes, setNotes]     = useState([]);
  const [copying, setCopying] = useState(false);

  const resources    = (() => { try { return JSON.parse(caseData.resources_used  || '[]'); } catch { return []; } })();
  const decisionPath = (() => { try { return JSON.parse(caseData.decision_path   || '[]'); } catch { return []; } })();
  const transcript   = (() => {
    try {
      if (caseData.chat_transcript) {
        const p = JSON.parse(caseData.chat_transcript);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch {}
    try { return JSON.parse(localStorage.getItem(`lumen_case_chat_${caseData.id}`) || '[]'); }
    catch { return []; }
  })();

  useEffect(() => {
    window.lumen.notes.getByCaseId?.(caseData.id).then(setNotes).catch(() => {});
  }, [caseData.id]);

  const clientName = [caseData.client_name, caseData.client_last_name].filter(Boolean).join(' ') || 'Sin cliente';
  const duration   = fmtDuration(caseData.duration_seconds);

  const exportTxt = () => {
    const lines = [
      `LUMEN — Expediente de caso`,
      `Caso: ${caseData.case_number}`,
      `Cliente: ${clientName}`,
      `Fecha: ${fmtDate(caseData.opened_at)} ${fmtTime(caseData.opened_at)}`,
      `Duración: ${duration}`,
      `Rama: ${caseData.branch_name || 'N/A'}`,
      ``,
      `── Resumen ──────────────────────────────`,
      caseData.summary || 'Sin resumen.',
      ``,
    ];
    if (decisionPath.length > 0) {
      lines.push(`── Ruta de decisión (${decisionPath.length} pasos) ────`);
      decisionPath.forEach((s, i) => {
        lines.push(`  ${i + 1}. ${s.title}${s.chosen ? ` → ${s.chosen}` : ''}`);
      });
      lines.push('');
    }
    if (resources.length > 0) {
      lines.push(`── Recursos usados (${resources.length}) ────────────`);
      resources.forEach((r) => {
        lines.push(`  [${RESOURCE_LABELS[r.type] || r.type}] ${r.title}`);
      });
      lines.push('');
    }
    if (transcript.length > 0) {
      lines.push(`── Conversación con LU (${transcript.length} mensajes) ──`);
      transcript.forEach((m) => {
        lines.push(`${m.role === 'user' ? 'Agente' : 'LU'}: ${m.text}`);
      });
      lines.push('');
    }
    if (notes.length > 0) {
      lines.push(`── Notas vinculadas (${notes.length}) ────────────`);
      notes.forEach((n) => {
        lines.push(`  [${n.title}]`);
        if (n.content) lines.push(`  ${n.content}`);
      });
    }
    const text = lines.join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${caseData.case_number}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const Section = ({ icon: Icon, color, title, count, children }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <Icon size={11} style={{ color: color || 'var(--lumen-text-muted)', flexShrink: 0 }} />
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.11em', color: 'var(--lumen-text-muted)' }}>
          {title}
        </span>
        {count !== undefined && (
          <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--lumen-text-muted)', marginLeft: 2 }}>({count})</span>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: 620, maxHeight: '90vh', background: '#13131b',
        border: '1px solid var(--lumen-border)', borderRadius: 10,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 28px 90px rgba(0,0,0,0.70)',
      }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: 'var(--lumen-accent)' }}>
                {caseData.case_number}
              </span>
              <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontWeight: 600 }}>
                Cerrado
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', margin: 0 }}>
              {fmtDate(caseData.opened_at)} · {fmtTime(caseData.opened_at)}
              {caseData.closed_at ? ` → ${fmtTime(caseData.closed_at)}` : ''} · {duration}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={exportTxt} title="Exportar .txt"
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 5, fontSize: 10, cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--lumen-border)', color: 'var(--lumen-text-muted)' }}>
              <FileText size={10} /> .txt
            </button>
            <button onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', padding: 4, display: 'flex' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            <div style={{ flex: 1, padding: '9px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)' }}>
              <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Cliente</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--lumen-text)', margin: 0 }}>{clientName}</p>
            </div>
            {caseData.branch_name && (
              <div style={{ flex: 1, padding: '9px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)' }}>
                <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Rama usada</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--lumen-accent)', margin: 0 }}>{caseData.branch_name}</p>
              </div>
            )}
            <div style={{ padding: '9px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)', textAlign: 'center' }}>
              <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Duración</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--lumen-text)', margin: 0, fontFamily: 'monospace' }}>{duration}</p>
            </div>
          </div>

          {/* Summary */}
          <Section icon={AlignLeft} color="var(--lumen-text-muted)" title="Resumen">
            {caseData.summary
              ? <p style={{ fontSize: 12, color: 'var(--lumen-text)', lineHeight: 1.65, whiteSpace: 'pre-wrap', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)', borderRadius: 6, margin: 0 }}>
                  {caseData.summary}
                </p>
              : <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', fontStyle: 'italic' }}>Sin resumen registrado.</p>
            }
          </Section>

          {/* Decision path */}
          {decisionPath.length > 0 && (
            <Section icon={GitBranch} color="#a78bfa" title="Ruta de decisión" count={decisionPath.length}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {decisionPath.map((step, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'baseline', gap: 8,
                    padding: '6px 10px', borderRadius: 5,
                    background: 'rgba(167,139,250,0.04)',
                    border: '1px solid rgba(167,139,250,0.15)',
                    borderLeft: '3px solid #a78bfa',
                  }}>
                    <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#a78bfa', flexShrink: 0, fontWeight: 700 }}>{i + 1}</span>
                    <span style={{ fontSize: 11, color: 'var(--lumen-text)', flex: 1, lineHeight: 1.4 }}>{step.title}</span>
                    {step.chosen && (
                      <span style={{ fontSize: 10, color: '#10b981', flexShrink: 0, fontWeight: 600 }}>→ {step.chosen}</span>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Resources */}
          {resources.length > 0 && (
            <Section icon={Layers} color="#60a5fa" title="Recursos usados" count={resources.length}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {resources.map((r, i) => {
                  const Icon = RESOURCE_ICONS[r.type] || Tag;
                  const color = RESOURCE_COLORS[r.type] || '#888';
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 9px', borderRadius: 20,
                      background: `${color}12`, border: `1px solid ${color}30`,
                    }}>
                      <Icon size={9} style={{ color, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, color: 'var(--lumen-text-secondary)' }}>
                        <span style={{ color, fontWeight: 600, marginRight: 4 }}>{RESOURCE_LABELS[r.type] || r.type}</span>
                        {r.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Linked notes */}
          {notes.length > 0 && (
            <Section icon={StickyNote} color="#f59e0b" title="Notas vinculadas" count={notes.length}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {notes.map((n) => (
                  <div key={n.id} style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.15)', borderLeft: '3px solid #f59e0b' }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: n.content ? 4 : 0 }}>{n.title}</p>
                    {n.content && <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }} className="line-clamp-3">{n.content}</p>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* LU Transcript */}
          {transcript.length > 0 && (
            <Section icon={MessageSquare} color="#34d399" title="Conversación con LU" count={transcript.length}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {transcript.map((m, i) => (
                  <div key={i} style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%', padding: '7px 11px', borderRadius: 6, fontSize: 11, lineHeight: 1.55,
                    background: m.role === 'user' ? 'rgba(126,63,242,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${m.role === 'user' ? 'rgba(126,63,242,0.22)' : 'var(--lumen-border)'}`,
                    color: 'var(--lumen-text)',
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: m.role === 'user' ? 'var(--lumen-accent)' : '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {m.role === 'user' ? 'Agente' : 'LU'}
                    </span>
                    {m.text}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Nothing tracked */}
          {decisionPath.length === 0 && resources.length === 0 && notes.length === 0 && transcript.length === 0 && !caseData.summary && (
            <div style={{ textAlign: 'center', padding: '28px 0', opacity: 0.45 }}>
              <FolderOpen size={28} style={{ color: 'var(--lumen-text-muted)', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 12, color: 'var(--lumen-text-muted)' }}>Sin actividad registrada para este caso.</p>
              <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', marginTop: 4 }}>El rastreo completo está disponible desde v0.1.16.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Case row in list ─────────────────────────────────────────────────────────

function CaseRow({ c, onClick }) {
  const resources    = (() => { try { return JSON.parse(c.resources_used || '[]'); } catch { return []; } })();
  const decisionPath = (() => { try { return JSON.parse(c.decision_path || '[]'); } catch { return []; } })();
  const clientName   = [c.client_name, c.client_last_name].filter(Boolean).join(' ') || '—';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%',
        padding: '10px 14px', textAlign: 'left',
        background: 'rgba(255,255,255,0.01)', border: 'none',
        borderBottom: '1px solid var(--lumen-border)', cursor: 'pointer',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}
    >
      {/* Case number */}
      <div style={{ flexShrink: 0, minWidth: 90 }}>
        <p style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: 'var(--lumen-accent)', margin: 0 }}>{c.case_number}</p>
        <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', margin: 0 }}>{fmtDate(c.opened_at)}</p>
      </div>

      {/* Client */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--lumen-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{clientName}</p>
        {c.branch_name && <p style={{ fontSize: 9, color: 'var(--lumen-accent)', margin: 0 }}>{c.branch_name}</p>}
      </div>

      {/* Summary snippet */}
      {c.summary && (
        <div style={{ flex: 2, minWidth: 0, display: 'none' /* hidden on narrow */ }}>
          <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.summary}</p>
        </div>
      )}

      {/* Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        {decisionPath.length > 0 && (
          <span title={`${decisionPath.length} pasos de decisión`} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 10, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
            {decisionPath.length} pasos
          </span>
        )}
        {resources.length > 0 && (
          <span title={`${resources.length} recursos usados`} style={{ fontSize: 9, padding: '2px 6px', borderRadius: 10, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa' }}>
            {resources.length} rec.
          </span>
        )}
        {c.duration_seconds > 0 && (
          <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--lumen-text-muted)' }}>
            {fmtDuration(c.duration_seconds)}
          </span>
        )}
      </div>

      <ChevronRight size={12} style={{ color: 'var(--lumen-text-muted)', flexShrink: 0, opacity: 0.5 }} />
    </button>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ cases }) {
  if (cases.length === 0) return null;

  const withPath  = cases.filter((c) => { try { return JSON.parse(c.decision_path || '[]').length > 0; } catch { return false; } }).length;
  const withRes   = cases.filter((c) => { try { return JSON.parse(c.resources_used || '[]').length > 0; } catch { return false; } }).length;
  const avgDur    = cases.filter((c) => c.duration_seconds > 0).reduce((sum, c, _, arr) => sum + c.duration_seconds / arr.length, 0);
  const topBranch = (() => {
    const counts = {};
    cases.forEach((c) => { if (c.branch_name) counts[c.branch_name] = (counts[c.branch_name] || 0) + 1; });
    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0];
  })();

  const items = [
    { label: 'Total casos',       value: cases.length,             color: 'var(--lumen-accent)' },
    { label: 'Con ruta decisión', value: withPath,                  color: '#a78bfa' },
    { label: 'Con recursos',      value: withRes,                   color: '#60a5fa' },
    { label: 'Duración promedio', value: fmtDuration(Math.round(avgDur)), color: 'var(--lumen-text-secondary)' },
    ...(topBranch ? [{ label: 'Rama más usada', value: topBranch, color: 'var(--lumen-accent)' }] : []),
  ];

  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--lumen-border)', flexShrink: 0 }}>
      {items.map((item, i) => (
        <div key={i} style={{ flex: 1, padding: '10px 14px', borderRight: i < items.length - 1 ? '1px solid var(--lumen-border)' : 'none' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: item.color, margin: 0, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</p>
          <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Expedientes() {
  const [cases, setCases]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [query, setQuery]       = useState('');
  const [dateFilter, setDateFilter] = useState('all'); // 'today' | 'week' | 'month' | 'all'
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { status: 'closed' };
      const today   = new Date();
      if (dateFilter === 'today') {
        filters.dateFrom = filters.dateTo = today.toISOString().slice(0, 10);
      } else if (dateFilter === 'week') {
        const from = new Date(today); from.setDate(today.getDate() - 7);
        filters.dateFrom = from.toISOString().slice(0, 10);
        filters.dateTo   = today.toISOString().slice(0, 10);
      } else if (dateFilter === 'month') {
        const from = new Date(today); from.setDate(today.getDate() - 30);
        filters.dateFrom = from.toISOString().slice(0, 10);
        filters.dateTo   = today.toISOString().slice(0, 10);
      }
      if (query.trim()) filters.query = query.trim();
      const data = await window.lumen.cases.search(filters);
      setCases(data || []);
    } catch {
      setCases([]);
    }
    setLoading(false);
  }, [query, dateFilter]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(load, 350);
    return () => clearTimeout(t);
  }, [query]); // eslint-disable-line

  const DATE_FILTERS = [
    { id: 'all',   label: 'Todos' },
    { id: 'today', label: 'Hoy' },
    { id: 'week',  label: '7 días' },
    { id: 'month', label: '30 días' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--lumen-bg)' }}>

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <FolderOpen size={13} style={{ color: 'var(--lumen-text-secondary)' }} />
        <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--lumen-text)', margin: 0 }}>
          Expedientes
        </h2>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)' }}>
          {loading ? '…' : `${cases.length} caso${cases.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Stats bar */}
      <StatsBar cases={cases} />

      {/* Filters */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Search */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--lumen-border)', borderRadius: 5 }}>
          <Search size={11} style={{ color: 'var(--lumen-text-muted)', flexShrink: 0 }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por número, cliente, resumen…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 11, color: 'var(--lumen-text)', caretColor: 'var(--lumen-accent)' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--lumen-text-muted)' }}>
              <X size={10} />
            </button>
          )}
        </div>

        {/* Date filter */}
        <div style={{ display: 'flex', gap: 3 }}>
          {DATE_FILTERS.map((f) => (
            <button key={f.id} onClick={() => setDateFilter(f.id)}
              style={{
                padding: '4px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                background: dateFilter === f.id ? 'var(--lumen-accent)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${dateFilter === f.id ? 'var(--lumen-accent)' : 'var(--lumen-border)'}`,
                color: dateFilter === f.id ? 'var(--lumen-bg)' : 'var(--lumen-text-muted)',
                transition: 'all 0.12s',
              }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
            <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)' }}>Cargando expedientes…</p>
          </div>
        ) : cases.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 180, gap: 10 }}>
            <FolderOpen size={32} style={{ color: 'var(--lumen-text-muted)', opacity: 0.3 }} />
            <p style={{ fontSize: 12, color: 'var(--lumen-text-muted)' }}>
              {query ? 'Sin resultados para esa búsqueda.' : 'No hay casos cerrados todavía.'}
            </p>
          </div>
        ) : (
          cases.map((c) => (
            <CaseRow key={c.id} c={c} onClick={() => setSelected(c)} />
          ))
        )}
      </div>

      {/* Detail modal */}
      {selected && <DetailModal caseData={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
