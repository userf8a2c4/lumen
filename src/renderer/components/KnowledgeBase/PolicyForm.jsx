import React, { useState, useEffect, useRef } from 'react';
import { Globe, Loader2, Tag, X, Plus, Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Table as TableIcon, Link as LinkIcon, Minus } from 'lucide-react';
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

export default function PolicyForm({ policy, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: policy?.name || '', department: policy?.department || '',
    description: policy?.description || '',
    source_url: policy?.source_url || '',
  });
  const [tags, setTags] = useState(() => {
    try { return JSON.parse(policy?.tags || '[]'); } catch { return []; }
  });
  const [tagInput, setTagInput]   = useState('');
  const [scraping, setScraping]   = useState(false);
  const [scrapeMeta, setScrapeMeta] = useState(null);
  const [error, setError]         = useState('');
  const [departments, setDepartments] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const deptRef = useRef(null);

  // Convert initial content (plain text or HTML)
  const initialContent = (() => {
    const c = policy?.content || '';
    if (!c) return '<p></p>';
    if (/<[a-z][\s\S]*>/i.test(c)) return c;
    return c
      .split(/\n{2,}/)
      .map((para) => {
        const lines = para.split('\n').join('<br>');
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
      Placeholder.configure({ placeholder: 'Pega o escribe el contenido completo de la política...' }),
    ],
    content: initialContent,
    editorProps: {
      attributes: { class: 'tiptap-editor', spellcheck: 'true' },
    },
  });

  useEffect(() => {
    window.lumen.policies.getDepartments().then(setDepartments).catch(() => {});
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const filteredDepts = departments.filter((d) =>
    d.toLowerCase().includes(form.department.toLowerCase()) && d !== form.department
  );

  const handleScrape = async () => {
    if (!form.source_url.trim()) return;
    setScraping(true); setError(''); setScrapeMeta(null);
    try {
      const r = await window.lumen.scraper.fetchUrl(form.source_url.trim());
      // Insert scraped content into editor
      if (r.content) {
        const html = r.content
          .split(/\n{2,}/)
          .map((para) => `<p>${para.split('\n').join('<br>')}</p>`)
          .join('');
        editor?.commands.setContent(html);
      }
      setForm((f) => ({ ...f, name: f.name || r.title }));
      setScrapeMeta({ domain: r.domain, favicon: r.favicon, wordCount: r.wordCount, siteName: r.siteName });
    } catch (e) { setError(e.message); }
    finally { setScraping(false); }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const insertLink = () => {
    const url = window.prompt('URL del enlace:');
    if (!url) return;
    editor?.chain().focus().setLink({ href: url.startsWith('http') ? url : 'https://' + url }).run();
  };

  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const content = editor?.getHTML() || '';
    const textContent = editor?.getText() || '';
    if (!form.name.trim() || !form.department.trim() || !textContent.trim()) {
      setError('Nombre, departamento y contenido son obligatorios.'); return;
    }
    onSave({ ...form, content, tags });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* TipTap styles */}
      <style>{`
        .policy-tiptap {
          min-height: 200px;
          max-height: 400px;
          overflow-y: auto;
          padding: 12px 14px;
          outline: none;
          font-size: 13px;
          line-height: 1.65;
          color: var(--lumen-text);
          font-family: var(--lumen-font);
        }
        .policy-tiptap p { margin: 0 0 5px; }
        .policy-tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--lumen-text-muted);
          pointer-events: none;
          height: 0;
        }
        .policy-tiptap h1 { font-size: 18px; font-weight: 700; margin: 10px 0 5px; }
        .policy-tiptap h2 { font-size: 15px; font-weight: 600; margin: 8px 0 4px; }
        .policy-tiptap ul, .policy-tiptap ol { padding-left: 20px; margin: 4px 0 8px; }
        .policy-tiptap li { margin-bottom: 2px; }
        .policy-tiptap strong { font-weight: 700; }
        .policy-tiptap em { font-style: italic; }
        .policy-tiptap u { text-decoration: underline; }
        .policy-tiptap s { text-decoration: line-through; }
        .policy-tiptap a { color: var(--lumen-accent); text-decoration: underline; }
        .policy-tiptap table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 12px; }
        .policy-tiptap th, .policy-tiptap td { border: 1px solid var(--lumen-border); padding: 5px 8px; }
        .policy-tiptap th { background: rgba(255,255,255,0.04); font-weight: 600; }
        .policy-tiptap hr { border: none; border-top: 1px solid var(--lumen-border); margin: 10px 0; }
      `}</style>

      {error && (
        <div className="p-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Nombre *</label>
          <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
            className="dark-input" placeholder="Ej: Politica de reembolsos" />
        </div>
        <div className="relative" ref={deptRef}>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Departamento *</label>
          <input type="text" value={form.department}
            onChange={(e) => { set('department', e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            className="dark-input" placeholder="Ej: Ventas, Soporte" />
          {showSuggestions && filteredDepts.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto"
              style={{ background: 'var(--lumen-card)', border: '1px solid var(--lumen-border)' }}>
              {filteredDepts.map((d) => (
                <button key={d} type="button"
                  onClick={() => { set('department', d); setShowSuggestions(false); }}
                  className="w-full text-left px-3 py-2 text-sm transition-colors"
                  style={{ color: 'var(--lumen-text-secondary)' }}>
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Descripcion corta</label>
        <input type="text" value={form.description} onChange={(e) => set('description', e.target.value)}
          className="dark-input" placeholder="Breve resumen de la politica" />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>
          <Tag size={12} className="inline mr-1" />Etiquetas
        </label>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span key={tag} className="tag-pill flex items-center gap-1.5"
                style={{ background: 'rgba(16,185,129,0.10)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Tag size={9} />
                {tag}
                <button type="button" onClick={() => setTags(tags.filter((t) => t !== tag))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'inherit', lineHeight: 1 }}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input type="text" value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
            className="dark-input flex-1" placeholder="Etiqueta y presiona Enter..." />
          <button type="button" onClick={addTag} disabled={!tagInput.trim()} className="btn-ghost">
            <Plus size={12} /> Agregar
          </button>
        </div>
      </div>

      {/* Importar Link */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>
          Importar Link <span style={{ fontWeight: 400, opacity: 0.5 }}>(opcional)</span>
        </label>
        <div className="flex gap-2">
          <input type="url" value={form.source_url} onChange={(e) => set('source_url', e.target.value)}
            className="dark-input flex-1" placeholder="https://..." />
          <button type="button" onClick={handleScrape} disabled={scraping || !form.source_url.trim()} className="btn-ghost">
            {scraping ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
            {scraping ? 'Leyendo...' : 'Importar'}
          </button>
        </div>
        {scrapeMeta ? (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 6 }}>
            {scrapeMeta.favicon && (
              <img src={scrapeMeta.favicon} alt="" style={{ width: 14, height: 14, borderRadius: 2, flexShrink: 0 }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            )}
            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 500 }}>
              Importado desde <strong>{scrapeMeta.siteName || scrapeMeta.domain}</strong>
            </span>
            <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)', marginLeft: 'auto' }}>
              {scrapeMeta.wordCount?.toLocaleString()} palabras
            </span>
          </div>
        ) : (
          <p className="text-[10px] mt-1" style={{ color: 'var(--lumen-text-muted)' }}>
            Extrae automáticamente el contenido principal limpiando anuncios y menús
          </p>
        )}
      </div>

      {/* Rich text editor */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Contenido *</label>
        <div style={{ borderRadius: 4, overflow: 'hidden', border: '1px solid var(--lumen-border)', transition: 'border-color 0.15s' }}
          onFocusCapture={(e) => { e.currentTarget.style.borderColor = 'var(--lumen-border-light)'; }}
          onBlurCapture={(e) => { e.currentTarget.style.borderColor = 'var(--lumen-border)'; }}
        >
          {/* Toolbar */}
          <div style={{
            display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1,
            padding: '5px 8px', borderBottom: '1px solid var(--lumen-border)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <TB icon={Bold}          onClick={() => editor?.chain().focus().toggleBold().run()}       active={editor?.isActive('bold')}          title="Negrita" />
            <TB icon={Italic}        onClick={() => editor?.chain().focus().toggleItalic().run()}     active={editor?.isActive('italic')}        title="Cursiva" />
            <TB icon={UnderlineIcon} onClick={() => editor?.chain().focus().toggleUnderline().run()}  active={editor?.isActive('underline')}     title="Subrayado" />
            <Sep />
            <TB icon={List}          onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')}    title="Lista" />
            <TB icon={ListOrdered}   onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')}  title="Lista numerada" />
            <Sep />
            <TB icon={TableIcon}     onClick={insertTable}                                             active={false}                             title="Insertar tabla" />
            <TB icon={LinkIcon}      onClick={insertLink}                                              active={editor?.isActive('link')}          title="Insertar enlace" />
            <TB icon={Minus}         onClick={() => editor?.chain().focus().setHorizontalRule().run()} active={false}                            title="Separador" />
          </div>
          {editor && <EditorContent editor={editor} className="policy-tiptap" />}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-accent">
          {policy ? 'Guardar cambios' : 'Agregar politica'}
        </button>
      </div>
    </form>
  );
}
