import React from 'react';
import { Edit3, Trash2, FileText, Globe, BookOpen } from 'lucide-react';

export default function PolicyList({ policies, onEdit, onDelete, onViewExamples }) {
  if (policies.length === 0) {
    return (
      <div className="dark-card flex flex-col items-center justify-center py-16">
        <BookOpen size={40} strokeWidth={1} className="text-lumen-text-muted mb-3" />
        <p className="text-sm text-lumen-text-secondary">No hay políticas registradas aún</p>
        <p className="text-xs text-lumen-text-muted mt-1">Agrega tu primera política para comenzar</p>
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
          <h3 className="text-xs font-semibold text-lumen-text-muted uppercase tracking-wider mb-2.5 px-1">{dept} ({items.length})</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {items.map((p) => (
              <div key={p.id} className="dark-card p-4 group hover:border-emerald-500/20 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-lumen-text truncate">{p.name}</h4>
                      {p.source_url && <Globe size={12} className="text-lumen-text-muted shrink-0" />}
                    </div>
                    {p.description && <p className="text-xs text-lumen-text-secondary mb-2 line-clamp-1">{p.description}</p>}
                    <p className="text-xs text-lumen-text-muted line-clamp-2 leading-relaxed">{p.content.slice(0, 160)}...</p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => onViewExamples(p)} className="p-1.5 hover:bg-amber-500/10 rounded-lg transition-colors" title="Ver ejemplos">
                      <FileText size={14} className="text-lumen-text-muted" />
                    </button>
                    <button onClick={() => onEdit(p)} className="p-1.5 hover:bg-lumen-accent/10 rounded-lg transition-colors" title="Editar">
                      <Edit3 size={14} className="text-lumen-text-muted" />
                    </button>
                    <button onClick={() => onDelete(p.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors" title="Eliminar">
                      <Trash2 size={14} className="text-red-400/70" />
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
