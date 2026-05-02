import React, { useState, useEffect, useRef } from 'react';
import { Globe, Loader2, Tag, X, Plus } from 'lucide-react';

export default function PolicyForm({ policy, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: policy?.name || '', department: policy?.department || '',
    description: policy?.description || '', content: policy?.content || '',
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
      setForm((f) => ({ ...f, content: r.content, name: f.name || r.title }));
      setScrapeMeta({ domain: r.domain, favicon: r.favicon, wordCount: r.wordCount, siteName: r.siteName });
    } catch (e) { setError(e.message); }
    finally { setScraping(false); }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.department.trim() || !form.content.trim()) {
      setError('Nombre, departamento y contenido son obligatorios.'); return;
    }
    onSave({ ...form, tags });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {/* Tags / Etiquetas */}
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
            className="dark-input flex-1" placeholder="Etiqueta y presiona Enter (ej: reembolso, amazon, urgente)..." />
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
          <div style={{
            marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
            background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 6,
          }}>
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

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Contenido *</label>
        <textarea value={form.content} onChange={(e) => set('content', e.target.value)} rows={10}
          className="dark-input resize-y" placeholder="Pega aqui el texto completo de la politica..." />
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
