import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, Table as TableIcon, Link as LinkIcon,
  Minus, Paperclip, X, Tag, Link2, Plus, Trash2,
  Heading1, Heading2, Quote,
} from 'lucide-react';

/* ── Toolbar button ──────────────────────────────────────── */
function TB({ icon: Icon, onClick, active, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        padding: '4px 6px', borderRadius: 4, border: 'none', cursor: 'pointer',
        background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
        color: active ? 'var(--lumen-text)' : 'var(--lumen-text-secondary)',
        display: 'flex', alignItems: 'center', transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon size={14} />
    </button>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 16, background: 'var(--lumen-border)', margin: '0 2px' }} />;
}

export default function NoteEditor({ note, onSave, onCancel }) {
  const [title, setTitle] = useState(note?.title || '');
  const [tags, setTags] = useState(() => {
    try { return JSON.parse(note?.tags || '[]'); } catch { return []; }
  });
  const [refLinks, setRefLinks] = useState(() => {
    try { return JSON.parse(note?.ref_links || '[]'); } catch { return []; }
  });
  const [attachments, setAttachments] = useState(() => {
    try { return JSON.parse(note?.attachments || '[]'); } catch { return []; }
  });
  const [tagInput, setTagInput]       = useState('');
  const [linkInput, setLinkInput]     = useState('');
  const [linkLabel, setLinkLabel]     = useState('');
  const [error, setError]             = useState('');

  // Detectar si el contenido es HTML o texto plano y convertirlo
  const initialContent = (() => {
    const c = note?.content || '';
    if (!c) return '<p></p>';
    // Si ya tiene HTML es contenido migrado o nuevo
    if (/<[a-z][\s\S]*>/i.test(c)) return c;
    // Texto plano: convertir párrafos y saltos de línea
    return c
      .split(/\n{2,}/)
      .map((para) => {
        const lines = para.split('\n').join('<br>');
        if (para.startsWith('# ')) return `<h1>${para.slice(2)}</h1>`;
        if (para.startsWith('## ')) return `<h2>${para.slice(3)}</h2>`;
        if (para.startsWith('### ')) return `<h3>${para.slice(4)}</h3>`;
        if (para.startsWith('• ') || para.startsWith('- ')) return `<ul><li>${para.slice(2)}</li></ul>`;
        return `<p>${lines}</p>`;
      })
      .join('');
  })();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ strike: false }),
      Underline,
      Strike,
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: 'Escribe el contenido de tu nota...' }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'tiptap-editor',
        spellcheck: 'true',
      },
    },
  });

  /* ── Tags ──────────────────────────────────────────────── */
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };
  const removeTag = (t) => setTags(tags.filter((x) => x !== t));

  /* ── Reference Links ──────────────────────────────────── */
  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    let finalUrl = url;
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = 'https://' + finalUrl;
    setRefLinks([...refLinks, { url: finalUrl, label: linkLabel.trim() || finalUrl }]);
    setLinkInput('');
    setLinkLabel('');
  };
  const removeLink = (i) => setRefLinks(refLinks.filter((_, idx) => idx !== i));

  /* ── Attachments ──────────────────────────────────────── */
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const allowed = ['.txt', '.xlsx', '.docx', '.pdf', '.mp3', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
    for (const file of files) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowed.includes(ext)) { setError(`Tipo no soportado: ${ext}`); continue; }
      try {
        const buffer = await file.arrayBuffer();
        const result = await window.lumen.notes.saveAttachment(file.name, Array.from(new Uint8Array(buffer)));
        setAttachments((prev) => [...prev, result]);
      } catch (err) { setError(`Error al guardar ${file.name}: ${err.message}`); }
    }
    e.target.value = '';
  };
  const removeAttachment = (i) => setAttachments(attachments.filter((_, idx) => idx !== i));

  /* ── Submit ──────────────────────────────────────────── */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('El título es obligatorio.'); return; }
    const content = editor?.getHTML() || '';
    onSave({ title: title.trim(), content, tags, ref_links: refLinks, attachments });
  };

  /* ── Link insertion helper ──────────────────────────── */
  const insertEditorLink = () => {
    const url = window.prompt('URL del enlace:');
    if (!url) return;
    editor?.chain().focus().setLink({ href: url }).run();
  };

  /* ── Insert table ─────────────────────────────────── */
  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  if (!editor) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* TipTap styles */}
      <style>{`
        .tiptap-editor {
          min-height: 220px;
          padding: 12px 14px;
          outline: none;
          font-size: 13.5px;
          line-height: 1.72;
          color: var(--lumen-text);
          font-family: var(--lumen-font);
        }
        .tiptap-editor p { margin: 0 0 6px; }
        .tiptap-editor p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--lumen-text-muted);
          pointer-events: none;
          height: 0;
        }
        .tiptap-editor h1 { font-size: 20px; font-weight: 700; margin: 12px 0 6px; color: var(--lumen-text); }
        .tiptap-editor h2 { font-size: 17px; font-weight: 600; margin: 10px 0 5px; color: var(--lumen-text); }
        .tiptap-editor h3 { font-size: 14px; font-weight: 600; margin: 8px 0 4px; color: var(--lumen-text-secondary); }
        .tiptap-editor ul, .tiptap-editor ol { padding-left: 20px; margin: 4px 0 8px; }
        .tiptap-editor li { margin-bottom: 2px; }
        .tiptap-editor blockquote {
          border-left: 3px solid var(--lumen-accent);
          padding-left: 12px;
          margin: 8px 0;
          color: var(--lumen-text-secondary);
          font-style: italic;
        }
        .tiptap-editor strong { font-weight: 700; }
        .tiptap-editor em { font-style: italic; }
        .tiptap-editor u { text-decoration: underline; }
        .tiptap-editor s { text-decoration: line-through; }
        .tiptap-editor a { color: var(--lumen-accent); text-decoration: underline; }
        .tiptap-editor table {
          border-collapse: collapse;
          width: 100%;
          margin: 10px 0;
          font-size: 12px;
        }
        .tiptap-editor th, .tiptap-editor td {
          border: 1px solid var(--lumen-border);
          padding: 6px 10px;
          text-align: left;
        }
        .tiptap-editor th { background: rgba(255,255,255,0.04); font-weight: 600; color: var(--lumen-text-secondary); }
        .tiptap-editor hr { border: none; border-top: 1px solid var(--lumen-border); margin: 14px 0; }
      `}</style>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#f87171', fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: 'var(--lumen-text-secondary)' }}>Título *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="dark-input"
          placeholder="Título de la nota"
        />
      </div>

      {/* Rich text editor */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6, color: 'var(--lumen-text-secondary)' }}>Contenido</label>
        <div style={{ borderRadius: 6, overflow: 'hidden', border: '1px solid var(--lumen-border)' }}>
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1,
            padding: '5px 8px', background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid var(--lumen-border)',
          }}>
            <TB icon={Heading1} title="Título 1" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} />
            <TB icon={Heading2} title="Título 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} />
            <Sep />
            <TB icon={Bold} title="Negrita" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} />
            <TB icon={Italic} title="Cursiva" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} />
            <TB icon={UnderlineIcon} title="Subrayado" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} />
            <TB icon={Strikethrough} title="Tachado" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} />
            <Sep />
            <TB icon={List} title="Lista" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} />
            <TB icon={ListOrdered} title="Lista numerada" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} />
            <TB icon={Quote} title="Cita" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} />
            <Sep />
            <TB icon={TableIcon} title="Insertar tabla" onClick={insertTable} />
            <TB icon={LinkIcon} title="Insertar enlace" onClick={insertEditorLink} active={editor.isActive('link')} />
            <TB icon={Minus} title="Línea divisoria" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
          </div>
          {/* Editor area */}
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Reference Links */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, marginBottom: 8, color: 'var(--lumen-text-secondary)' }}>
          <Link2 size={12} /> Links de Referencia
        </label>

        {refLinks.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
            {refLinks.map((lk, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)', borderRadius: 6,
              }}>
                <Link2 size={11} style={{ color: 'var(--lumen-accent)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--lumen-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lk.label}</p>
                  {lk.label !== lk.url && (
                    <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lk.url}</p>
                  )}
                </div>
                <button type="button" onClick={() => removeLink(i)} style={{ padding: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', borderRadius: 4, flexShrink: 0 }}>
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6 }}>
          <input
            type="text"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
            placeholder="Etiqueta (opcional)"
            className="dark-input"
            style={{ fontSize: 12 }}
          />
          <input
            type="text"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
            placeholder="https://..."
            className="dark-input"
            style={{ fontSize: 12 }}
          />
          <button type="button" onClick={addLink} disabled={!linkInput.trim()} className="btn-ghost" style={{ whiteSpace: 'nowrap', fontSize: 11 }}>
            <Plus size={12} /> Añadir
          </button>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, marginBottom: 8, color: 'var(--lumen-text-secondary)' }}>
          <Tag size={12} /> Etiquetas
        </label>
        {tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {tags.map((tag) => (
              <span key={tag} className="tag-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {tag}
                <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', lineHeight: 1 }}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
            className="dark-input flex-1"
            placeholder="Escribe y presiona Enter..."
            style={{ fontSize: 12 }}
          />
          <button type="button" onClick={addTag} disabled={!tagInput.trim()} className="btn-ghost" style={{ fontSize: 11 }}>Agregar</button>
        </div>
      </div>

      {/* Attachments */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, marginBottom: 8, color: 'var(--lumen-text-secondary)' }}>
          <Paperclip size={12} /> Archivos adjuntos
        </label>
        {attachments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            {attachments.map((att, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)', borderRadius: 6 }}>
                <Paperclip size={11} style={{ color: 'var(--lumen-text-muted)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 12, color: 'var(--lumen-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.name}</span>
                <button type="button" onClick={() => removeAttachment(i)} style={{ padding: 3, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', borderRadius: 4 }}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="btn-ghost cursor-pointer inline-flex" style={{ fontSize: 11 }}>
          <Paperclip size={12} /> Adjuntar archivo
          <input type="file" className="hidden" multiple
            accept=".txt,.xlsx,.docx,.pdf,.mp3,.png,.jpg,.jpeg,.gif,.webp"
            onChange={handleFileUpload} />
        </label>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--lumen-border)' }}>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-accent">
          {note ? 'Guardar cambios' : 'Crear nota'}
        </button>
      </div>
    </form>
  );
}
