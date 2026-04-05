import React from 'react';
import { Edit3, Trash2, FileText, Globe, BookOpen } from 'lucide-react';

export default function PolicyList({ policies, onEdit, onDelete, onViewExamples }) {
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

  return (
    <div className="space-y-5">
      {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([dept, items]) => (
        <div key={dept}>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest mb-2.5 px-1" style={{ color: 'var(--lumen-text-muted)' }}>{dept} ({items.length})</h3>
          <div className="bento-grid bento-grid-2">
            {items.map((p) => (
              <div key={p.id} className="bento-card interactive group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-[13px] font-medium truncate" style={{ color: 'var(--lumen-text)' }}>{p.name}</h4>
                      {p.source_url && <Globe size={11} style={{ color: 'var(--lumen-text-muted)' }} className="shrink-0" />}
                    </div>
                    {p.description && <p className="text-xs mb-2 line-clamp-1" style={{ color: 'var(--lumen-text-secondary)' }}>{p.description}</p>}
                    <p className="text-xs line-clamp-2 leading-relaxed" style={{ color: 'var(--lumen-text-muted)' }}>{p.content.slice(0, 160)}...</p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => onViewExamples(p)} className="p-1.5 rounded-lg transition-colors" title="Ver ejemplos">
                      <FileText size={13} style={{ color: 'var(--lumen-text-muted)' }} />
                    </button>
                    <button onClick={() => onEdit(p)} className="p-1.5 rounded-lg transition-colors" title="Editar">
                      <Edit3 size={13} style={{ color: 'var(--lumen-text-muted)' }} />
                    </button>
                    <button onClick={() => onDelete(p.id)} className="p-1.5 rounded-lg transition-colors" title="Eliminar">
                      <Trash2 size={13} style={{ color: '#f87171' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
