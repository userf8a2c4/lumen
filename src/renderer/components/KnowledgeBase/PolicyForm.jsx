import React, { useState, useEffect, useRef } from 'react';
import { Globe, Loader2, PenLine, Link } from 'lucide-react';

export default function PolicyForm({ policy, onSave, onCancel, initialMode = 'manual' }) {
  const [form, setForm] = useState({
    name: policy?.name || '', department: policy?.department || '',
    description: policy?.description || '', content: policy?.content || '',
    source_url: policy?.source_url || '',
  });
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const deptRef = useRef(null);
  const urlRef = useRef(null);

  useEffect(() => {
    window.lumen.policies.getDepartments().then(setDepartments).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialMode === 'url' && urlRef.current) {
      setTimeout(() => urlRef.current?.focus(), 100);
    }
  }, [initialMode]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const filteredDepts = departments.filter((d) =>
    d.toLowerCase().includes(form.department.toLowerCase()) && d !== form.department
  );

  const handleScrape = async () => {
    if (!form.source_url.trim()) return;
    setScraping(true); setError('');
    try {
      const r = await window.lumen.scraper.fetchUrl(form.source_url.trim());
      setForm((f) => ({ ...f, content: r.content, name: f.name || r.title }));
    } catch (e) { setError(e.message); }
    finally { setScraping(false); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.department.trim() || !form.content.trim()) {
      setError('Nombre, departamento y contenido son obligatorios.'); return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Nombre *</label>
          <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className="dark-input" placeholder="Ej: Politica de reembolsos" />
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
        <input type="text" value={form.description} onChange={(e) => set('description', e.target.value)} className="dark-input" placeholder="Breve resumen de la politica" />
      </div>

      {/* Entry mode banner */}
      <div style={{
        display: 'flex',
        borderRadius: 6,
        overflow: 'hidden',
        border: '1px solid var(--lumen-border)',
        marginBottom: 4,
      }}>
        <div style={{
          flex: 1, padding: '10px 14px',
          background: initialMode === 'manual' ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
          borderRight: '1px solid var(--lumen-border)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <PenLine size={13} style={{ color: initialMode === 'manual' ? '#10b981' : 'var(--lumen-text-muted)' }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: initialMode === 'manual' ? '#10b981' : 'var(--lumen-text-muted)', marginBottom: 1 }}>Redactar manualmente</p>
            <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)' }}>Escribe o pega el contenido</p>
          </div>
        </div>
        <div style={{
          flex: 1, padding: '10px 14px',
          background: initialMode === 'url' ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Link size={13} style={{ color: initialMode === 'url' ? '#3b82f6' : 'var(--lumen-text-muted)' }} />
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: initialMode === 'url' ? '#3b82f6' : 'var(--lumen-text-muted)', marginBottom: 1 }}>Importar desde URL</p>
            <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)' }}>Extrae contenido web automáticamente</p>
          </div>
        </div>
      </div>

      <div style={initialMode === 'url' ? { border: '1px solid rgba(59,130,246,0.25)', borderRadius: 6, padding: '12px', background: 'rgba(59,130,246,0.04)' } : {}}>
        <label className="block text-sm font-medium mb-1.5" style={{ color: initialMode === 'url' ? '#3b82f6' : 'var(--lumen-text-secondary)' }}>
          {initialMode === 'url' ? 'URL a importar' : 'Importar desde URL (opcional)'}
        </label>
        <div className="flex gap-2">
          <input ref={urlRef} type="url" value={form.source_url} onChange={(e) => set('source_url', e.target.value)} className="dark-input flex-1" placeholder="https://..." />
          <button type="button" onClick={handleScrape} disabled={scraping || !form.source_url.trim()}
            className="btn-ghost">
            {scraping ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />} Obtener
          </button>
        </div>
        <p className="text-[10px] mt-1" style={{ color: 'var(--lumen-text-muted)' }}>Extrae automaticamente titulo y contenido de la URL</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Contenido de la politica *</label>
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
