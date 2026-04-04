import React, { useState, useEffect } from 'react';
import { Plus, Users, Search, Edit3, Trash2, Phone, Mail, Building2 } from 'lucide-react';
import Modal from '../Modal';
import ContactForm from './ContactForm';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = searchQuery.trim()
        ? await window.lumen.contacts.search(searchQuery.trim())
        : await window.lumen.contacts.getAll();
      setContacts(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [searchQuery]);

  const handleSave = async (data) => {
    editingContact
      ? await window.lumen.contacts.update(editingContact.id, data)
      : await window.lumen.contacts.create(data);
    setShowForm(false); setEditingContact(null); load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este contacto?')) return;
    await window.lumen.contacts.delete(id); load();
  };

  const parseJSON = (val) => { try { return JSON.parse(val || '[]'); } catch { return []; } };

  return (
    <div>
      <div className="dark-card p-5 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
            <Users size={20} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--lumen-text)' }}>Directorio de Escalacion</h2>
            <p className="text-xs" style={{ color: 'var(--lumen-text-muted)' }}>{contacts.length} contacto{contacts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => { setEditingContact(null); setShowForm(true); }} className="btn-accent">
          <Plus size={16} /> Agregar contacto
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--lumen-text-muted)' }} />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre, area o situacion..."
          className="dark-input !pl-10" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(126,63,242,0.2)', borderTopColor: '#7E3FF2' }} />
        </div>
      ) : contacts.length === 0 ? (
        <div className="dark-card flex flex-col items-center justify-center py-16">
          <Users size={40} strokeWidth={1} style={{ color: 'var(--lumen-text-muted)' }} className="mb-3" />
          <p className="text-sm" style={{ color: 'var(--lumen-text-secondary)' }}>{searchQuery ? 'No se encontraron contactos' : 'No hay contactos registrados'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contacts.map((c) => {
            const phones = parseJSON(c.phones);
            const emails = parseJSON(c.emails);
            const fullName = [c.name, c.last_name].filter(Boolean).join(' ');

            return (
              <div key={c.id} className="dark-card p-4 group transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium" style={{ color: 'var(--lumen-text)' }}>{fullName}</h3>

                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {c.department && (
                        <span className="inline-block px-2.5 py-0.5 text-xs rounded-full font-medium"
                          style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
                          {c.department}
                        </span>
                      )}
                      {c.company && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full"
                          style={{ background: 'var(--lumen-surface)', color: 'var(--lumen-text-secondary)', border: '1px solid var(--lumen-border)' }}>
                          <Building2 size={10} /> {c.company}
                        </span>
                      )}
                    </div>

                    {/* Contact info */}
                    <div className="mt-2 space-y-1">
                      {c.contact_method && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--lumen-text-secondary)' }}>
                          <Phone size={11} style={{ color: 'var(--lumen-text-muted)' }} />
                          <span>{c.contact_method}</span>
                        </div>
                      )}
                      {phones.length > 0 && phones[0] && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--lumen-text-secondary)' }}>
                          <Phone size={11} style={{ color: 'var(--lumen-text-muted)' }} />
                          <span>{phones[0]}{phones.length > 1 ? ` (+${phones.length - 1})` : ''}</span>
                        </div>
                      )}
                      {emails.length > 0 && emails[0] && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--lumen-text-secondary)' }}>
                          <Mail size={11} style={{ color: 'var(--lumen-text-muted)' }} />
                          <span className="truncate">{emails[0]}</span>
                        </div>
                      )}
                    </div>

                    {c.when_to_contact && (
                      <div className="mt-2 p-2.5 rounded-lg" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
                        <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--lumen-text-muted)' }}>Contactar cuando:</p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--lumen-text-secondary)' }}>{c.when_to_contact}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <button onClick={() => { setEditingContact(c); setShowForm(true); }} className="p-1.5 rounded-lg transition-colors">
                      <Edit3 size={14} style={{ color: 'var(--lumen-text-muted)' }} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg transition-colors">
                      <Trash2 size={14} style={{ color: '#f87171' }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title={editingContact ? 'Editar contacto' : 'Nuevo contacto'} onClose={() => { setShowForm(false); setEditingContact(null); }} wide>
          <ContactForm contact={editingContact} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingContact(null); }} />
        </Modal>
      )}
    </div>
  );
}
