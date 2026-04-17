import React, { useState, useEffect } from 'react';
import { Plus, Users, Search, Edit3, Trash2, Phone, Mail, Building2, X, MessageSquare, Clock, ChevronRight } from 'lucide-react';
import Modal from '../Modal';
import ContactForm from './ContactForm';

/* ── Inline view modal ─────────────────────────────────────── */
function ContactView({ contact, onEdit, onDelete, onClose }) {
  const parseJSON = (val) => { try { return JSON.parse(val || '[]'); } catch { return []; } };
  const phones  = parseJSON(contact.phones);
  const emails  = parseJSON(contact.emails);
  const fullName = [contact.name, contact.last_name].filter(Boolean).join(' ');
  const initials = contact.name?.[0]?.toUpperCase() || '?';

  return (
    <div className="space-y-5">
      {/* Identity */}
      <div className="flex items-center gap-4 pb-4" style={{ borderBottom: '1px solid var(--lumen-border)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
          style={{ background: 'rgba(59,130,246,0.10)', color: '#60a5fa' }}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[18px] font-semibold mb-1" style={{ color: 'var(--lumen-text)' }}>{fullName}</h2>
          <div className="flex flex-wrap gap-2">
            {contact.department && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa' }}>
                {contact.department}
              </span>
            )}
            {contact.company && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px]"
                style={{ background: 'var(--lumen-surface)', color: 'var(--lumen-text-secondary)', border: '1px solid var(--lumen-border)' }}>
                <Building2 size={10} /> {contact.company}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Método de contacto preferido */}
      {contact.contact_method && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: '#60a5fa' }}>
            Método de contacto
          </p>
          <div className="flex items-center gap-2">
            <MessageSquare size={13} style={{ color: '#60a5fa' }} />
            <span className="text-[13px]" style={{ color: 'var(--lumen-text)' }}>{contact.contact_method}</span>
          </div>
        </div>
      )}

      {/* Teléfonos */}
      {phones.length > 0 && phones[0] && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--lumen-text-muted)' }}>
            Teléfonos
          </p>
          <div className="space-y-1.5">
            {phones.filter(Boolean).map((p, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
                <Phone size={13} style={{ color: 'var(--lumen-text-muted)' }} />
                <span className="text-[13px] font-mono" style={{ color: 'var(--lumen-text)' }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emails */}
      {emails.length > 0 && emails[0] && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--lumen-text-muted)' }}>
            Correos
          </p>
          <div className="space-y-1.5">
            {emails.filter(Boolean).map((e, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
                <Mail size={13} style={{ color: 'var(--lumen-text-muted)' }} />
                <span className="text-[13px]" style={{ color: 'var(--lumen-text)' }}>{e}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cuándo contactar */}
      {contact.when_to_contact && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--lumen-text-muted)' }}>
            Cuándo contactar
          </p>
          <div className="flex items-start gap-2.5 px-3 py-3 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <Clock size={13} className="mt-0.5 shrink-0" style={{ color: '#f59e0b' }} />
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--lumen-text)' }}>
              {contact.when_to_contact}
            </p>
          </div>
        </div>
      )}

      {/* Notas adicionales */}
      {contact.notes && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--lumen-text-muted)' }}>
            Notas
          </p>
          <p className="text-[13px] leading-relaxed px-3 py-3 rounded-xl"
            style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)', color: 'var(--lumen-text-secondary)' }}>
            {contact.notes}
          </p>
        </div>
      )}

      {/* Actions footer */}
      <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid var(--lumen-border)' }}>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
        >
          <Trash2 size={14} /> Eliminar
        </button>
        <button onClick={onEdit} className="btn-accent flex-1 justify-center">
          <Edit3 size={14} /> Editar contacto
        </button>
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────── */
export default function Contacts() {
  const [contacts, setContacts]           = useState([]);
  const [viewingContact, setViewingContact] = useState(null);
  const [showForm, setShowForm]           = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchQuery, setSearchQuery]     = useState('');
  const [loading, setLoading]             = useState(true);

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
    setShowForm(false);
    setEditingContact(null);
    setViewingContact(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este contacto?')) return;
    await window.lumen.contacts.delete(id);
    setViewingContact(null);
    load();
  };

  const openEdit = (contact) => {
    setViewingContact(null);
    setEditingContact(contact);
    setShowForm(true);
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
            <h2>Directorio</h2>
            <p>{contacts.length} contacto{contacts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => { setEditingContact(null); setShowForm(true); }} className="btn-accent">
          <Plus size={15} /> Agregar
        </button>
      </div>

      {/* Search + Stats */}
      <div className="bento-grid bento-grid-4 mb-4">
        <div className="bento-card bento-span-2">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--lumen-text-muted)' }} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, área o situación..."
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

      {/* Cards grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: 'rgba(59,130,246,0.2)', borderTopColor: '#60a5fa' }} />
        </div>
      ) : contacts.length === 0 ? (
        <div className="bento-card flex flex-col items-center justify-center py-16">
          <Users size={40} strokeWidth={1} style={{ color: 'var(--lumen-text-muted)' }} className="mb-3" />
          <p className="text-[13px]" style={{ color: 'var(--lumen-text-secondary)' }}>
            {searchQuery ? 'No se encontraron contactos' : 'No hay contactos registrados'}
          </p>
        </div>
      ) : (
        <div className="bento-grid bento-grid-2">
          {contacts.map((c) => {
            const phones = parseJSON(c.phones);
            const emails = parseJSON(c.emails);
            const fullName = [c.name, c.last_name].filter(Boolean).join(' ');

            return (
              <button
                key={c.id}
                className="bento-card interactive w-full text-left group"
                onClick={() => setViewingContact(c)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Identity row */}
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa' }}>
                        {c.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[13px] font-medium truncate" style={{ color: 'var(--lumen-text)' }}>{fullName}</h3>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {c.department && (
                            <span className="px-2 py-0.5 text-[10px] rounded-full font-medium"
                              style={{ background: 'rgba(59,130,246,0.08)', color: '#60a5fa' }}>
                              {c.department}
                            </span>
                          )}
                          {c.company && (
                            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full"
                              style={{ background: 'var(--lumen-surface)', color: 'var(--lumen-text-secondary)', border: '1px solid var(--lumen-border)' }}>
                              <Building2 size={9} /> {c.company}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contact info preview */}
                    <div className="space-y-1">
                      {c.contact_method && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--lumen-text-secondary)' }}>
                          <MessageSquare size={10} style={{ color: 'var(--lumen-text-muted)' }} />
                          <span className="truncate">{c.contact_method}</span>
                        </div>
                      )}
                      {phones[0] && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--lumen-text-secondary)' }}>
                          <Phone size={10} style={{ color: 'var(--lumen-text-muted)' }} />
                          <span>{phones[0]}{phones.length > 1 ? ` +${phones.length - 1}` : ''}</span>
                        </div>
                      )}
                      {emails[0] && (
                        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--lumen-text-secondary)' }}>
                          <Mail size={10} style={{ color: 'var(--lumen-text-muted)' }} />
                          <span className="truncate">{emails[0]}</span>
                        </div>
                      )}
                    </div>

                    {c.when_to_contact && (
                      <div className="mt-2.5 p-2.5 rounded-xl"
                        style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
                        <p className="text-[10px] font-medium mb-0.5" style={{ color: 'var(--lumen-text-muted)' }}>
                          Contactar cuando:
                        </p>
                        <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--lumen-text-secondary)' }}>
                          {c.when_to_contact}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Chevron hint */}
                  <ChevronRight size={15} className="shrink-0 ml-2 mt-0.5 opacity-0 group-hover:opacity-50 transition-opacity"
                    style={{ color: 'var(--lumen-text-muted)' }} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* View modal */}
      {viewingContact && (
        <Modal
          title={[viewingContact.name, viewingContact.last_name].filter(Boolean).join(' ')}
          onClose={() => setViewingContact(null)}
          wide
        >
          <ContactView
            contact={viewingContact}
            onEdit={() => openEdit(viewingContact)}
            onDelete={() => handleDelete(viewingContact.id)}
            onClose={() => setViewingContact(null)}
          />
        </Modal>
      )}

      {/* Create / edit form */}
      {showForm && (
        <Modal
          title={editingContact ? 'Editar contacto' : 'Nuevo contacto'}
          onClose={() => { setShowForm(false); setEditingContact(null); }}
          wide
        >
          <ContactForm
            contact={editingContact}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditingContact(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
