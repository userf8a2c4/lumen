import React, { useState } from 'react';
import { Globe, Loader2 } from 'lucide-react';

export default function PolicyForm({ policy, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: policy?.name || '', department: policy?.department || '',
    description: policy?.description || '', content: policy?.content || '',
    source_url: policy?.source_url || '',
  });
  const [scraping, setScraping] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
      {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-lumen-text-secondary mb-1.5">Nombre *</label>
          <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className="dark-input" placeholder="Ej: Política de reembolsos" />
        </div>
        <div>
          <label className="block text-sm font-medium text-lumen-text-secondary mb-1.5">Departamento *</label>
          <input type="text" value={form.department} onChange={(e) => set('department', e.target.value)} className="dark-input" placeholder="Ej: Ventas, Soporte, Facturación" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-lumen-text-secondary mb-1.5">Descripción corta</label>
        <input type="text" value={form.description} onChange={(e) => set('description', e.target.value)} className="dark-input" placeholder="Breve resumen de la política" />
      </div>

      <div>
        <label className="block text-sm font-medium text-lumen-text-secondary mb-1.5">Importar desde URL (opcional)</label>
        <div className="flex gap-2">
          <input type="url" value={form.source_url} onChange={(e) => set('source_url', e.target.value)} className="dark-input flex-1" placeholder="https://..." />
          <button type="button" onClick={handleScrape} disabled={scraping || !form.source_url.trim()}
            className="btn-ghost">
            {scraping ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />} Obtener
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-lumen-text-secondary mb-1.5">Contenido de la política *</label>
        <textarea value={form.content} onChange={(e) => set('content', e.target.value)} rows={10}
          className="dark-input resize-y" placeholder="Pega aquí el texto completo de la política..." />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-accent">
          {policy ? 'Guardar cambios' : 'Agregar política'}
        </button>
      </div>
    </form>
  );
}
