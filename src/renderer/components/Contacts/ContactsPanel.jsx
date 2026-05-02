/**
 * ContactsPanel — Panel flotante de contactos para AC3.
 * Se muestra como un drawer deslizable sobre el contenido existente.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Search, Phone, Mail, Building2, MessageSquare,
  Clock, X, Plus, Edit3, Trash2, ChevronRight, ArrowLeft,
} from 'lucide-react';
import Modal from '../Modal';
import ContactForm from './ContactForm';

function ContactDetail({ contact, onEdit, onDelete, onBack }) {
  const parseJSON = (v) => { try { return JSON.parse(v || '[]'); } catch { return []; } };
  const phones  = parseJSON(contact.phones);
  const emails  = parseJSON(contact.emails);
  const fullName = [contact.name, contact.last_name].filter(Boolean).join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sub-header */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', fontSize: 11 }}>
          <ArrowLeft size={13} /> Contactos
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {/* Avatar + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--lumen-border)' }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(96,165,250,0.12)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
            {contact.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--lumen-text)', marginBottom: 4 }}>{fullName}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {contact.department && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(96,165,250,0.10)', color: '#60a5fa', fontWeight: 500 }}>{contact.department}</span>}
              {contact.company && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', color: 'var(--lumen-text-muted)', border: '1px solid var(--lumen-border)' }}>{contact.company}</span>}
            </div>
          </div>
        </div>

        {/* Contact method */}
        {contact.contact_method && (
          <div style={{ marginBottom: 12, padding: '10px 12px', background: 'rgba(96,165,250,0.04)', border: '1px solid rgba(96,165,250,0.12)', borderRadius: 8 }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: '#60a5fa', textTransform: 'uppercase', marginBottom: 4 }}>Método de contacto</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MessageSquare size={12} style={{ color: '#60a5fa' }} />
              <span style={{ fontSize: 12, color: 'var(--lumen-text)' }}>{contact.contact_method}</span>
            </div>
          </div>
        )}

        {/* Phones */}
        {phones.filter(Boolean).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Teléfonos</p>
            {phones.filter(Boolean).map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)', borderRadius: 6, marginBottom: 4 }}>
                <Phone size={11} style={{ color: 'var(--lumen-text-muted)' }} />
                <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--lumen-text)' }}>{p}</span>
              </div>
            ))}
          </div>
        )}

        {/* Emails */}
        {emails.filter(Boolean).length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Correos</p>
            {emails.filter(Boolean).map((e, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)', borderRadius: 6, marginBottom: 4 }}>
                <Mail size={11} style={{ color: 'var(--lumen-text-muted)' }} />
                <span style={{ fontSize: 11, color: 'var(--lumen-text)' }}>{e}</span>
              </div>
            ))}
          </div>
        )}

        {/* When to contact */}
        {contact.when_to_contact && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Cuándo contactar</p>
            <div style={{ display: 'flex', gap: 8, padding: '10px 12px', background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 8 }}>
              <Clock size={12} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--lumen-text)', lineHeight: 1.5 }}>{contact.when_to_contact}</p>
            </div>
          </div>
        )}

        {/* Notes */}
        {contact.notes && (
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', color: 'var(--lumen-text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Notas</p>
            <p style={{ fontSize: 12, color: 'var(--lumen-text-secondary)', lineHeight: 1.55, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--lumen-border)', borderRadius: 6 }}>{contact.notes}</p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--lumen-border)', display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={onDelete}
          style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 6, fontSize: 11, fontWeight: 500, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#ef4444', cursor: 'pointer' }}
        >
          <Trash2 size={12} /> Eliminar
        </button>
        <button
          onClick={onEdit}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'var(--lumen-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          <Edit3 size={12} /> Editar
        </button>
      </div>
    </div>
  );
}

export default function ContactsPanel({ onClose }) {
  const [contacts, setContacts]           = useState([]);
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(true);
  const [selected, setSelected]           = useState(null);
  const [showForm, setShowForm]           = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const searchRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = search.trim()
        ? await window.lumen.contacts.search(search.trim())
        : await window.lumen.contacts.getAll();
      setContacts(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); setTimeout(() => searchRef.current?.focus(), 80); }, []);
  useEffect(() => { const t = setTimeout(load, 280); return () => clearTimeout(t); }, [search]);

  const handleSave = async (data) => {
    if (editingContact) await window.lumen.contacts.update(editingContact.id, data);
    else await window.lumen.contacts.create(data);
    setShowForm(false);
    setEditingContact(null);
    setSelected(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este contacto?')) return;
    await window.lumen.contacts.delete(id);
    setSelected(null);
    load();
  };

  const openEdit = (c) => {
    setSelected(null);
    setEditingContact(c);
    setShowForm(true);
  };

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0,
      width: 320, zIndex: 50,
      background: 'var(--lumen-bg)',
      borderLeft: '1px solid var(--lumen-border)',
      display: 'flex', flexDirection: 'column',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.40)',
      animation: 'slideInRight 0.2s ease',
    }}>
      <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

      {/* Header */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--lumen-border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Users size={13} style={{ color: '#60a5fa' }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--lumen-text)', flex: 1 }}>Contactos</span>
        <button
          onClick={() => { setEditingContact(null); setShowForm(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 5, fontSize: 10, fontWeight: 600, background: 'var(--lumen-accent)', color: '#fff', border: 'none', cursor: 'pointer' }}
        >
          <Plus size={11} /> Nuevo
        </button>
        <button onClick={onClose} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', borderRadius: 4 }}>
          <X size={14} />
        </button>
      </div>

      {selected ? (
        <ContactDetail
          contact={selected}
          onBack={() => setSelected(null)}
          onEdit={() => openEdit(selected)}
          onDelete={() => handleDelete(selected.id)}
        />
      ) : (
        <>
          {/* Search */}
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--lumen-border)', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--lumen-text-muted)' }} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar contacto..."
                style={{
                  width: '100%', padding: '7px 10px 7px 30px',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--lumen-border)',
                  borderRadius: 6, fontSize: 12, color: 'var(--lumen-text)',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '30px 0' }}>
                <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#60a5fa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : contacts.length === 0 ? (
              <div style={{ padding: '30px 14px', textAlign: 'center' }}>
                <Users size={28} style={{ color: 'var(--lumen-text-muted)', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 12, color: 'var(--lumen-text-muted)' }}>{search ? 'Sin resultados' : 'No hay contactos'}</p>
              </div>
            ) : contacts.map((c) => {
              const phones = (() => { try { return JSON.parse(c.phones || '[]'); } catch { return []; } })();
              const fullName = [c.name, c.last_name].filter(Boolean).join(' ');
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid var(--lumen-border)', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(96,165,250,0.10)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {c.name?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--lumen-text)', marginBottom: 2 }}>{fullName}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {c.department && <span style={{ fontSize: 10, color: '#60a5fa' }}>{c.department}</span>}
                      {phones[0] && <span style={{ fontSize: 10, color: 'var(--lumen-text-muted)', fontFamily: 'monospace' }}>{phones[0]}</span>}
                    </div>
                  </div>
                  <ChevronRight size={12} style={{ color: 'var(--lumen-text-muted)', flexShrink: 0 }} />
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* Create/edit form modal */}
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
