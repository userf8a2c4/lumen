import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Loader2, MessageSquare, ChevronLeft } from 'lucide-react';

export default function LU({ open, onClose }) {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
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

  if (!open) return null;

  return (
    <aside
      style={{
        width: 300,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--lumen-border)',
        background: 'var(--lumen-surface)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--lumen-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={13} style={{ color: 'var(--lumen-text-muted)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lumen-text)', letterSpacing: '0.10em' }}>
            LU
          </span>
          <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)', letterSpacing: '0.06em' }}>
            ASISTENTE
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', padding: 4, display: 'flex', alignItems: 'center' }}
          title="Cerrar LU"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            opacity: 0.5,
            gap: 10,
          }}>
            <MessageSquare size={22} style={{ color: 'var(--lumen-text-muted)' }} />
            <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
              Hola, soy LU.<br />¿En qué puedo ayudarte?
            </p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              padding: '8px 10px',
              borderRadius: msg.role === 'user' ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
              background: msg.role === 'user'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'var(--lumen-text)',
              fontSize: 12,
              lineHeight: 1.5,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', color: 'var(--lumen-text-muted)', fontSize: 11, display: 'flex', gap: 6, alignItems: 'center' }}>
            <Loader2 size={11} className="animate-spin" /> Pensando...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--lumen-border)',
        display: 'flex',
        gap: 6,
        flexShrink: 0,
      }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Pregunta..."
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--lumen-border)',
            borderRadius: 6,
            padding: '7px 10px',
            fontSize: 12,
            color: 'var(--lumen-text)',
            outline: 'none',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          style={{
            background: input.trim() && !loading ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
            border: '1px solid var(--lumen-border)',
            borderRadius: 6,
            padding: '7px 10px',
            cursor: input.trim() && !loading ? 'pointer' : 'default',
            color: input.trim() && !loading ? 'var(--lumen-text)' : 'var(--lumen-text-muted)',
            display: 'flex',
            alignItems: 'center',
            transition: 'background 0.15s',
          }}
        >
          <Send size={12} />
        </button>
      </div>
    </aside>
  );
}
