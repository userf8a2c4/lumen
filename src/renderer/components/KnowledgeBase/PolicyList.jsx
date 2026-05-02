import React, { useState } from 'react';
import { Edit3, Trash2, FileText, Globe, BookOpen, X, ExternalLink, Pencil, ChevronRight } from 'lucide-react';
import Modal from '../Modal';

/* ── Read-only policy detail view ─────────────────────────── */
function PolicyView({ policy, onEdit, onDelete, onViewExamples, onClose }) {
  const wordCount = (policy.content || '').split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div style={{ paddingBottom: 16, borderBottom: '1px solid var(--lumen-border)' }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wide"
                style={{ background: 'rgba(16,185,129,0.10)', color: '#10b981' }}
              >
                {policy.department}
              </span>
              {policy.source_url && (
                <a
                  href={policy.source_url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => { e.preventDefault(); window.open(policy.source_url); }}
                  className="flex items-center gap-1 text-[10px]"
                  style={{ color: 'var(--lumen-text-muted)', textDecoration: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--lumen-accent)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--lumen-text-muted)'; }}
                >
                  <Globe size={10} /> Fuente
                  <ExternalLink size={9} />
                </a>
              )}
            </div>
            <h2 className="text-[18px] font-semibold leading-snug" style={{ color: 'var(--lumen-text)' }}>
              {policy.name}
            </h2>
            {policy.description && (
              <p className="text-[12px] mt-1" style={{ color: 'var(--lumen-text-secondary)' }}>{policy.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <span className="text-[10px] font-mono" style={{ color: 'var(--lumen-text-muted)' }}>
            {wordCount.toLocaleString()} palabras
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          background: 'var(--lumen-surface)',
          border: '1px solid var(--lumen-border)',
          borderRadius: 8,
          padding: '14px 16px',
          fontSize: 13,
          lineHeight: 1.75,
          color: 'var(--lumen-text)',
          maxHeight: '45vh',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {policy.content || <em style={{ color: 'var(--lumen-text-muted)' }}>Sin contenido.</em>}
      </div>

      {/* Footer actions */}
      <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid var(--lumen-border)' }}>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
        >
          <Trash2 size={14} /> Eliminar
        </button>
        {onViewExamples && (
          <button
            onClick={onViewExamples}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[13px] font-medium btn-ghost"
          >
            <FileText size={14} /> Ejemplos
          </button>
        )}
        <button onClick={onEdit} className="btn-accent flex-1 justify-center">
          <Pencil size={14} /> Editar política
        </button>
      </div>
    </div>
  );
}

/* ── Policy list ──────────────────────────────────────────── */
export default function PolicyList({ policies, onEdit, onDelete, onViewExamples }) {
  const [viewing, setViewing] = useState(null);

  if (policies.length === 0) {
    return (
      <div className="bento-card flex flex-col items-center justify-center py-16">
        <BookOpen size={40} strokeWidth={1} style={{ color: 'var(--lumen-text-muted)' }} className="mb-3" />
        <p className="text-[13px]" style={{ color: 'var(--lumen-text-secondary)' }}>No hay politicas registradas aun</p>
        <p className="text-xs mt-1" style={{ color: 'var(--lumen-text-muted)' }}>Agrega tu primera politica para comenzar</p>
      </div>
    );
  }

  const grouped = policies.reduce((acc, p) => {
    (acc[p.department] = acc[p.department] || []).push(p);
    return acc;
  }, {});

  const openView  = (p) => setViewing(p);
  const closeView = () => setViewing(null);

  const handleEdit = (p) => {
    closeView();
    onEdit(p);
  };

  const handleDelete = (id) => {
    closeView();
    onDelete(id);
  };

  return (
    <>
      <div className="space-y-5">
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([dept, items]) => (
          <div key={dept}>
            <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-2.5 px-1"
              style={{ color: 'var(--lumen-text-muted)' }}>
              {dept} ({items.length})
            </h3>
            <div className="bento-grid bento-grid-2">
              {items.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openView(p)}
                  className="bento-card interactive group w-full text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-[13px] font-medium truncate" style={{ color: 'var(--lumen-text)' }}>
                          {p.name}
                        </h4>
                        {p.source_url && (
                          <Globe size={11} style={{ color: 'var(--lumen-text-muted)' }} className="shrink-0" />
                        )}
                      </div>
                      {p.description && (
                        <p className="text-xs mb-2 line-clamp-1" style={{ color: 'var(--lumen-text-secondary)' }}>
                          {p.description}
                        </p>
                      )}
                      <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--lumen-text-muted)' }}>
                        {(p.content || '').slice(0, 160)}…
                      </p>
                    </div>
                    {/* Edit pencil — visible on hover, does NOT open view */}
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                        className="p-1.5 rounded-lg transition-colors"
                        title="Editar directamente"
                      >
                        <Pencil size={13} style={{ color: 'var(--lumen-text-muted)' }} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewExamples(p); }}
                        className="p-1.5 rounded-lg transition-colors"
                        title="Ver ejemplos"
                      >
                        <FileText size={13} style={{ color: 'var(--lumen-text-muted)' }} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                        className="p-1.5 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={13} style={{ color: '#f87171' }} />
                      </button>
                    </div>
                    <ChevronRight
                      size={13}
                      className="shrink-0 opacity-0 group-hover:opacity-30 transition-opacity ml-1 mt-0.5"
                      style={{ color: 'var(--lumen-text-muted)' }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Read-only view modal */}
      {viewing && (
        <Modal
          title={viewing.name}
          onClose={closeView}
          wide
        >
          <PolicyView
            policy={viewing}
            onEdit={() => handleEdit(viewing)}
            onDelete={() => handleDelete(viewing.id)}
            onViewExamples={() => { closeView(); onViewExamples(viewing); }}
            onClose={closeView}
          />
        </Modal>
      )}
    </>
  );
}
