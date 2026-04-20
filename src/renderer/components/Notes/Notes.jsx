import React, { useState, useEffect } from 'react';
import {
  StickyNote, Plus, Search, Trash2, Tag, Calendar,
  Paperclip, Edit3, ZoomIn, ZoomOut, ChevronRight,
} from 'lucide-react';
import Modal from '../Modal';
import NoteEditor from './NoteEditor';

/* ── Note preview (read-only viewer) ─────────────────────── */
function NotePreview({ note, onEdit, onDelete, onClose }) {
  const [zoom, setZoom] = useState(14); // base px: 14

  let tags = [];
  let attachments = [];
  try { tags = JSON.parse(note.tags || '[]'); } catch {}
  try { attachments = JSON.parse(note.attachments || '[]'); } catch {}

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {/* Title + zoom controls */}
      <div className="flex items-start justify-between gap-4 pb-3"
        style={{ borderBottom: '1px solid var(--lumen-border)' }}>
        <h2 className="text-[18px] font-semibold leading-snug flex-1"
          style={{ color: 'var(--lumen-text)' }}>
          {note.title}
        </h2>
        {/* Zoom strip */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setZoom((z) => Math.max(11, z - 1))}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--lumen-text-muted)' }}
            title="Reducir texto"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-[10px] font-mono w-7 text-center" style={{ color: 'var(--lumen-text-muted)' }}>
            {Math.round((zoom / 14) * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(24, z + 1))}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--lumen-text-muted)' }}
            title="Ampliar texto"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      {/* Meta: date + tags */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5" style={{ color: 'var(--lumen-text-muted)' }}>
          <Calendar size={11} />
          <span className="text-[11px]">{formatDate(note.updated_at)}</span>
        </div>
        {tags.map((tag) => (
          <span key={tag} className="tag-pill">{tag}</span>
        ))}
      </div>

      {/* Content rendered */}
      <div
        className="leading-relaxed rounded-2xl p-4 overflow-y-auto"
        style={{
          background: 'var(--lumen-surface)',
          border: '1px solid var(--lumen-border)',
          fontSize: `${zoom}px`,
          color: 'var(--lumen-text)',
          maxHeight: '40vh',
          lineHeight: 1.75,
        }}
        dangerouslySetInnerHTML={{ __html: note.content || '<em style="color:var(--lumen-text-muted)">Sin contenido.</em>' }}
      />

      {/* Attachments */}
      {attachments.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3"
            style={{ color: 'var(--lumen-text-muted)' }}>
            Archivos adjuntos
          </p>
          <div className="space-y-3">
            {attachments.map((att, i) => {
              const name = typeof att === 'string' ? att : (att.name || att.path || '');
              const isImg = /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name);
              const src = `lumen://${name}`;
              return isImg ? (
                <div key={i} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--lumen-border)' }}>
                  <img
                    src={src}
                    alt={name}
                    style={{ width: '100%', display: 'block', maxHeight: 420, objectFit: 'contain', background: 'rgba(0,0,0,0.3)' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                  />
                  {/* fallback si la imagen no carga */}
                  <div style={{ display: 'none', padding: '10px 12px', alignItems: 'center', gap: 8 }}>
                    <Paperclip size={12} style={{ color: 'var(--lumen-text-muted)' }} />
                    <span className="text-[11px]" style={{ color: 'var(--lumen-text-muted)' }}>{name}</span>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
                  style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
                  <Paperclip size={12} style={{ color: 'var(--lumen-text-muted)' }} />
                  <span className="text-[12px]" style={{ color: 'var(--lumen-text-secondary)' }}>{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions footer */}
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
        <button onClick={onEdit} className="btn-accent flex-1 justify-center">
          <Edit3 size={14} /> Editar nota
        </button>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */
export default function Notes() {
  const [notes, setNotes]               = useState([]);
  const [previewNote, setPreviewNote]   = useState(null);
  const [showEditor, setShowEditor]     = useState(false);
  const [editingNote, setEditingNote]   = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [filterTag, setFilterTag]       = useState('');
  const [loading, setLoading]           = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = searchQuery.trim()
        ? await window.lumen.notes.search(searchQuery.trim())
        : await window.lumen.notes.getAll();
      setNotes(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [searchQuery]);

  const handleSave = async (data) => {
    if (editingNote) {
      await window.lumen.notes.update(editingNote.id, data);
    } else {
      await window.lumen.notes.create(data);
    }
    setShowEditor(false);
    setEditingNote(null);
    setPreviewNote(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta nota?')) return;
    await window.lumen.notes.delete(id);
    setPreviewNote(null);
    load();
  };

  const openEdit = (note) => {
    setPreviewNote(null);
    setEditingNote(note);
    setShowEditor(true);
  };

  const allTags = [...new Set(notes.flatMap((n) => {
    try { return JSON.parse(n.tags || '[]'); } catch { return []; }
  }))].sort();

  const filteredNotes = filterTag
    ? notes.filter((n) => {
        try { return JSON.parse(n.tags || '[]').includes(filterTag); } catch { return false; }
      })
    : notes;

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div>
      {/* Header */}
      <div className="bento-card mb-4 flex items-center justify-between">
        <div className="module-header">
          <div className="module-icon" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <StickyNote size={22} style={{ color: 'var(--lumen-accent)' }} />
          </div>
          <div>
            <h2>Notas</h2>
            <p>{notes.length} nota{notes.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => { setEditingNote(null); setShowEditor(true); }} className="btn-accent">
          <Plus size={15} /> Nueva nota
        </button>
      </div>

      {/* Search + Stats */}
      <div className="bento-grid bento-grid-3 mb-4">
        <div className="bento-card bento-span-2 !p-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--lumen-text-muted)' }} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar notas..." className="dark-input !pl-10" />
          </div>
        </div>
        <div className="bento-card flex items-center gap-3">
          <div className="bento-stat">
            <span className="stat-value">{allTags.length}</span>
            <span className="stat-label">Etiquetas</span>
          </div>
        </div>
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilterTag('')}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              background: !filterTag ? 'var(--lumen-accent)' : 'rgba(255,255,255,0.06)',
              color: !filterTag ? 'white' : 'var(--lumen-accent)',
            }}
          >
            Todas
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{
                background: filterTag === tag ? 'var(--lumen-accent)' : 'rgba(255,255,255,0.06)',
                color: filterTag === tag ? 'white' : 'var(--lumen-accent)',
              }}
            >
              <Tag size={9} className="inline mr-1" />{tag}
            </button>
          ))}
        </div>
      )}

      {/* Notes grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: 'rgba(255,255,255,0.06)', borderTopColor: 'var(--lumen-accent)' }} />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bento-card flex flex-col items-center justify-center py-16">
          <StickyNote size={40} strokeWidth={1} style={{ color: 'var(--lumen-text-muted)' }} className="mb-3" />
          <p className="text-[13px]" style={{ color: 'var(--lumen-text-secondary)' }}>
            {searchQuery || filterTag ? 'No se encontraron notas' : 'No hay notas aún'}
          </p>
        </div>
      ) : (
        <div className="bento-grid bento-grid-3">
          {filteredNotes.map((note) => {
            let tags = [];
            let attachments = [];
            try { tags = JSON.parse(note.tags || '[]'); } catch {}
            try { attachments = JSON.parse(note.attachments || '[]'); } catch {}

            return (
              <button
                key={note.id}
                className="bento-card interactive w-full text-left group"
                onClick={() => setPreviewNote(note)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-[13px] font-medium line-clamp-1 flex-1"
                    style={{ color: 'var(--lumen-text)' }}>
                    {note.title}
                  </h3>
                  <ChevronRight size={13} className="shrink-0 ml-1 mt-0.5 opacity-0 group-hover:opacity-40 transition-opacity"
                    style={{ color: 'var(--lumen-text-muted)' }} />
                </div>

                <p className="text-xs line-clamp-3 mb-3 leading-relaxed"
                  style={{ color: 'var(--lumen-text-secondary)' }}>
                  {(stripHtml(note.content || '') || '').slice(0, 150)}
                </p>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag-pill">{tag}</span>
                    ))}
                    {tags.length > 3 && (
                      <span className="text-[10px]" style={{ color: 'var(--lumen-text-muted)' }}>
                        +{tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-2"
                  style={{ borderTop: '1px solid var(--lumen-border)' }}>
                  <div className="flex items-center gap-1" style={{ color: 'var(--lumen-text-muted)' }}>
                    <Calendar size={10} />
                    <span className="text-[10px]">{formatDate(note.updated_at)}</span>
                  </div>
                  {attachments.length > 0 && (
                    <div className="flex items-center gap-1" style={{ color: 'var(--lumen-text-muted)' }}>
                      <Paperclip size={10} />
                      <span className="text-[10px]">{attachments.length}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      {previewNote && (
        <Modal
          title={previewNote.title}
          onClose={() => setPreviewNote(null)}
          wide
        >
          <NotePreview
            note={previewNote}
            onEdit={() => openEdit(previewNote)}
            onDelete={() => handleDelete(previewNote.id)}
            onClose={() => setPreviewNote(null)}
          />
        </Modal>
      )}

      {/* Editor modal */}
      {showEditor && (
        <Modal
          title={editingNote ? 'Editar nota' : 'Nueva nota'}
          onClose={() => { setShowEditor(false); setEditingNote(null); }}
          wide
        >
          <NoteEditor
            note={editingNote}
            onSave={handleSave}
            onCancel={() => { setShowEditor(false); setEditingNote(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
