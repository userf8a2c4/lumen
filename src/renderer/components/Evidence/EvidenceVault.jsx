import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, Plus, Search, Tag, FileText, Image as ImageIcon,
  Upload, X, Check, Pencil, Trash2, ChevronRight,
} from 'lucide-react';
import Modal from '../Modal';
import EvidenceViewer from './EvidenceViewer';

const ACCENT = 'var(--lumen-accent)';

// ─── Mime type helpers ────────────────────────────────────────────────────────

function mimeIcon(mime) {
  if (mime?.startsWith('image/')) return <ImageIcon size={28} style={{ color: ACCENT }} />;
  if (mime === 'application/pdf') return <FileText size={28} style={{ color: '#ef4444' }} />;
  return <FileText size={28} style={{ color: 'var(--lumen-text-muted)' }} />;
}

function mimeLabel(mime) {
  if (mime?.startsWith('image/')) return mime.split('/')[1].toUpperCase();
  if (mime === 'application/pdf') return 'PDF';
  return 'ARCHIVO';
}

function isImage(mime) { return mime?.startsWith('image/'); }

// ─── Evidence metadata form ───────────────────────────────────────────────────

function EvidenceForm({ initial, onSave, onCancel }) {
  const [title,       setTitle]       = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [caseRef,     setCaseRef]     = useState(initial?.case_ref || '');
  const [tagInput,    setTagInput]    = useState('');
  const [tags,        setTags]        = useState(() => {
    try { return JSON.parse(initial?.tags || '[]'); } catch { return []; }
  });
  const [error, setError] = useState('');

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('El título es obligatorio.'); return; }
    onSave({ title: title.trim(), description: description.trim(), tags, case_ref: caseRef.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          {error}
        </div>
      )}
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Título *</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          className="dark-input" placeholder="Descripción de la evidencia" autoFocus />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Descripción</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          className="dark-input resize-none" rows={3} placeholder="Contexto adicional..." />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>
          Referencia de caso
        </label>
        <input type="text" value={caseRef} onChange={(e) => setCaseRef(e.target.value)}
          className="dark-input" placeholder="Ej: Caso #1234 / Residente: López" />
      </div>
      <div>
        <label className="block text-xs font-medium mb-2" style={{ color: 'var(--lumen-text-secondary)' }}>
          <Tag size={11} className="inline mr-1" />Etiquetas
        </label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.map((t) => (
            <span key={t} className="tag-pill">
              {t}
              <button type="button" onClick={() => setTags((prev) => prev.filter((x) => x !== t))}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
            className="dark-input flex-1" placeholder="Escribe y presiona Enter..." />
          <button type="button" onClick={addTag} className="btn-ghost" disabled={!tagInput.trim()}>Agregar</button>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-accent">{initial ? 'Guardar cambios' : 'Agregar'}</button>
      </div>
    </form>
  );
}

// ─── Upload drop zone ─────────────────────────────────────────────────────────

function UploadZone({ onFilesSelected }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];

  const processFiles = (files) => {
    const valid = Array.from(files).filter((f) => ALLOWED.includes(f.type));
    if (valid.length) onFilesSelected(valid);
  };

  return (
    <div
      className="drop-zone rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all"
      style={{
        borderColor: dragging ? ACCENT : 'var(--lumen-border)',
        background: dragging ? 'rgba(255,255,255,0.06)' : 'transparent',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files); }}
      onClick={() => inputRef.current?.click()}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.06)' }}>
        <Upload size={22} style={{ color: ACCENT }} />
      </div>
      <div className="text-center">
        <p className="text-[13px] font-medium" style={{ color: 'var(--lumen-text)' }}>
          Arrastra archivos aquí o haz clic
        </p>
        <p className="text-[11px] mt-1" style={{ color: 'var(--lumen-text-muted)' }}>
          PNG, JPG, WebP, GIF, PDF
        </p>
      </div>
      <input ref={inputRef} type="file" className="hidden" multiple
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
        onChange={(e) => processFiles(e.target.files)} />
    </div>
  );
}

// ─── Evidence card ────────────────────────────────────────────────────────────

