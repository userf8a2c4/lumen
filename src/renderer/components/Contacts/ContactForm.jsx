import React, { useState } from 'react';

export default function ContactForm({ contact, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: contact?.name || '', department: contact?.department || '',
    contact_method: contact?.contact_method || '', when_to_contact: contact?.when_to_contact || '',
  });
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.department.trim() || !form.contact_method.trim() || !form.when_to_contact.trim()) {
      setError('Todos los campos son obligatorios.'); return;
    }
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-lumen-text-secondary mb-1.5">Nombre *</label>
        <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className="dark-input" placeholder="Nombre del contacto" />
      </div>
      <div>
        <label className="block text-sm font-medium text-lumen-text-secondary mb-1.5">Área / Departamento *</label>
        <input type="text" value={form.department} onChange={(e) => set('department', e.target.value)} className="dark-input" placeholder="Ej: Supervisión, TI, Facturación" />
      </div>
      <div>
        <label className="block text-sm font-medium text-lumen-text-secondary mb-1.5">Medio de contacto *</label>
        <input type="text" value={form.contact_method} onChange={(e) => set('contact_method', e.target.value)} className="dark-input" placeholder="Ej: Slack, ext. 1234, email@empresa.com" />
      </div>
      <div>
        <label className="block text-sm font-medium text-lumen-text-secondary mb-1.5">¿Cuándo contactar? *</label>
        <textarea value={form.when_to_contact} onChange={(e) => set('when_to_contact', e.target.value)} rows={3}
          className="dark-input resize-y" placeholder="Describe la situación en la que se debe escalar a esta persona..." />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-accent">
          {contact ? 'Guardar cambios' : 'Agregar contacto'}
        </button>
      </div>
    </form>
  );
}
