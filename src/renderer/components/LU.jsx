import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, MessageSquare, ChevronDown, Plus, Paperclip, X, FileText, Image } from 'lucide-react';

// ── Allowed MIME types for Gemini multimodal ──
const ALLOWED_MIME = [
  'image/png','image/jpeg','image/gif','image/webp',
  'application/pdf',
  'video/mp4','video/mpeg','video/quicktime',
  'audio/mp3','audio/mpeg','audio/wav','audio/ogg',
];

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(',')[1]); // strip data:...;base64,
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ── Session persistence helpers (localStorage) ─────────── */
const STORAGE_KEY = 'lumen_lu_history';

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveSessions(sessions) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); } catch {}
}

function archiveSession(messages) {
  if (!messages || messages.length === 0) return;
  const sessions = loadSessions();
  sessions.unshift({
    id: `session_${Date.now()}`,
    startedAt: new Date().toISOString(),
    messages: messages.map((m) => ({ ...m, ts: new Date().toISOString() })),
  });
  // Keep max 50 sessions
  saveSessions(sessions.slice(0, 50));
}

// Alto contraste blindado — ignora colores de personalización del usuario.
// Garantiza legibilidad independientemente del esquema elegido.
const CHAT_DARK = {
  shell:      '#0d0d11',
  header:     '#111116',
  headerOpen: '#141419',
  messages:   '#0d0d11',
  input:      '#111116',
  border:     'rgba(255,255,255,0.09)',
  text:       '#f0f0f5',
  textMuted:  '#8888a0',
  accent:     '#7c6af7',
  userBubble: 'rgba(124,106,247,0.18)',
  userBorder: 'rgba(124,106,247,0.28)',
  userText:   '#e8e4ff',
  botBubble:  'rgba(255,255,255,0.05)',
  botBorder:  'rgba(255,255,255,0.08)',
  botText:    '#ececf1',
};

const CHAT_LIGHT = {
  shell:      '#ffffff',
  header:     '#f8f8fc',
  headerOpen: '#f2f2f8',
  messages:   '#ffffff',
  input:      '#f8f8fc',
  border:     'rgba(0,0,0,0.10)',
  text:       '#1a1a2e',
  textMuted:  '#6060808',
  accent:     '#4f3dc8',
  userBubble: 'rgba(79,61,200,0.10)',
  userBorder: 'rgba(79,61,200,0.20)',
  userText:   '#1a1a2e',
  botBubble:  'rgba(0,0,0,0.04)',
  botBorder:  'rgba(0,0,0,0.08)',
  botText:    '#1a1a2e',
};

