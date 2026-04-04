import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Search, Trash2, Edit3, Tag, Calendar, Paperclip, X } from 'lucide-react';
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

  // Extract all unique tags
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
      <div className="dark-card p-5 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(126,63,242,0.1)' }}>
            <StickyNote size={20} style={{ color: '#7E3FF2' }} />
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--lumen-text)' }}>Notas</h2>
            <p className="text-xs" style={{ color: 'var(--lumen-text-muted)' }}>{notes.length} nota{notes.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => { setEditingNote(null); setShowEditor(true); }} className="btn-accent">
          <Plus size={16} /> Nueva nota
        </button>
      </div>

      {/* Search + Tags filter */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--lumen-text-muted)' }} />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar notas..." className="dark-input !pl-10" />
        </div>
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilterTag('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${!filterTag ? 'text-white' : ''}`}
            style={{
              background: !filterTag ? '#7E3FF2' : 'rgba(126,63,242,0.1)',
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
                background: filterTag === tag ? '#7E3FF2' : 'rgba(126,63,242,0.1)',
                color: filterTag === tag ? 'white' : '#9B5BFF',
              }}
            >
              <Tag size={10} className="inline mr-1" />{tag}
            </button>
          ))}
        </div>
      )}

      {/* Notes grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(126,63,242,0.2)', borderTopColor: '#7E3FF2' }} />
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="dark-card flex flex-col items-center justify-center py-16">
          <StickyNote size={40} strokeWidth={1} style={{ color: 'var(--lumen-text-muted)' }} className="mb-3" />
          <p className="text-sm" style={{ color: 'var(--lumen-text-secondary)' }}>
            {searchQuery || filterTag ? 'No se encontraron notas' : 'No hay notas aun'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredNotes.map((note) => {
            let tags = [];
            let attachments = [];
            try { tags = JSON.parse(note.tags || '[]'); } catch {}
            try { attachments = JSON.parse(note.attachments || '[]'); } catch {}

            return (
              <div key={note.id} className="dark-card p-4 group cursor-pointer transition-all"
                onClick={() => { setEditingNote(note); setShowEditor(true); }}
                style={{ ':hover': { borderColor: 'rgba(126,63,242,0.2)' } }}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-medium line-clamp-1" style={{ color: 'var(--lumen-text)' }}>{note.title}</h3>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(note.id); }}
                      className="p-1.5 rounded-lg transition-colors" style={{ color: '#ef4444' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <p className="text-xs line-clamp-3 mb-3" style={{ color: 'var(--lumen-text-secondary)' }}>
                  {stripHtml(note.content).slice(0, 150)}
                </p>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="tag-pill">{tag}</span>
                    ))}
                    {tags.length > 3 && <span className="text-[10px]" style={{ color: 'var(--lumen-text-muted)' }}>+{tags.length - 3}</span>}
                  </div>
                )}

                {/* Footer: date + attachments */}
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

      {/* Editor modal */}
      {showEditor && (
        <Modal title={editingNote ? 'Editar nota' : 'Nueva nota'} onClose={() => { setShowEditor(false); setEditingNote(null); }} wide>
          <NoteEditor note={editingNote} onSave={handleSave} onCancel={() => { setShowEditor(false); setEditingNote(null); }} />
        </Modal>
      )}
    </div>
  );
}
