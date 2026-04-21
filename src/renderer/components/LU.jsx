import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare, ChevronDown } from 'lucide-react';

export default function LU() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [history, setHistory]   = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const messagesEndRef           = useRef(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const geminiHistory = history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      }));
      const reply = await Promise.race([
        window.lumen.ai.chat(userMsg, geminiHistory),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado')), 30000)),
      ]);
      const text = typeof reply === 'string' ? reply : '(sin respuesta)';
      setMessages((prev) => [...prev, { role: 'model', text }]);
      setHistory((prev) => [
        ...prev,
        { role: 'user', text: userMsg },
        { role: 'model', text },
      ]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'model', text: `⚠ ${e?.message || 'Error al conectar con Gemini'}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 30,
      right: 20,
      width: 300,
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 0,
      overflow: 'hidden',
      border: '1px solid var(--lumen-border)',
      boxShadow: open ? '0 -8px 40px rgba(0,0,0,0.4), 0 2px 16px rgba(0,0,0,0.2)' : '0 -2px 12px rgba(0,0,0,0.2)',
      background: '#1a1a1f',
    }}>

      {/* Header / title bar — always visible at TOP, click to toggle */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          background: open ? '#1e1e24' : '#1a1a1f',
          borderBottom: open ? '1px solid var(--lumen-border)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={12} style={{ color: 'var(--lumen-accent)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--lumen-text)', letterSpacing: '0.10em' }}>LU</span>
          <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)', letterSpacing: '0.06em' }}>ASISTENTE</span>
          {messages.length > 0 && !open && (
            <span style={{
              fontSize: 9, fontWeight: 600,
              background: 'var(--lumen-accent)', color: '#fff',
              borderRadius: '9px', padding: '1px 6px',
              letterSpacing: '0.02em',
            }}>
              {messages.length}
            </span>
          )}
        </div>
        <ChevronDown
          size={13}
          style={{
            color: 'var(--lumen-text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </div>

      {/* Messages area — only when open */}
      {open && (
        <div style={{
          height: 340,
          overflowY: 'auto',
          padding: '10px 12px',
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
              gap: 10,
              opacity: 0.5,
            }}>
              <MessageSquare size={22} style={{ color: 'var(--lumen-text-muted)' }} />
              <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
                Hola, soy LU.<br />¿En qué puedo ayudarte?
              </p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              padding: '7px 10px',
              borderRadius: msg.role === 'user' ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
              background: msg.role === 'user' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              color: 'var(--lumen-text)',
              fontSize: 12,
              lineHeight: 1.5,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
            }}>
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
      )}

      {/* Input area — only when open */}
      {open && (
        <div style={{
          padding: '8px 10px',
          display: 'flex',
          gap: 6,
          borderTop: '1px solid var(--lumen-border)',
          background: '#1a1a1f',
        }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Pregunta..."
            autoFocus
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--lumen-border)',
              borderRadius: 6,
              padding: '6px 9px',
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
              padding: '6px 10px',
              cursor: input.trim() && !loading ? 'pointer' : 'default',
              color: input.trim() && !loading ? 'var(--lumen-text)' : 'var(--lumen-text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Send size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
