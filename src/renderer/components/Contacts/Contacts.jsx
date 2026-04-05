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

  const deptCounts = contacts.reduce((acc, c) => {
    if (c.department) acc[c.department] = (acc[c.department] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="bento-card mb-4 flex items-center justify-between">
        <div className="module-header">
          <div className="module-icon" style={{ background: 'rgba(59,130,246,0.08)' }}>
            <Users size={22} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <h2>Directorio de Escalacion</h2>
            <p>{contacts.length} contacto{contacts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => { setEditingContact(null); setShowForm(true); }} className="btn-accent">
          <Plus size={15} /> Agregar
        </button>
      </div>

      {/* Stats + Search row */}
      <div className="bento-grid bento-grid-4 mb-4">
        <div className="bento-card bento-span-2">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--lumen-text-muted)' }} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, area o situacion..."
              className="dark-input !pl-10" />
          </div>
        </div>
        <div className="bento-card flex items-center gap-3">
          <div className="bento-stat">
            <span className="stat-value">{contacts.length}</span>
            <span className="stat-label">Contactos</span>
          </div>
        </div>
        <div className="bento-card flex items-center gap-3">
          <div className="bento-stat">
            <span className="stat-value">{Object.keys(deptCounts).length}</span>
            <span className="stat-label">Departamentos</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(126,63,242,0.2)', borderTopColor: '#7E3FF2' }} />
        </div>
      ) : contacts.length === 0 ? (
        <div className="bento-card flex flex-col items-center justify-center py-16">
          <Users size={40} strokeWidth={1} style={{ color: 'var(--lumen-text-muted)' }} className="mb-3" />
          <p className="text-[13px]" style={{ color: 'var(--lumen-text-secondary)' }}>{searchQuery ? 'No se encontraron contactos' : 'No hay contactos registrados'}</p>
        </div>
      ) : (
        <div className="bento-grid bento-grid-2">
          {contacts.map((c) => {
            const phones = parseJSON(c.phones);
            const emails = parseJSON(c.emails);
            const fullName = [c.name, c.last_name].filter(Boolean).join(' ');

            return (
              <div key={c.id} className="bento-card interactive group cursor-default">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-semibold"
                        style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa' }}>
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-[13px] font-medium" style={{ color: 'var(--lumen-text)' }}>{fullName}</h3>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {c.department && (
                            <span className="inline-block px-2 py-0.5 text-[10px] rounded-full font-medium"
                              style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa' }}>
                              {c.department}
                            </span>
                          )}
                          {c.company && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full"
                              style={{ background: 'var(--lumen-surface)', color: 'var(--lumen-text-secondary)', border: '1px solid var(--lumen-border)' }}>
                              <Building2 size={9} /> {c.company}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2.5 space-y-1">
                      {c.contact_method && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--lumen-text-secondary)' }}>
                          <Phone size={10} style={{ color: 'var(--lumen-text-muted)' }} />
                          <span>{c.contact_method}</span>
                        </div>
                      )}
                      {phones.length > 0 && phones[0] && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--lumen-text-secondary)' }}>
                          <Phone size={10} style={{ color: 'var(--lumen-text-muted)' }} />
                          <span>{phones[0]}{phones.length > 1 ? ` (+${phones.length - 1})` : ''}</span>
                        </div>
                      )}
                      {emails.length > 0 && emails[0] && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--lumen-text-secondary)' }}>
                          <Mail size={10} style={{ color: 'var(--lumen-text-muted)' }} />
                          <span className="truncate">{emails[0]}</span>
                        </div>
                      )}
                    </div>

                    {c.when_to_contact && (
                      <div className="mt-2.5 p-2.5 rounded-xl" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
                        <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--lumen-text-muted)' }}>Contactar cuando:</p>
                        <p className="text-xs leading-relaxed" style={{ color: 'var(--lumen-text-secondary)' }}>{c.when_to_contact}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <button onClick={() => { setEditingContact(c); setShowForm(true); }} className="p-1.5 rounded-lg transition-colors">
                      <Edit3 size={13} style={{ color: 'var(--lumen-text-muted)' }} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg transition-colors">
                      <Trash2 size={13} style={{ color: '#f87171' }} />
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
