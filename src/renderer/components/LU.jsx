import React, { useState, useRef, useEffect } from 'react';
import { ChevronUp, Send, Calendar, MessageSquare, X, Loader2 } from 'lucide-react';

const LU_WIDTH = 320;
const LU_COLLAPSED_HEIGHT = 40;
const LU_EXPANDED_HEIGHT = 500;

export default function LU() {
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState('chat'); // 'chat' or 'calendar'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (expanded && tab === 'calendar') {
      loadCalendarEvents();
    }
  }, [expanded, tab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadCalendarEvents = async () => {
    setCalendarLoading(true);
    try {
      const events = await window.lumen.calendar.getEvents(7);
      setCalendarEvents(events || []);
    } catch (e) {
      console.error('Error loading calendar:', e);
    } finally {
      setCalendarLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await window.lumen.ai.analyze(userMsg, { model: 'gemini-2.0-flash' });
      setMessages((prev) => [...prev, { role: 'assistant', text: response }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'assistant', text: `Error: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: LU_WIDTH,
        height: expanded ? LU_EXPANDED_HEIGHT : LU_COLLAPSED_HEIGHT,
        background: 'rgba(0,0,0,0.85)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '10px 14px',
          borderBottom: expanded ? '1px solid rgba(255,255,255,0.05)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.08em' }}>
          LU
        </span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {expanded && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--lumen-text-muted)',
                padding: 4,
              }}
            >
              <X size={12} />
            </button>
          )}
          <ChevronUp
            size={12}
            style={{
              color: 'var(--lumen-text-muted)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <>
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(255,255,255,0.01)',
            }}
          >
            <button
              onClick={() => setTab('chat')}
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'none',
                border: 'none',
                borderBottom: tab === 'chat' ? '2px solid rgba(255,255,255,0.9)' : 'none',
                color: tab === 'chat' ? 'rgba(255,255,255,0.9)' : 'var(--lumen-text-muted)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <MessageSquare size={10} /> Chat
            </button>
            <button
              onClick={() => setTab('calendar')}
              style={{
                flex: 1,
                padding: '8px 0',
                background: 'none',
                border: 'none',
                borderBottom: tab === 'calendar' ? '2px solid rgba(255,255,255,0.9)' : 'none',
                color: tab === 'calendar' ? 'rgba(255,255,255,0.9)' : 'var(--lumen-text-muted)',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
              }}
            >
              <Calendar size={10} /> Cal
            </button>
          </div>

          {/* Chat Tab */}
          {tab === 'chat' && (
            <>
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                {messages.length === 0 && (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--lumen-text-muted)',
                      fontSize: 11,
                      textAlign: 'center',
                      padding: 12,
                    }}
                  >
                    Hola, soy LU. ¿En qué puedo ayudarte?
                  </div>
                )}
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      background:
                        msg.role === 'user'
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(255,255,255,0.05)',
                      color: 'var(--lumen-text)',
                      fontSize: 11,
                      lineHeight: 1.4,
                      wordWrap: 'break-word',
                    }}
                  >
                    {msg.text}
                  </div>
                ))}
                {loading && (
                  <div
                    style={{
                      alignSelf: 'flex-start',
                      color: 'var(--lumen-text-muted)',
                      fontSize: 11,
                      display: 'flex',
                      gap: 4,
                      alignItems: 'center',
                    }}
                  >
                    <Loader2 size={10} className="animate-spin" /> Pensando...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  padding: '10px 12px',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                  background: 'rgba(255,255,255,0.01)',
                }}
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Pregunta..."
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 4,
                    padding: '6px 8px',
                    fontSize: 11,
                    color: 'var(--lumen-text)',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || loading}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: 4,
                    padding: '6px 8px',
                    cursor: input.trim() && !loading ? 'pointer' : 'default',
                    opacity: input.trim() && !loading ? 1 : 0.5,
                    color: 'var(--lumen-text)',
                  }}
                >
                  <Send size={11} />
                </button>
              </div>
            </>
          )}

          {/* Calendar Tab */}
          {tab === 'calendar' && (
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {calendarLoading ? (
                <div style={{ textAlign: 'center', color: 'var(--lumen-text-muted)', fontSize: 11, padding: 20 }}>
                  <Loader2 className="animate-spin" style={{ margin: '0 auto', marginBottom: 8 }} size={14} />
                  Cargando...
                </div>
              ) : calendarEvents.length === 0 ? (
                <div style={{ color: 'var(--lumen-text-muted)', fontSize: 11, textAlign: 'center', padding: 20 }}>
                  Sin eventos próximos
                </div>
              ) : (
                calendarEvents.slice(0, 5).map((event, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: 4,
                      borderLeft: '2px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--lumen-text)', margin: '0 0 2px 0' }}>
                      {event.summary}
                    </p>
                    <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', margin: 0 }}>
                      {new Date(event.start?.dateTime || event.start?.date).toLocaleString('es-ES', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
