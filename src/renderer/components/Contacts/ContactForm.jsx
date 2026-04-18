import React, { useState } from 'react';
import { Plus, X, Phone, Mail, Globe, MapPin, Facebook, Instagram, Linkedin } from 'lucide-react';

const SOCIAL_FIELDS = [
  { key: 'social_facebook', label: 'Facebook', icon: Facebook },
  { key: 'social_x', label: 'X (Twitter)', icon: () => <span className="text-xs font-bold">X</span> },
  { key: 'social_instagram', label: 'Instagram', icon: Instagram },
  { key: 'social_slack', label: 'Slack', icon: () => <span className="text-xs font-bold">S</span> },
  { key: 'social_linkedin', label: 'LinkedIn', icon: Linkedin },
];

function DynamicList({ items, onAdd, onRemove, onChange, placeholder, icon: Icon }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Icon size={14} style={{ color: 'var(--lumen-text-muted)', flexShrink: 0 }} />
          <input type="text" value={item} onChange={(e) => onChange(i, e.target.value)}
            className="dark-input !py-2 !text-sm flex-1" placeholder={placeholder} />
          <button type="button" onClick={() => onRemove(i)} className="p-1 rounded" style={{ color: 'var(--lumen-text-muted)' }}>
            <X size={14} />
          </button>
        </div>
      ))}
      <button type="button" onClick={onAdd}
        className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors"
        style={{ color: 'var(--lumen-accent)' }}>
        <Plus size={12} /> Agregar
      </button>
    </div>
  );
}

export default function ContactForm({ contact, onSave, onCancel }) {
  const parse = (val) => { try { return JSON.parse(val || '[]'); } catch { return []; } };

  const [form, setForm] = useState({
    name: contact?.name || '',
    last_name: contact?.last_name || '',
    company: contact?.company || '',
    department: contact?.department || '',
    phones: parse(contact?.phones),
    emails: parse(contact?.emails),
    urls: parse(contact?.urls),
    addresses: parse(contact?.addresses),
    birthday: contact?.birthday || '',
    relationship: contact?.relationship || '',
    social_facebook: contact?.social_facebook || '',
    social_x: contact?.social_x || '',
    social_instagram: contact?.social_instagram || '',
    social_slack: contact?.social_slack || '',
    social_linkedin: contact?.social_linkedin || '',
    contact_method: contact?.contact_method || '',
    when_to_contact: contact?.when_to_contact || '',
    notes: contact?.notes || '',
  });
  const [error, setError] = useState('');
  const [showSocial, setShowSocial] = useState(
    !!(contact?.social_facebook || contact?.social_x || contact?.social_instagram || contact?.social_slack || contact?.social_linkedin)
  );

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const updateList = (key, index, value) => {
    const list = [...form[key]];
    list[index] = value;
    set(key, list);
  };

  const addToList = (key) => set(key, [...form[key], '']);
  const removeFromList = (key, index) => set(key, form[key].filter((_, i) => i !== index));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('El nombre es obligatorio.'); return;
    }
    // Clean empty entries from lists
    const cleaned = {
      ...form,
      phones: form.phones.filter((p) => p.trim()),
      emails: form.emails.filter((e) => e.trim()),
      urls: form.urls.filter((u) => u.trim()),
      addresses: form.addresses.filter((a) => a.trim()),
    };
    onSave(cleaned);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>{error}</div>}

      {/* Basic fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Nombre *</label>
          <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} className="dark-input" placeholder="Nombre" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Apellidos</label>
          <input type="text" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} className="dark-input" placeholder="Apellidos" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Empresa</label>
          <input type="text" value={form.company} onChange={(e) => set('company', e.target.value)} className="dark-input" placeholder="Nombre de empresa" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Departamento</label>
          <input type="text" value={form.department} onChange={(e) => set('department', e.target.value)} className="dark-input" placeholder="Ej: Ventas, Soporte" />
        </div>
      </div>

      {/* Dynamic fields */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Telefonos</label>
          <DynamicList items={form.phones} icon={Phone} placeholder="+504 ..." onAdd={() => addToList('phones')}
            onRemove={(i) => removeFromList('phones', i)} onChange={(i, v) => updateList('phones', i, v)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Correos</label>
          <DynamicList items={form.emails} icon={Mail} placeholder="email@ejemplo.com" onAdd={() => addToList('emails')}
            onRemove={(i) => removeFromList('emails', i)} onChange={(i, v) => updateList('emails', i, v)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>URLs</label>
          <DynamicList items={form.urls} icon={Globe} placeholder="https://..." onAdd={() => addToList('urls')}
            onRemove={(i) => removeFromList('urls', i)} onChange={(i, v) => updateList('urls', i, v)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Direcciones</label>
          <DynamicList items={form.addresses} icon={MapPin} placeholder="Direccion..." onAdd={() => addToList('addresses')}
            onRemove={(i) => removeFromList('addresses', i)} onChange={(i, v) => updateList('addresses', i, v)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Cumpleanos</label>
          <input type="date" value={form.birthday} onChange={(e) => set('birthday', e.target.value)} className="dark-input" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Relacion</label>
          <input type="text" value={form.relationship} onChange={(e) => set('relationship', e.target.value)} className="dark-input" placeholder="Ej: Supervisor, Proveedor" />
        </div>
      </div>

      {/* Social networks */}
      <div>
        <button type="button" onClick={() => setShowSocial(!showSocial)}
          className="flex items-center gap-2 text-sm font-medium mb-2" style={{ color: 'var(--lumen-accent)' }}>
          {showSocial ? <X size={12} /> : <Plus size={12} />} Redes sociales
        </button>
        {showSocial && (
          <div className="space-y-2 p-3 rounded-xl" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
            {SOCIAL_FIELDS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--lumen-card)', color: 'var(--lumen-text-muted)' }}>
                    <Icon size={14} />
                  </div>
                  <input type="text" value={form[s.key]} onChange={(e) => set(s.key, e.target.value)}
                    className="dark-input !py-2 !text-sm flex-1" placeholder={`${s.label} (usuario o URL)`} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Escalation fields */}
      <div className="p-3 rounded-xl" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--lumen-accent)' }}>Informacion de escalacion</p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Medio de contacto</label>
            <input type="text" value={form.contact_method} onChange={(e) => set('contact_method', e.target.value)} className="dark-input" placeholder="Ej: Slack, ext. 1234, email" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Cuando contactar</label>
            <textarea value={form.when_to_contact} onChange={(e) => set('when_to_contact', e.target.value)} rows={2}
              className="dark-input resize-y" placeholder="Describe la situacion en la que escalar..." />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Notas</label>
        <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2}
          className="dark-input resize-y" placeholder="Notas adicionales sobre este contacto..." />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-accent">
          {contact ? 'Guardar cambios' : 'Agregar contacto'}
        </button>
      </div>
    </form>
  );
}
