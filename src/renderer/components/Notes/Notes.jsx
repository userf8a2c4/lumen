import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Search, Trash2, Tag, Calendar, Paperclip } from 'lucide-react';
import Modal from '../Modal';
import NoteEditor from './NoteEditor';

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = searchQuery.trim()
        ? await window.lumen.notes.search(searchQuery.trim())
        : await window.lumen.notes.getAll();
      setNotes(data);
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
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar esta nota?')) return;
    await window.lumen.notes.delete(id);
    load();
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
    const date = new Date(d);
    return date.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
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
          <div className="module-icon" style={{ background: 'rgba(126,63,242,0.08)' }}>
            <StickyNote size={22} style={{ color: '#7E3FF2' }} />
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
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--lumen-text-muted)' }} />
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
              background: !filterTag ? '#7E3FF2' : 'rgba(126,63,242,0.08)',
              color: !filterTag ? 'white' : '#9B5BFF',
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
                background: filterTag === tag ? '#7E3FF2' : 'rgba(126,63,242,0.08)',
                color: filterTag === tag ? 'white' : '#9B5BFF',
              }}
            >
              <Tag size={9} className="inline mr-1" />{tag}
            </button>
          ))}
        </div>
      )}

      {/* Notes grid — Bento */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(126,63,242,0.2)', borderTopColor: '#7E3FF2' }} />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="bento-card flex flex-col items-center justify-center py-16">
          <StickyNote size={40} strokeWidth={1} style={{ color: 'var(--lumen-text-muted)' }} className="mb-3" />
          <p className="text-[13px]" style={{ color: 'var(--lumen-text-secondary)' }}>
            {searchQuery || filterTag ? 'No se encontraron notas' : 'No hay notas aun'}
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
              <div key={note.id} className="bento-card interactive group cursor-pointer"
                onClick={() => { setEditingNote(note); setShowEditor(true); }}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-[13px] font-medium line-clamp-1" style={{ color: 'var(--lumen-text)' }}>{note.title}</h3>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                      className="p-1.5 rounded-lg transition-colors" style={{ color: '#ef4444' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <p className="text-xs line-clamp-3 mb-3 leading-relaxed" style={{ color: 'var(--lumen-text-secondary)' }}>
                  {stripHtml(note.content).slice(0, 150)}
                </p>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag-pill">{tag}</span>
                    ))}
                    {tags.length > 3 && <span className="text-[10px]" style={{ color: 'var(--lumen-text-muted)' }}>+{tags.length - 3}</span>}
                  </div>
                )}

                <div className="flex items-center justify-between mt-auto pt-2" style={{ borderTop: '1px solid var(--lumen-border)' }}>
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
              </div>
            );
          })}
        </div>
      )}

      {showEditor && (
        <Modal title={editingNote ? 'Editar nota' : 'Nueva nota'} onClose={() => { setShowEditor(false); setEditingNote(null); }} wide>
          <NoteEditor note={editingNote} onSave={handleSave} onCancel={() => { setShowEditor(false); setEditingNote(null); }} />
        </Modal>
      )}
    </div>
  );
}
