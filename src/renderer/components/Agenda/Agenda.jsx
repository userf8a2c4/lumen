import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CalendarDays, Plus, RefreshCw, Wifi, WifiOff, ChevronRight,
  Clock, Pencil, Trash2, X, Check, StickyNote, AlertCircle, Image,
} from 'lucide-react';
import Modal from '../Modal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const OP_TAGS = ['reunion', 'reunión', 'cierre', 'junta', 'meeting', 'visita', 'entrega', 'pago'];
const ACCENT  = 'var(--lumen-accent)';

function isOperational(event) {
  const txt = `${event.summary || ''} ${event.description || ''}`.toLowerCase();
  return OP_TAGS.some((t) => txt.includes(t));
}

function formatTime(dt) {
  if (!dt) return '';
  if (dt.date) return 'Todo el día';
  return new Date(dt.dateTime).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDay(dateStr) {
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('es', { weekday: 'short', day: 'numeric', month: 'short' });
}

function groupByDay(events) {
  const map = {};
  events.forEach((ev) => {
    const key = (ev.start?.date || ev.start?.dateTime || '').slice(0, 10);
    if (!key) return;
    if (!map[key]) map[key] = [];
    map[key].push(ev);
  });
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
}

function isToday(dateStr) {
  return dateStr === new Date().toISOString().slice(0, 10);
}

// ─── Event form ───────────────────────────────────────────────────────────────

function EventForm({ initial, onSave, onCancel }) {
  const today = new Date().toISOString().slice(0, 16);
  const [summary,     setSummary]     = useState(initial?.summary || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [start,       setStart]       = useState(
    initial?.start?.dateTime?.slice(0, 16) || today
  );
  const [end,         setEnd]         = useState(
    initial?.end?.dateTime?.slice(0, 16) || today
  );
  const [allDay,      setAllDay]      = useState(!!(initial?.start?.date));
  const [startDate,   setStartDate]   = useState(
    initial?.start?.date || new Date().toISOString().slice(0, 10)
  );
  const [endDate,     setEndDate]     = useState(
    initial?.end?.date || new Date().toISOString().slice(0, 10)
  );
  const [error,       setError]       = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!summary.trim()) { setError('El título es obligatorio.'); return; }

    const data = {
      summary: summary.trim(),
      description: description.trim(),
    };

    if (allDay) {
      const endNext = new Date(endDate);
      endNext.setDate(endNext.getDate() + 1);
      data.start = { date: startDate };
      data.end   = { date: endNext.toISOString().slice(0, 10) };
    } else {
      data.start = { dateTime: new Date(start).toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
      data.end   = { dateTime: new Date(end).toISOString(),   timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    }
    onSave(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Título *</label>
        <input type="text" value={summary} onChange={(e) => setSummary(e.target.value)}
          className="dark-input" placeholder="Nombre del evento" autoFocus />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Descripción</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          className="dark-input resize-none" rows={3} placeholder="Detalles del evento..." />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)}
          className="rounded" />
        <span className="text-xs" style={{ color: 'var(--lumen-text-secondary)' }}>Todo el día</span>
      </label>

      {allDay ? (
        <div className="bento-grid bento-grid-2 !gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Inicio</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="dark-input" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Fin</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="dark-input" />
          </div>
        </div>
      ) : (
        <div className="bento-grid bento-grid-2 !gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Inicio</label>
            <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="dark-input" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--lumen-text-secondary)' }}>Fin</label>
            <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="dark-input" />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-ghost">Cancelar</button>
        <button type="submit" className="btn-accent">{initial ? 'Guardar cambios' : 'Crear evento'}</button>
      </div>
    </form>
  );
}

// ─── Event card ───────────────────────────────────────────────────────────────

function EventCard({ event, onEdit, onDelete, onCreateNote }) {
  const op       = isOperational(event);
  const time     = formatTime(event.start);
  const isAC3    = event.extendedProperties?.private?.lumenAC3 === 'true'
                || (event.summary || '').startsWith('[AC3]');
  const ac3Img   = event.extendedProperties?.private?.lumenImagePath || '';
  const [imgOpen, setImgOpen] = React.useState(false);

  return (
    <div
      className="rounded-2xl group transition-all"
      style={{
        background: 'var(--lumen-surface)',
        border: `1px solid ${isAC3 ? 'rgba(255,255,255,0.14)' : op ? 'rgba(255,255,255,0.06)' : 'var(--lumen-border)'}`,
        borderLeft: isAC3 ? '2px solid rgba(255,255,255,0.45)' : op ? `2px solid ${ACCENT}` : undefined,
      }}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Time */}
        <div className="flex items-center gap-1 shrink-0 mt-0.5" style={{ color: 'var(--lumen-text-muted)' }}>
          <Clock size={11} />
          <span className="text-[11px] font-mono w-[52px]">{time}</span>
        </div>

        {/* Title + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[13px] font-medium truncate" style={{ color: isAC3 ? 'var(--lumen-text)' : op ? ACCENT : 'var(--lumen-text)' }}>
              {event.summary || '(Sin título)'}
            </p>
            {isAC3 && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase',
                padding: '1px 6px', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 2,
                color: 'var(--lumen-text-secondary)',
              }}>AC3</span>
            )}
          </div>
          {event.description && (
            <p className="text-[11px] mt-0.5" style={{ color: 'var(--lumen-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {event.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {isAC3 && ac3Img && (
            <button onClick={() => setImgOpen(!imgOpen)} title="Ver imagen adjunta"
              className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--lumen-text-muted)' }}>
              <ChevronRight size={12} style={{ transform: imgOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
          )}
          <button onClick={() => onCreateNote(event)} title="Crear nota de junta"
            className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--lumen-text-muted)' }}>
            <StickyNote size={12} />
          </button>
          <button onClick={() => onEdit(event)} className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--lumen-text-muted)' }}>
            <Pencil size={12} />
          </button>
          <button onClick={() => onDelete(event)} className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#f87171' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* AC3 image preview — expands on click */}
      {isAC3 && ac3Img && imgOpen && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--lumen-border)' }}>
          <img
            src={`lumen://${ac3Img}`}
            alt="Imagen del caso AC3"
            style={{ width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 3, marginTop: 10, border: '1px solid var(--lumen-border)', background: 'rgba(0,0,0,0.4)' }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Agenda({ navigateTo }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [events,        setEvents]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [showForm,      setShowForm]      = useState(false);
  const [editingEvent,  setEditingEvent]  = useState(null);
  const [connecting,    setConnecting]    = useState(false);
  const intervalRef = useRef(null);

  const checkAuth = async () => {
    const ok = await window.lumen.calendar.isAuthenticated();
    setAuthenticated(ok);
    return ok;
  };

  const fetchEvents = useCallback(async () => {
    setError('');
    try {
      const data = await window.lumen.calendar.getEvents(14);
      setEvents(Array.isArray(data) ? data : (data?.items || []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth().then((ok) => {
      if (ok) {
        fetchEvents();
        intervalRef.current = setInterval(fetchEvents, 15 * 60 * 1000);
      } else {
        setLoading(false);
      }
    });
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    try {
      await window.lumen.calendar.connect();
      setAuthenticated(true);
      setLoading(true);
      await fetchEvents();
      intervalRef.current = setInterval(fetchEvents, 15 * 60 * 1000);
    } catch (e) {
      setError(e.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar Google Calendar?')) return;
    await window.lumen.calendar.disconnect();
    setAuthenticated(false);
    setEvents([]);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleSaveEvent = async (data) => {
    try {
      if (editingEvent) {
        await window.lumen.calendar.updateEvent(editingEvent.id, data);
      } else {
        await window.lumen.calendar.createEvent(data);
      }
      setShowForm(false);
      setEditingEvent(null);
      await fetchEvents();
    } catch (e) { setError(e.message); }
  };

  const handleDelete = async (event) => {
    if (!confirm(`¿Eliminar "${event.summary}"?`)) return;
    try {
      await window.lumen.calendar.deleteEvent(event.id);
      await fetchEvents();
    } catch (e) { setError(e.message); }
  };

  const handleCreateNote = async (event) => {
    const time = formatTime(event.start);
    const dateStr = formatDay((event.start?.date || event.start?.dateTime || '').slice(0, 10));
    await window.lumen.notes.create({
      title: `Nota de junta: ${event.summary}`,
      content: `<p><strong>Evento:</strong> ${event.summary}</p>
<p><strong>Fecha:</strong> ${dateStr} ${time !== 'Todo el día' ? `— ${time}` : '(Todo el día)'}</p>
${event.description ? `<p><strong>Descripción:</strong> ${event.description}</p>` : ''}
<hr/>
<p><em>Notas:</em></p>
<p></p>`,
      tags: ['junta', 'agenda'],
      attachments: [],
    });
    navigateTo?.('notes');
  };

  const grouped = groupByDay(events);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="bento-card mb-4 flex items-center justify-between">
        <div className="module-header">
          <div className="module-icon" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <CalendarDays size={22} style={{ color: ACCENT }} />
          </div>
          <div>
            <h2>Agenda</h2>
            <p>{authenticated ? `${events.length} evento${events.length !== 1 ? 's' : ''} próximos` : 'Google Calendar'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {authenticated && (
            <>
              <button onClick={fetchEvents} className="btn-ghost !py-2 !px-3">
                <RefreshCw size={13} /> Sync
              </button>
              <button onClick={() => { setEditingEvent(null); setShowForm(true); }} className="btn-accent">
                <Plus size={15} /> Evento
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bento-card mb-4 flex items-start gap-3"
          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: '#ef4444' }} />
          <p className="text-[12px] leading-relaxed" style={{ color: '#f87171' }}>{error}</p>
          <button onClick={() => setError('')} className="ml-auto shrink-0 p-1" style={{ color: 'var(--lumen-text-muted)' }}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Not authenticated state */}
      {!authenticated && !loading && (
        <div className="bento-card flex flex-col items-center justify-center py-14 gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <WifiOff size={26} strokeWidth={1.5} style={{ color: ACCENT }} />
          </div>
          <div className="text-center">
            <h3 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--lumen-text)' }}>
              Conecta Google Calendar
            </h3>
            <p className="text-[12px] max-w-xs leading-relaxed" style={{ color: 'var(--lumen-text-muted)' }}>
              Autoriza a LUMEN con tu cuenta Google. Se abrirá el navegador para completar la autenticación.
            </p>
          </div>
          <button onClick={handleConnect} disabled={connecting} className="btn-accent">
            {connecting ? <><RefreshCw size={13} className="animate-spin" /> Conectando…</> : <><Wifi size={13} /> Conectar con Google</>}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && authenticated && (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: 'rgba(255,255,255,0.06)', borderTopColor: ACCENT }} />
        </div>
      )}

      {/* Events list */}
      {authenticated && !loading && grouped.length === 0 && (
        <div className="bento-card flex flex-col items-center justify-center py-14">
          <CalendarDays size={40} strokeWidth={1} style={{ color: 'var(--lumen-text-muted)' }} className="mb-3" />
          <p className="text-[13px]" style={{ color: 'var(--lumen-text-secondary)' }}>
            Sin eventos en los próximos 14 días
          </p>
        </div>
      )}

      {authenticated && !loading && grouped.map(([day, dayEvents]) => (
        <div key={day} className="mb-5">
          {/* Day header */}
          <div className="flex items-center gap-3 mb-2">
            <div className={`px-3 py-1 rounded-full text-[11px] font-semibold ${isToday(day) ? 'text-white' : ''}`}
              style={{
                background: isToday(day) ? ACCENT : 'var(--lumen-surface)',
                color: isToday(day) ? 'white' : 'var(--lumen-text-secondary)',
                border: isToday(day) ? 'none' : '1px solid var(--lumen-border)',
              }}>
              {isToday(day) ? 'Hoy' : formatDay(day)}
            </div>
            <div className="flex-1 border-t" style={{ borderColor: 'var(--lumen-border)' }} />
            <span className="text-[10px]" style={{ color: 'var(--lumen-text-muted)' }}>
              {dayEvents.length} evento{dayEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Events */}
          <div className="space-y-2">
            {dayEvents.map((ev) => (
              <EventCard
                key={ev.id}
                event={ev}
                onEdit={(e) => { setEditingEvent(e); setShowForm(true); }}
                onDelete={handleDelete}
                onCreateNote={handleCreateNote}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Disconnect link */}
      {authenticated && (
        <button onClick={handleDisconnect}
          className="mt-2 text-[11px] w-full text-center transition-colors"
          style={{ color: 'var(--lumen-text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--lumen-text-muted)'; }}>
          Desconectar Google Calendar
        </button>
      )}

      {/* Create / edit modal */}
      {showForm && (
        <Modal
          title={editingEvent ? `Editar: ${editingEvent.summary}` : 'Nuevo evento'}
          onClose={() => { setShowForm(false); setEditingEvent(null); }}
          wide
        >
          <EventForm
            initial={editingEvent}
            onSave={handleSaveEvent}
            onCancel={() => { setShowForm(false); setEditingEvent(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