function useChatTheme() {
  const isDark = () => !document.documentElement.classList.contains('light-theme');
  const [t, setT] = useState(isDark() ? CHAT_DARK : CHAT_LIGHT);

  useEffect(() => {
    const obs = new MutationObserver(() => {
      setT(isDark() ? CHAT_DARK : CHAT_LIGHT);
    });
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  return t;
}

export default function LU({ activeCaseId }) {
  const [open, setOpen]             = useState(false);
  const [messages, setMessages]     = useState([]);
  const [history, setHistory]       = useState([]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [pendingFile, setPendingFile] = useState(null); // { name, mimeType, base64, isImage, preview }
  const [dragOver, setDragOver]     = useState(false);
  const messagesEndRef               = useRef(null);
  const fileInputRef                 = useRef(null);
  const ct                           = useChatTheme();
  const activeCaseIdRef              = useRef(activeCaseId);
  activeCaseIdRef.current            = activeCaseId;

  useEffect(() => {
    if (open) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  // Sync messages to case-specific localStorage whenever they change
  useEffect(() => {
    if (activeCaseId && messages.length > 0) {
      try {
        localStorage.setItem(
          `lumen_case_chat_${activeCaseId}`,
          JSON.stringify(messages.map((m) => ({ ...m, ts: new Date().toISOString() })))
        );
      } catch {}
    }
  }, [messages, activeCaseId]);

  const newChat = useCallback(() => {
    archiveSession(messages);
    setMessages([]);
    setHistory([]);
    setInput('');
  }, [messages]);

  const attachFile = useCallback(async (file) => {
    if (!file) return;
    if (!ALLOWED_MIME.includes(file.type)) {
      alert(`Tipo de archivo no soportado: ${file.type || 'desconocido'}`);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert('El archivo es demasiado grande (máximo 20 MB).');
      return;
    }
    try {
      const base64 = await readFileAsBase64(file);
      const isImage = file.type.startsWith('image/');
      setPendingFile({
        name: file.name,
        mimeType: file.type,
        base64,
        isImage,
        preview: isImage ? `data:${file.type};base64,${base64}` : null,
      });
    } catch {}
  }, []);

  const sendMessage = async () => {
    if ((!input.trim() && !pendingFile) || loading) return;
    const userMsg  = input.trim() || (pendingFile ? '(archivo adjunto)' : '');
    const fileSnap = pendingFile;
    setInput('');
    setPendingFile(null);

    const displayText = fileSnap
      ? `${userMsg !== '(archivo adjunto)' ? userMsg + '\n' : ''}📎 ${fileSnap.name}`
      : userMsg;
    setMessages((prev) => [...prev, { role: 'user', text: displayText }]);
    setLoading(true);

    try {
      const geminiHistory = history.map((h) => ({
        role: h.role,
        parts: [{ text: h.text }],
      }));
      const fileData = fileSnap
        ? { name: fileSnap.name, mimeType: fileSnap.mimeType, base64: fileSnap.base64 }
        : null;

      const reply = await Promise.race([
        window.lumen.ai.chat(userMsg, geminiHistory, fileData),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Tiempo de espera agotado')), 60000)),
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
      width: 310,
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 0,
      overflow: 'hidden',
      border: `1px solid ${ct.border}`,
      boxShadow: open
        ? '0 -8px 40px rgba(0,0,0,0.35), 0 2px 16px rgba(0,0,0,0.2)'
        : '0 -2px 12px rgba(0,0,0,0.2)',
      background: ct.shell,
    }}>

      {/* Header — always visible */}
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          background: open ? ct.headerOpen : ct.header,
          borderBottom: open ? `1px solid ${ct.border}` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={12} style={{ color: ct.accent }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: ct.text, letterSpacing: '0.10em' }}>LU</span>
          <span style={{ fontSize: 9, color: ct.textMuted, letterSpacing: '0.06em' }}>ASISTENTE</span>
          {messages.length > 0 && !open && (
            <span style={{
              fontSize: 9, fontWeight: 600,
              background: ct.accent, color: '#fff',
              borderRadius: 9, padding: '1px 6px',
              letterSpacing: '0.02em',
            }}>
              {messages.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Nuevo chat — only show when there are messages */}
          {messages.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); newChat(); }}
              title="Nuevo chat"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '3px 5px', borderRadius: 4, display: 'flex', alignItems: 'center',
                color: ct.textMuted, transition: 'color 0.12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = ct.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = ct.textMuted; }}
            >
              <Plus size={13} />
            </button>
          )}
          <ChevronDown
            size={13}
            style={{
              color: ct.textMuted,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </div>
      </div>

      {/* Messages area — drop zone */}
      {open && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) attachFile(file);
          }}
          style={{
            height: 340,
            overflowY: 'auto',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            background: ct.messages,
            outline: dragOver ? `2px dashed ${ct.accent}` : 'none',
            outlineOffset: -2,
            transition: 'outline 0.15s',
          }}
        >
          {messages.length === 0 && (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 10, opacity: 0.55,
            }}>
              <MessageSquare size={22} style={{ color: ct.textMuted }} />
              <p style={{ fontSize: 11, color: ct.textMuted, textAlign: 'center', lineHeight: 1.55 }}>
                Hola, soy LU.<br />¿En qué puedo ayudarte?
              </p>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              padding: '8px 11px',
              borderRadius: msg.role === 'user' ? '10px 10px 3px 10px' : '10px 10px 10px 3px',
              background: msg.role === 'user' ? ct.userBubble : ct.botBubble,
              border: `1px solid ${msg.role === 'user' ? ct.userBorder : ct.botBorder}`,
              color: msg.role === 'user' ? ct.userText : ct.botText,
              fontSize: 12.5,
              lineHeight: 1.55,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              fontWeight: 400,
            }}>
              {msg.text}
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: 'flex-start', color: ct.textMuted, fontSize: 11, display: 'flex', gap: 6, alignItems: 'center' }}>
              <Loader2 size={11} className="animate-spin" style={{ color: ct.accent }} /> Pensando...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input area */}
      {open && (
        <div style={{ borderTop: `1px solid ${ct.border}`, background: ct.input }}>

          {/* File preview strip */}
          {pendingFile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px', borderBottom: `1px solid ${ct.border}`,
              background: `${ct.accent}10`,
            }}>
              {pendingFile.isImage ? (
                <img src={pendingFile.preview} alt={pendingFile.name}
                  style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4, border: `1px solid ${ct.border}` }} />
              ) : (
                <div style={{ width: 32, height: 32, borderRadius: 4, background: `${ct.accent}20`, border: `1px solid ${ct.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={14} style={{ color: ct.accent }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: ct.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pendingFile.name}</p>
                <p style={{ fontSize: 9, color: ct.textMuted, margin: 0 }}>{pendingFile.mimeType}</p>
              </div>
              <button
                onClick={() => setPendingFile(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: ct.textMuted, padding: 2, display: 'flex' }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Drag hint when no file */}
          {dragOver && !pendingFile && (
            <div style={{ padding: '4px 10px', fontSize: 10, color: ct.accent, textAlign: 'center' }}>
              Suelta el archivo aquí
            </div>
          )}

          {/* Input row */}
          <div style={{ padding: '8px 10px', display: 'flex', gap: 6 }}>
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_MIME.join(',')}
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) attachFile(f); e.target.value = ''; }}
            />
            {/* Attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Adjuntar archivo"
              style={{
                background: pendingFile ? `${ct.accent}20` : 'rgba(128,128,128,0.08)',
                border: `1px solid ${pendingFile ? ct.accent + '55' : ct.border}`,
                borderRadius: 6, padding: '6px 9px', cursor: 'pointer',
                color: pendingFile ? ct.accent : ct.textMuted,
                display: 'flex', alignItems: 'center', transition: 'all 0.15s',
              }}
            >
              <Paperclip size={12} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={pendingFile ? 'Pregunta sobre el archivo… (opcional)' : 'Escribe a LU...'}
              autoFocus
              style={{
                flex: 1,
                background: 'rgba(128,128,128,0.08)',
                border: `1px solid ${ct.border}`,
                borderRadius: 6,
                padding: '7px 10px',
                fontSize: 12,
                color: ct.text,
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={(!input.trim() && !pendingFile) || loading}
              style={{
                background: (input.trim() || pendingFile) && !loading ? ct.accent : 'rgba(128,128,128,0.08)',
                border: `1px solid ${ct.border}`,
                borderRadius: 6,
                padding: '6px 11px',
                cursor: (input.trim() || pendingFile) && !loading ? 'pointer' : 'default',
                color: (input.trim() || pendingFile) && !loading ? '#fff' : ct.textMuted,
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s',
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
