import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, MessageSquare, ChevronDown, Check, X, Shield, AlertTriangle, Paperclip } from 'lucide-react';

const ADMIN_PREFIX = '/admin';

function isAdminCommand(text) {
  return text.trim().toLowerCase().startsWith(ADMIN_PREFIX);
}

function isAjusteCommand(text) {
  return /\bajuste\b/i.test(text) && !isAdminCommand(text);
}

function isAdminLike(text) {
  return isAdminCommand(text) || isAjusteCommand(text);
}

function stripAdminPrefix(text) {
  return text.trim().replace(/^\/admin\s*/i, '').trim();
}

export default function LU() {
  const [open, setOpen]             = useState(false);
  const [messages, setMessages]     = useState([]);
  const [history, setHistory]       = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [applying, setApplying]     = useState(false);
  const [attachment, setAttachment] = useState(null);
  const messagesEndRef               = useRef(null);
  const fileInputRef                 = useRef(null);

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target.result.split(',')[1];
      setAttachment({ name: file.name, mimeType: file.type || 'application/octet-stream', data });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    const pendingAttachment = attachment;
    setInput('');
    setAttachment(null);
    setMessages((prev) => [...prev, { role: 'user', text: userMsg, attachment: pendingAttachment ? pendingAttachment.name : null }]);
    setLoading(true);
    try {
      if (isAdminLike(userMsg)) {
        const instruction = isAdminCommand(userMsg) ? stripAdminPrefix(userMsg) : userMsg;
        if (!instruction || instruction === '/admin') {
          setMessages((prev) => [...prev, {
            role: 'model',
            text: 'Modo admin: dame una instrucción concreta. Ej: "/admin crea una rama Reembolsos" o escribe "AJUSTE agrega un paso de verificación de factura".',
          }]);
        } else {
          const proposal = await Promise.race([
            window.lumen.ai.adminEdit(instruction),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado')), 45000)),
          ]);
          setMessages((prev) => [...prev, { role: 'admin', proposal }]);
        }
      } else {
        const geminiHistory = history.map((h) => ({ role: h.role, parts: [{ text: h.text }] }));
        const reply = await Promise.race([
          window.lumen.ai.chat(userMsg, geminiHistory, pendingAttachment ? [pendingAttachment] : undefined),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado')), 30000)),
        ]);
        const text = typeof reply === 'string' ? reply : '(sin respuesta)';
        setMessages((prev) => [...prev, { role: 'model', text }]);
        setHistory((prev) => [
          ...prev,
          { role: 'user', text: userMsg },
          { role: 'model', text },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: 'model', text: `⚠ ${e?.message || 'Error al conectar con Gemini'}` }]);
    } finally {
      setLoading(false);
    }
  };

  const applyProposal = async (idx, proposal) => {
    if (applying) return;
    setApplying(true);
    try {
      let result;
      if (proposal.intent === 'CREATE_BRANCH') {
        result = await window.lumen.ac3.branches.create(proposal.branch);
      } else if (proposal.intent === 'UPDATE_BRANCH') {
        result = await window.lumen.ac3.branches.update(proposal.branchId, proposal.branch);
      } else if (proposal.intent === 'DELETE_BRANCH') {
        await window.lumen.ac3.branches.delete(proposal.branchId);
        result = { deleted: true };
      } else {
        throw new Error('Intent no soportado');
      }
      setMessages((prev) => prev.map((m, i) =>
        i === idx ? { ...m, applied: true, applyError: null } : m
      ));
      const branchId = proposal.intent === 'UPDATE_BRANCH' ? proposal.branchId
        : proposal.intent === 'DELETE_BRANCH' ? proposal.branchId
        : result?.id;
      if (branchId) window.dispatchEvent(new CustomEvent('lumen:branch-updated', { detail: { id: branchId } }));
    } catch (e) {
      setMessages((prev) => prev.map((m, i) =>
        i === idx ? { ...m, applyError: e?.message || 'Error al aplicar' } : m
      ));
    } finally {
      setApplying(false);
    }
  };

  const discardProposal = (idx) => {
    setMessages((prev) => prev.map((m, i) =>
      i === idx ? { ...m, discarded: true } : m
    ));
  };

  const renderAdminMessage = (msg, idx) => {
    const p = msg.proposal || {};
    const isNone = p.intent === 'NONE' || !p.intent;
    const intentLabel = {
      CREATE_BRANCH: 'CREAR RAMA',
      UPDATE_BRANCH: 'ACTUALIZAR RAMA',
      DELETE_BRANCH: 'ELIMINAR RAMA',
      NONE:          'SIN ACCIÓN',
    }[p.intent] || 'PROPUESTA';

    return (
      <div key={idx} style={{
        alignSelf: 'flex-start',
        maxWidth: '95%',
        border: '1px solid var(--lumen-accent-secondary)',
        borderRadius: 6,
        padding: 10,
        background: 'rgba(126,63,242,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
          <Shield size={11} style={{ color: 'var(--lumen-accent-secondary)' }} />
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--lumen-accent-secondary)' }}>
            ADMIN — {intentLabel}
          </span>
        </div>

        {p.summary && (
          <p style={{ fontSize: 11, color: 'var(--lumen-text)', lineHeight: 1.5, marginBottom: 6 }}>
            {p.summary}
          </p>
        )}

        {isNone && p.explanation && (
          <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', lineHeight: 1.5, fontStyle: 'italic' }}>
            {p.explanation}
          </p>
        )}

        {!isNone && p.branch && (
          <div style={{
            marginTop: 6, padding: 8,
            background: 'rgba(0,0,0,0.25)',
            borderLeft: `3px solid ${p.branch.color || '#7E3FF2'}`,
            borderRadius: 3,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: p.branch.color || '#7E3FF2', marginBottom: 4 }}>
              {p.branch.name}
            </p>
            {p.branch.description && (
              <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', marginBottom: 6, lineHeight: 1.4 }}>
                {p.branch.description}
              </p>
            )}
            {Array.isArray(p.branch.nodes) && p.branch.nodes.map((n, i) => (
              <div key={n.id || i} style={{ marginTop: 6, paddingLeft: 8, borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--lumen-text)', marginBottom: 2 }}>
                  <span style={{ fontFamily: 'monospace', color: p.branch.color || '#7E3FF2', marginRight: 5 }}>{n.id}</span>
                  {n.question || n.title || '(sin pregunta)'}
                </p>
                {n.instructions && (
                  <p style={{ fontSize: 9, color: '#60a5fa', lineHeight: 1.4, marginBottom: 2, fontStyle: 'italic' }}>
                    ↳ {n.instructions}
                  </p>
                )}
                {n.speech && (
                  <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', lineHeight: 1.4, marginBottom: 2 }}>
                    "{n.speech.slice(0, 80)}{n.speech.length > 80 ? '…' : ''}"
                  </p>
                )}
                {Array.isArray(n.options) && n.options.length > 0 && (
                  <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', opacity: 0.7 }}>
                    {n.options.map((o) => o.label).join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {msg.applied && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, color: '#10b981', fontSize: 10 }}>
            <Check size={11} /> Aplicado
          </div>
        )}
        {msg.applyError && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'flex-start', gap: 5, color: '#f87171', fontSize: 10, lineHeight: 1.4 }}>
            <AlertTriangle size={11} style={{ flexShrink: 0, marginTop: 1 }} /> {msg.applyError}
          </div>
        )}
        {msg.discarded && (
          <div style={{ marginTop: 8, color: 'var(--lumen-text-muted)', fontSize: 10 }}>
            Descartado
          </div>
        )}

        {!isNone && !msg.applied && !msg.discarded && (
          <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
            <button
              onClick={() => applyProposal(idx, p)}
              disabled={applying}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '6px 10px', fontSize: 11, fontWeight: 600,
                background: 'rgba(16,185,129,0.12)', color: '#10b981',
                border: '1px solid rgba(16,185,129,0.4)', borderRadius: 4,
                cursor: applying ? 'wait' : 'pointer',
              }}
            >
              {applying ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />} Aplicar
            </button>
            <button
              onClick={() => discardProposal(idx)}
              disabled={applying}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '6px 10px', fontSize: 11,
                background: 'transparent', color: 'var(--lumen-text-muted)',
                border: '1px solid var(--lumen-border)', borderRadius: 4,
                cursor: applying ? 'wait' : 'pointer',
              }}
            >
              <X size={11} /> Descartar
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 30,
      right: 20,
      width: 320,
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 0,
      overflow: 'hidden',
      border: '1px solid var(--lumen-border)',
      boxShadow: open ? '0 -8px 40px rgba(0,0,0,0.4), 0 2px 16px rgba(0,0,0,0.2)' : '0 -2px 12px rgba(0,0,0,0.2)',
      background: '#1a1a1f',
    }}>

      {/* Header / title bar */}
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
            transform: open ? 'rotate(0deg)' : 'rotate(180deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </div>

      {/* Messages area */}
      {open && (
        <div style={{
          height: 360,
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
              <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', textAlign: 'center', lineHeight: 1.5, marginTop: 2, opacity: 0.7 }}>
                Tip: usa <code style={{ fontFamily: 'monospace', color: 'var(--lumen-accent-secondary)' }}>/admin</code> o escribe <code style={{ fontFamily: 'monospace', color: 'var(--lumen-accent-secondary)' }}>AJUSTE</code> para editar el árbol AC3
              </p>
            </div>
          )}
          {messages.map((msg, idx) => {
            if (msg.role === 'admin') return renderAdminMessage(msg, idx);
            return (
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
                {msg.attachment && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, fontSize: 10, color: 'var(--lumen-text-muted)', opacity: 0.8 }}>
                    <Paperclip size={9} /> {msg.attachment}
                  </div>
                )}
                {msg.text}
              </div>
            );
          })}
          {loading && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--lumen-text-muted)', fontSize: 11, display: 'flex', gap: 6, alignItems: 'center' }}>
              <Loader2 size={11} className="animate-spin" /> Pensando...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input area */}
      {open && (
        <div style={{ borderTop: '1px solid var(--lumen-border)', background: '#1a1a1f' }}>
          {attachment && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 0' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--lumen-border)',
                borderRadius: 4, padding: '3px 7px',
                fontSize: 10, color: 'var(--lumen-text-muted)',
                maxWidth: 220, overflow: 'hidden',
              }}>
                <Paperclip size={9} style={{ flexShrink: 0, color: 'var(--lumen-accent)' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {attachment.name}
                </span>
                <button
                  onClick={() => setAttachment(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--lumen-text-muted)', padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center' }}
                >
                  <X size={9} />
                </button>
              </div>
            </div>
          )}

          <div style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.txt,.md"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Adjuntar archivo"
              style={{
                background: attachment ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${attachment ? 'var(--lumen-accent)' : 'var(--lumen-border)'}`,
                borderRadius: 6, padding: '6px 8px', cursor: 'pointer',
                color: attachment ? 'var(--lumen-accent)' : 'var(--lumen-text-muted)',
                display: 'flex', alignItems: 'center', flexShrink: 0,
              }}
            >
              <Paperclip size={12} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={isAdminLike(input) ? 'Modo admin: describe el cambio…' : 'Pregunta… o escribe AJUSTE para editar AC3'}
              autoFocus
              style={{
                flex: 1,
                background: isAdminLike(input) ? 'rgba(126,63,242,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isAdminLike(input) ? 'var(--lumen-accent-secondary)' : 'var(--lumen-border)'}`,
                borderRadius: 6, padding: '6px 9px', fontSize: 12,
                color: 'var(--lumen-text)', outline: 'none',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                background: input.trim() && !loading ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                border: '1px solid var(--lumen-border)',
                borderRadius: 6, padding: '6px 10px',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                color: input.trim() && !loading ? 'var(--lumen-text)' : 'var(--lumen-text-muted)',
                display: 'flex', alignItems: 'center',
              }}
            >
              <Send size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
