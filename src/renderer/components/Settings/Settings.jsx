import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Key, Cpu, Check, Eye, EyeOff,
  Mail, CalendarDays, Wifi, WifiOff, Palette, LogOut,
  RefreshCw, Info,
} from 'lucide-react';

const MODELS = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Rápido · Recomendado' },
  { id: 'gemini-2.5-pro',   label: 'Gemini 2.5 Pro',   desc: 'Máximo rendimiento' },
];

const ACCENT_PRESETS = ['#ffffff', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#ef4444', '#06b6d4'];

// ─── Row wrapper ──────────────────────────────────────────────────────────────
function Row({ label, icon: Icon, iconColor = 'var(--lumen-accent)', children, hint }) {
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '18px 0' }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={13} style={{ color: iconColor, flexShrink: 0 }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lumen-text-secondary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      {children}
      {hint && (
        <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', marginTop: 8, lineHeight: 1.5 }}>{hint}</p>
      )}
    </div>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export default function Settings({ onModelChange }) {
  const [apiKey,       setApiKey]       = useState('');
  const [apiKeyInput,  setApiKeyInput]  = useState('');
  const [showKey,      setShowKey]      = useState(false);
  const [model,        setModel]        = useState('gemini-2.0-flash');
  const [email,        setEmail]        = useState('');
  const [emailInput,   setEmailInput]   = useState('');
  const [accentColor,  setAccentColor]  = useState('#ffffff');
  const [calConnected, setCalConnected] = useState(false);
  const [calBusy,      setCalBusy]      = useState(false);
  const [version,      setVersion]      = useState('');
  const [checking,     setChecking]     = useState(false);
  const [saved,        setSaved]        = useState(''); // 'key' | 'email' | 'cal'

  const flash = (tag) => { setSaved(tag); setTimeout(() => setSaved(''), 2000); };

  useEffect(() => {
    Promise.all([
      window.lumen.settings.getApiKey(),
      window.lumen.settings.getModel(),
      window.lumen.settings.getUserEmail(),
      window.lumen.settings.getAccentColor(),
      window.lumen.app.getVersion(),
      window.lumen.calendar.isAuthenticated(),
    ]).then(([k, m, em, ac, v, conn]) => {
      setApiKey(k ? k.slice(0, 7) + '…' + k.slice(-4) : '');
      setModel(MODELS.find((x) => x.id === m) ? m : 'gemini-2.0-flash');
      setEmail(em || '');
      setEmailInput(em || '');
      if (ac) {
        setAccentColor(ac);
        document.documentElement.style.setProperty('--lumen-accent', ac);
      }
      setVersion(v || '');
      setCalConnected(conn);
    }).catch(() => {});
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const saveKey = async () => {
    if (!apiKeyInput.trim()) return;
    await window.lumen.settings.setApiKey(apiKeyInput.trim());
    setApiKey(apiKeyInput.slice(0, 7) + '…' + apiKeyInput.slice(-4));
    setApiKeyInput('');
    flash('key');
  };

  const saveEmail = async () => {
    const v = emailInput.trim();
    if (v === email) return;
    await window.lumen.settings.setUserEmail(v);
    setEmail(v);
    flash('email');
  };

  const saveModel = async (id) => {
    setModel(id);
    await window.lumen.settings.setModel(id);
    onModelChange?.(id);
  };

  const saveAccent = async (color) => {
    setAccentColor(color);
    document.documentElement.style.setProperty('--lumen-accent', color);
    await window.lumen.settings.setAccentColor(color).catch(() => {});
  };

  const connectCal = async () => {
    setCalBusy(true);
    try {
      await window.lumen.calendar.connect();
      setCalConnected(true);
      flash('cal');
    } catch (e) {
      alert(`Error al conectar Google Calendar:\n${e.message}`);
    } finally { setCalBusy(false); }
  };

  const disconnectCal = async () => {
    if (!confirm('¿Desconectar Google Calendar?')) return;
    await window.lumen.calendar.disconnect();
    setCalConnected(false);
  };

  const checkUpdate = async () => {
    setChecking(true);
    try { await window.lumen.updater.check(); }
    catch { /* handled by banner */ }
    finally { setTimeout(() => setChecking(false), 1500); }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 520 }}>

      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <SettingsIcon size={15} style={{ color: 'var(--lumen-accent)' }} />
        </div>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--lumen-text)', letterSpacing: '0.02em' }}>Configuración</h1>
          <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', marginTop: 1 }}>LUMEN v{version}</p>
        </div>
      </div>

      <div className="bento-card" style={{ padding: '0 20px' }}>

        {/* ── Correo ── */}
        <Row label="Tu correo" icon={Mail} iconColor="#4285F4"
          hint="Personaliza tu experiencia. Solo se guarda localmente.">
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveEmail()}
              onBlur={saveEmail}
              placeholder="tu.nombre@gmail.com"
              className="dark-input flex-1"
            />
            {saved === 'email' && (
              <span className="flex items-center gap-1 text-[11px]" style={{ color: '#10b981', paddingRight: 4 }}>
                <Check size={11} /> Guardado
              </span>
            )}
          </div>
        </Row>

        {/* ── API Key ── */}
        <Row label="Google AI — API Key" icon={Key}
          hint={<>Cifrada con DPAPI. Obtén tu key en <span style={{ color: 'var(--lumen-accent)' }}>aistudio.google.com</span></>}>
          {apiKey && (
            <div className="flex items-center gap-2 mb-2 px-3 py-1.5" style={{
              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', borderRadius: 6,
            }}>
              <Check size={10} style={{ color: '#10b981' }} />
              <code style={{ fontSize: 11, color: '#10b981', fontFamily: 'monospace' }}>{apiKey}</code>
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveKey()}
                placeholder="AIza…"
                className="dark-input !font-mono !pr-9"
                style={{ fontSize: 12 }}
              />
              <button onClick={() => setShowKey(!showKey)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                {showKey
                  ? <EyeOff size={12} style={{ color: 'var(--lumen-text-muted)' }} />
                  : <Eye size={12} style={{ color: 'var(--lumen-text-muted)' }} />}
              </button>
            </div>
            <button onClick={saveKey} disabled={!apiKeyInput.trim()} className="btn-accent !py-2 !px-4">
              {saved === 'key' ? <><Check size={11} /> OK</> : 'Guardar'}
            </button>
          </div>
        </Row>

        {/* ── Modelo ── */}
        <Row label="Motor Gemini" icon={Cpu}>
          <div className="flex gap-2">
            {MODELS.map((m) => {
              const active = model === m.id;
              return (
                <button key={m.id} onClick={() => saveModel(m.id)}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    background: active ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.07)'}`,
                    transition: 'all 0.15s',
                  }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: active ? 'var(--lumen-accent)' : 'var(--lumen-text)', marginBottom: 2 }}>
                    {m.label}
                  </p>
                  <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)' }}>{m.desc}</p>
                </button>
              );
            })}
          </div>
        </Row>

        {/* ── Google Calendar ── */}
        <Row label="Google Calendar" icon={CalendarDays} iconColor="#4285F4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {calConnected
                ? <><Wifi size={13} style={{ color: '#10b981' }} /><span style={{ fontSize: 12, color: '#10b981' }}>Conectado</span></>
                : <><WifiOff size={13} style={{ color: 'var(--lumen-text-muted)' }} /><span style={{ fontSize: 12, color: 'var(--lumen-text-muted)' }}>Sin conectar</span></>}
              {saved === 'cal' && (
                <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Check size={10} /> Listo
                </span>
              )}
            </div>
            {calConnected ? (
              <button onClick={disconnectCal}
                style={{
                  padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}>
                Desconectar
              </button>
            ) : (
              <button onClick={connectCal} disabled={calBusy} className="btn-accent">
                {calBusy
                  ? <><RefreshCw size={12} className="animate-spin" /> Conectando…</>
                  : <><Wifi size={12} /> Conectar con Google</>}
              </button>
            )}
          </div>
        </Row>

        {/* ── Color de acento ── */}
        <Row label="Color de acento" icon={Palette} iconColor={accentColor}>
          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              {ACCENT_PRESETS.map((c) => (
                <button key={c} onClick={() => saveAccent(c)}
                  style={{
                    width: 22, height: 22, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                    outline: accentColor === c ? `2px solid white` : '2px solid transparent',
                    outlineOffset: 2, transition: 'outline 0.15s, transform 0.15s',
                    transform: accentColor === c ? 'scale(1.2)' : 'scale(1)',
                  }} />
              ))}
            </div>
            <input type="color" value={accentColor} onChange={(e) => saveAccent(e.target.value)}
              style={{
                width: 28, height: 28, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
                background: 'none', cursor: 'pointer', padding: 2,
              }} />
            <button onClick={() => saveAccent('#ffffff')}
              style={{ fontSize: 11, color: 'var(--lumen-text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
              Reset
            </button>
          </div>
        </Row>

        {/* ── App info ── */}
        <Row label="Sistema" icon={Info}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span style={{ fontSize: 11, color: 'var(--lumen-text-muted)' }}>
                Version <code style={{ fontFamily: 'monospace', color: 'var(--lumen-text-secondary)' }}>v{version}</code>
              </span>
              <span style={{ fontSize: 11, color: 'var(--lumen-text-muted)' }}>
                Motor <span style={{ color: '#4285F4' }}>Google Gemini</span>
              </span>
            </div>
            <button onClick={checkUpdate} disabled={checking} className="btn-ghost !py-1.5 !px-3" style={{ fontSize: 11 }}>
              <RefreshCw size={11} className={checking ? 'animate-spin' : ''} />
              {checking ? 'Verificando…' : 'Actualizar'}
            </button>
          </div>
        </Row>

        {/* ── Salir ── */}
        <div style={{ padding: '16px 0' }}>
          <button onClick={() => window.lumen.app.quit()}
            className="flex items-center gap-2"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              fontSize: 12, color: 'var(--lumen-text-muted)', transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--lumen-text-muted)'; }}>
            <LogOut size={13} /> Salir de LUMEN
          </button>
        </div>

      </div>
    </div>
  );
}
