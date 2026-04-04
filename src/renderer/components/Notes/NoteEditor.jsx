import React, { useState, useRef } from 'react';
import { Bold, Italic, Underline, Strikethrough, List, ListOrdered, Paperclip, X, Tag } from 'lucide-react';

export default function NoteEditor({ note, onSave, onCancel }) {
  const [title, setTitle] = useState(note?.title || '');
  const [tags, setTags] = useState(() => {
    try { return JSON.parse(note?.tags || '[]'); } catch { return []; }
  });
  const [attachments, setAttachments] = useState(() => {
    try { return JSON.parse(note?.attachments || '[]'); } catch { return []; }
  });
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  const editorRef = useRef(null);

  // Initialize editor content
  const initEditor = (el) => {
    if (el && !editorRef.current) {
      editorRef.current = el;
      if (note?.content) {
        el.innerHTML = note.content;
      }
    }
  };

  const exec = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    editorRef.current?.focus();
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const removeTag = (tag) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const allowedTypes = ['.txt', '.xlsx', '.docx', '.pdf', '.mp3', '.png', '.jpg', '.jpeg', '.gif', '.webp'];

    for (const file of files) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(ext)) {
        setError(`Tipo no soportado: ${ext}`);
        continue;
      }

      try {
        const buffer = await file.arrayBuffer();
        const result = await window.lumen.notes.saveAttachment(file.name, Array.from(new Uint8Array(buffer)));
        setAttachments((prev) => [...prev, result]);
      } catch (err) {
        setError(`Error al guardar ${file.name}: ${err.message}`);
      }
    }
    e.target.value = '';
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('El titulo es obligatorio.'); return;
    }
    const content = editorRef.current?.innerHTML || '';
    onSave({ title: title.trim(), content, tags, attachments });
  };

  const toolbarBtn = (icon, cmd) => (
    <button type="button" onClick={() => exec(cmd)}
      className="p-1.5 rounded-lg transition-colors"
      style={{ color: 'var(--lumen-text-secondary)' }}>
      {icon}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>{error}</div>}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Titulo *</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          className="dark-input" placeholder="Titulo de la nota" />
      </div>

      {/* Rich text editor */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Contenido</label>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--lumen-border)' }}>
          {/* Toolbar */}
          <div className="flex items-center gap-0.5 px-2 py-1.5" style={{ background: 'var(--lumen-surface)', borderBottom: '1px solid var(--lumen-border)' }}>
            {toolbarBtn(<Bold size={14} />, 'bold')}
            {toolbarBtn(<Italic size={14} />, 'italic')}
            {toolbarBtn(<Underline size={14} />, 'underline')}
            {toolbarBtn(<Strikethrough size={14} />, 'strikethrough')}
            <div className="w-px h-4 mx-1" style={{ background: 'var(--lumen-border)' }} />
            {toolbarBtn(<List size={14} />, 'insertUnorderedList')}
            {toolbarBtn(<ListOrdered size={14} />, 'insertOrderedList')}
          </div>
          {/* Editor area */}
          <div
            ref={initEditor}
            contentEditable
            className="rich-editor"
            data-placeholder="Escribe el contenido de tu nota..."
            style={{ minHeight: '200px' }}
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>
          <Tag size={12} className="inline mr-1" />Etiquetas
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span key={tag} className="tag-pill">
              {tag}
              <button type="button" onClick={() => removeTag(tag)}><X size={10} /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            className="dark-input flex-1" placeholder="Escribe y presiona Enter..." />
          <button type="button" onClick={addTag} className="btn-ghost" disabled={!tagInput.trim()}>Agregar</button>
        </div>
      </div>

      {/* Attachments */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>
          <Paperclip size={12} className="inline mr-1" />Archivos adjuntos
        </label>
        {attachments.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {attachments.map((att, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
                <div className="flex items-center gap-2">
                  <Paperclip size={12} style={{ color: 'var(--lumen-text-muted)' }} />
                  <span className="text-xs" style={{ color: 'var(--lumen-text-secondary)' }}>{att.name}</span>
                </div>
                <button type="button" onClick={() => removeAttachment(i)} className="p-1 rounded" style={{ color: 'var(--lumen-text-muted)' }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="btn-ghost cursor-pointer inline-flex">
          <Paperclip size={12} /> Adjuntar archivo
          <input type="file" className="hidden" multiple
            accept=".txt,.xlsx,.docx,.pdf,.mp3,.png,.jpg,.jpeg,.gif,.webp"
            onChange={handleFileUpload} />
        </label>
        <p className="text-[10px] mt-1" style={{ color: 'var(--lumen-text-muted)' }}>
          Formatos: .txt, .xlsx, .docx, .pdf, .mp3, imagenes
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-accent">
          {note ? 'Guardar cambios' : 'Crear nota'}
        </button>
      </div>
    </form>
  );
}
