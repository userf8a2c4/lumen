import React, { useState, useEffect } from 'react';
import { Plus, Users, Search, Edit3, Trash2, Phone } from 'lucide-react';
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
    if (!confirm('¿Eliminar este contacto?')) return;
    await window.lumen.contacts.delete(id); load();
  };

  return (
    <div>
      <div className="dark-card p-5 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-lumen-text">Directorio de Escalación</h2>
            <p className="text-xs text-lumen-text-muted">{contacts.length} contacto{contacts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => { setEditingContact(null); setShowForm(true); }} className="btn-accent">
          <Plus size={16} /> Agregar contacto
        </button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lumen-text-muted" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre, área o situación..."
          className="dark-input !pl-10" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-lumen-accent/20 border-t-lumen-accent rounded-full animate-spin" />
        </div>
      ) : contacts.length === 0 ? (
        <div className="dark-card flex flex-col items-center justify-center py-16">
          <Users size={40} strokeWidth={1} className="text-lumen-text-muted mb-3" />
          <p className="text-sm text-lumen-text-secondary">{searchQuery ? 'No se encontraron contactos' : 'No hay contactos registrados'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {contacts.map((c) => (
            <div key={c.id} className="dark-card p-4 group hover:border-blue-500/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-lumen-text">{c.name}</h3>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-full font-medium">
                    {c.department}
                  </span>
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-lumen-text-secondary">
                    <Phone size={11} className="text-lumen-text-muted" />
                    <span>{c.contact_method}</span>
                  </div>
                  <div className="mt-2 bg-lumen-surface rounded-lg p-2.5 border border-lumen-border">
                    <p className="text-xs text-lumen-text-muted font-medium mb-0.5">Contactar cuando:</p>
                    <p className="text-xs text-lumen-text-secondary leading-relaxed">{c.when_to_contact}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                  <button onClick={() => { setEditingContact(c); setShowForm(true); }} className="p-1.5 hover:bg-lumen-accent/10 rounded-lg transition-colors">
                    <Edit3 size={14} className="text-lumen-text-muted" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 size={14} className="text-red-400/70" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editingContact ? 'Editar contacto' : 'Nuevo contacto'} onClose={() => { setShowForm(false); setEditingContact(null); }}>
          <ContactForm contact={editingContact} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingContact(null); }} />
        </Modal>
      )}
    </div>
  );
}