function EvidenceCard({ evidence, onClick }) {
  const tags = (() => { try { return JSON.parse(evidence.tags || '[]'); } catch { return []; } })();

  return (
    <button
      onClick={onClick}
      className="bento-card interactive w-full text-left group overflow-hidden"
    >
      {/* Thumbnail / icon */}
      <div className="w-full h-32 rounded-xl mb-3 flex items-center justify-center overflow-hidden"
        style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
        {isImage(evidence.mime_type) ? (
          <img
            src={`lumen://evidences/${evidence.file_path}`}
            alt={evidence.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            {mimeIcon(evidence.mime_type)}
            <span className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--lumen-text-muted)' }}>
              {mimeLabel(evidence.mime_type)}
            </span>
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium truncate" style={{ color: 'var(--lumen-text)' }}>
            {evidence.title}
          </p>
          {evidence.case_ref && (
            <p className="text-[10px] truncate mt-0.5" style={{ color: 'var(--lumen-text-muted)' }}>
              {evidence.case_ref}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tags.slice(0, 2).map((t) => (
                <span key={t} className="tag-pill text-[9px] !py-0.5">{t}</span>
              ))}
              {tags.length > 2 && (
                <span className="text-[9px]" style={{ color: 'var(--lumen-text-muted)' }}>
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
        <ChevronRight size={13} className="shrink-0 opacity-0 group-hover:opacity-40 transition-opacity mt-0.5"
          style={{ color: 'var(--lumen-text-muted)' }} />
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function EvidenceVault() {
  const [evidences,     setEvidences]     = useState([]);
  const [viewing,       setViewing]       = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [editingEv,     setEditingEv]     = useState(null);
  const [pendingFiles,  setPendingFiles]  = useState([]);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [filterTag,     setFilterTag]     = useState('');
  const [loading,       setLoading]       = useState(true);
  const [uploading,     setUploading]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = searchQuery.trim()
        ? await window.lumen.evidence.search(searchQuery.trim())
        : await window.lumen.evidence.getAll();
      setEvidences(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [searchQuery]);

  // Receiving files → open form to add metadata
  const handleFilesSelected = (files) => {
    setPendingFiles(files);
    setEditingEv(null);
    setShowForm(true);
  };

  const handleSaveNew = async ({ title, description, tags, case_ref }) => {
    setUploading(true);
    try {
      for (const file of pendingFiles) {
        const buffer = Array.from(new Uint8Array(await file.arrayBuffer()));
        const { safeName, fileSize } = await window.lumen.evidence.save(file.name, file.type, buffer);
        await window.lumen.evidence.create({
          title,
          description,
          file_name: file.name,
          file_path: safeName,
          mime_type: file.type,
          file_size: fileSize,
          tags,
          case_ref,
        });
      }
      setShowForm(false);
      setPendingFiles([]);
      await load();
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  };

  const handleSaveEdit = async ({ title, description, tags, case_ref }) => {
    await window.lumen.evidence.update(editingEv.id, {
      title, description, tags, case_ref,
      annotations: JSON.parse(editingEv.annotations || '[]'),
    });
    setShowForm(false);
    setEditingEv(null);
    // Update viewing if open
    if (viewing?.id === editingEv.id) {
      setViewing((prev) => ({ ...prev, title, description, case_ref, tags: JSON.stringify(tags) }));
    }
    await load();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar esta evidencia permanentemente?')) return;
    await window.lumen.evidence.delete(id);
    setViewing(null);
    await load();
  };

  const openEdit = (ev) => {
    setViewing(null);
    setEditingEv(ev);
    setPendingFiles([]);
    setShowForm(true);
  };

  const allTags = [...new Set(evidences.flatMap((e) => {
    try { return JSON.parse(e.tags || '[]'); } catch { return []; }
  }))].sort();

  const filtered = filterTag
    ? evidences.filter((e) => { try { return JSON.parse(e.tags || '[]').includes(filterTag); } catch { return false; } })
    : evidences;

  return (
    <div>
      {/* Header */}
      <div className="bento-card mb-4 flex items-center justify-between">
        <div className="module-header">
          <div className="module-icon" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <ShieldCheck size={22} style={{ color: ACCENT }} />
          </div>
          <div>
            <h2>Vault de Evidencias</h2>
            <p>{evidences.length} archivo{evidences.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* Search + stats */}
      <div className="bento-grid bento-grid-3 mb-4">
        <div className="bento-card bento-span-2 !p-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--lumen-text-muted)' }} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar evidencias..." className="dark-input !pl-10" />
          </div>
        </div>
        <div className="bento-card flex items-center gap-3">
          <div className="bento-stat">
            <span className="stat-value">{allTags.length}</span>
            <span className="stat-label">Etiquetas</span>
          </div>
        </div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => setFilterTag('')}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{ background: !filterTag ? ACCENT : 'rgba(255,255,255,0.06)', color: !filterTag ? 'white' : 'var(--lumen-accent)' }}>
            Todas
          </button>
          {allTags.map((tag) => (
            <button key={tag} onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
              className="px-3 py-1 rounded-full text-xs font-medium transition-all"
              style={{ background: filterTag === tag ? ACCENT : 'rgba(255,255,255,0.06)', color: filterTag === tag ? 'white' : 'var(--lumen-accent)' }}>
              <Tag size={9} className="inline mr-1" />{tag}
            </button>
          ))}
        </div>
      )}

      {/* Upload zone */}
      <div className="mb-4">
        <UploadZone onFilesSelected={handleFilesSelected} />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: 'rgba(255,255,255,0.06)', borderTopColor: ACCENT }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bento-card flex flex-col items-center justify-center py-16">
          <ShieldCheck size={40} strokeWidth={1} style={{ color: 'var(--lumen-text-muted)' }} className="mb-3" />
          <p className="text-[13px]" style={{ color: 'var(--lumen-text-secondary)' }}>
            {searchQuery || filterTag ? 'No se encontraron evidencias' : 'Sube tu primera evidencia'}
          </p>
        </div>
      ) : (
        <div className="bento-grid bento-grid-3">
          {filtered.map((ev) => (
            <EvidenceCard key={ev.id} evidence={ev} onClick={() => setViewing(ev)} />
          ))}
        </div>
      )}

      {/* Fullscreen viewer */}
      {viewing && (
        <EvidenceViewer
          evidence={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => openEdit(viewing)}
          onDelete={() => handleDelete(viewing.id)}
        />
      )}

      {/* Add/edit form modal */}
      {showForm && (
        <Modal
          title={editingEv ? 'Editar evidencia' : `Agregar ${pendingFiles.length} archivo${pendingFiles.length !== 1 ? 's' : ''}`}
          onClose={() => { setShowForm(false); setEditingEv(null); setPendingFiles([]); }}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <div className="w-8 h-8 border-2 rounded-full animate-spin"
                style={{ borderColor: 'rgba(255,255,255,0.06)', borderTopColor: ACCENT }} />
              <p className="text-[13px]" style={{ color: 'var(--lumen-text-secondary)' }}>Guardando archivos...</p>
            </div>
          ) : (
            <EvidenceForm
              initial={editingEv}
              onSave={editingEv ? handleSaveEdit : handleSaveNew}
              onCancel={() => { setShowForm(false); setEditingEv(null); setPendingFiles([]); }}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
