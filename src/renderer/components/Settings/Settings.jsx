import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Cpu, Info, RefreshCw, Check, Eye, EyeOff, Github, Mail } from 'lucide-react';
import LumenLogo from '../LumenLogo';

const GEMINI_MODELS = [
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', desc: 'Balanceado — recomendado' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', desc: 'Maximo rendimiento' },
];

function extractNameFromEmail(email) {
  if (!email || !email.trim()) return '';
  const local = email.split('@')[0];
  const first = local.split('.')[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export default function Settings({ onModelChange }) {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyDisplay, setApiKeyDisplay] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('gemini-1.5-flash');
  const [userEmail, setUserEmail] = useState('');
  const [userEmailInput, setUserEmailInput] = useState('');
  const [version, setVersion] = useState('');
  const [savedKey, setSavedKey] = useState(false);
  const [savedEmail, setSavedEmail] = useState(false);
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      window.lumen.settings.getApiKey(),
      window.lumen.settings.getModel(),
      window.lumen.app.getVersion(),
      window.lumen.settings.getUserEmail(),
    ]).then(([k, m, v, email]) => {
      setApiKeyDisplay(k || '');
      setModel(GEMINI_MODELS.find((x) => x.id === m) ? m : 'gemini-1.5-flash');
      setVersion(v);
      setUserEmail(email || '');
      setUserEmailInput(email || '');
    }).catch(() => {});
  }, []);

  const saveKey = async () => {
    if (!apiKey.trim()) return;
    await window.lumen.settings.setApiKey(apiKey.trim());
    setApiKeyDisplay(apiKey.slice(0, 7) + '...' + apiKey.slice(-4));
    setApiKey('');
    setSavedKey(true);
    setTimeout(() => setSavedKey(false), 2000);
  };

  const saveEmail = async () => {
    const val = userEmailInput.trim();
    await window.lumen.settings.setUserEmail(val);
    setUserEmail(val);
    setSavedEmail(true);
    setTimeout(() => setSavedEmail(false), 2000);
  };

  const saveModel = async (m) => {
    setModel(m);
    await window.lumen.settings.setModel(m);
    onModelChange?.(m);
  };

  const checkUpdate = async () => {
    setChecking(true);
    setMsg('');
    try {
      await window.lumen.updater.check();
      setMsg('Verificacion iniciada.');
    } catch {
      setMsg('No se pudo verificar.');
    } finally {
      setChecking(false);
    }
  };

  const greetingName = extractNameFromEmail(userEmail) || 'Usuario';

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="bento-card mb-4">
        <div className="module-header">
          <div className="module-icon" style={{ background: 'rgba(126,63,242,0.08)' }}>
            <SettingsIcon size={22} style={{ color: '#7E3FF2' }} />
          </div>
          <div>
            <h2>Configuracion</h2>
            <p>Motor Google Gemini — integracion nativa</p>
          </div>
        </div>
      </div>

      <div className="bento-grid bento-grid-2">
        {/* Google Account */}
        <div className="bento-card">
          <div className="flex items-center gap-2 mb-4">
            <Mail size={15} style={{ color: '#4285F4' }} />
            <h3 className="text-[13px] font-semibold" style={{ color: 'var(--lumen-text)' }}>Cuenta Google</h3>
          </div>

          {userEmail && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(66,133,244,0.06)', border: '1px solid rgba(66,133,244,0.15)' }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: 'rgba(66,133,244,0.12)', color: '#4285F4' }}>
                {greetingName.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: '#4285F4' }}>{greetingName}</p>
                <p className="text-[10px] font-mono" style={{ color: 'var(--lumen-text-muted)' }}>{userEmail}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="email"
              value={userEmailInput}
              onChange={(e) => setUserEmailInput(e.target.value)}
              placeholder="tu.correo@gmail.com"
              className="dark-input flex-1 !text-xs"
              onKeyDown={(e) => e.key === 'Enter' && saveEmail()}
            />
            <button onClick={saveEmail} disabled={userEmailInput === userEmail} className="btn-accent !py-2 !px-3 !text-xs">
              {savedEmail ? <><Check size={12} /> OK</> : 'Guardar'}
            </button>
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'var(--lumen-text-muted)' }}>
            Vincula tu cuenta Google para personalizar LUMEN.
          </p>
        </div>

        {/* Gemini API Key */}
        <div className="bento-card">
          <div className="flex items-center gap-2 mb-4">
            <Key size={15} style={{ color: '#7E3FF2' }} />
            <h3 className="text-[13px] font-semibold" style={{ color: 'var(--lumen-text)' }}>API Key de Google AI</h3>
          </div>

          {apiKeyDisplay && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
              style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <Check size={12} style={{ color: '#10b981' }} />
              <code className="text-xs font-mono" style={{ color: '#10b981' }}>{apiKeyDisplay}</code>
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="dark-input !text-xs !font-mono !pr-8"
                onKeyDown={(e) => e.key === 'Enter' && saveKey()}
              />
              <button onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded">
                {showKey
                  ? <EyeOff size={12} style={{ color: 'var(--lumen-text-muted)' }} />
                  : <Eye size={12} style={{ color: 'var(--lumen-text-muted)' }} />}
              </button>
            </div>
            <button onClick={saveKey} disabled={!apiKey.trim()} className="btn-accent !py-2 !px-3 !text-xs">
              {savedKey ? <><Check size={12} /> OK</> : 'Guardar'}
            </button>
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'var(--lumen-text-muted)' }}>
            Cifrada con DPAPI. Obtena tu key en{' '}
            <span style={{ color: '#7E3FF2' }}>aistudio.google.com</span>
          </p>
        </div>

        {/* Gemini Model */}
        <div className="bento-card bento-span-full">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={15} style={{ color: '#7E3FF2' }} />
            <h3 className="text-[13px] font-semibold" style={{ color: 'var(--lumen-text)' }}>Motor Gemini</h3>
            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: 'rgba(66,133,244,0.08)', color: '#4285F4' }}>
              Google AI
            </span>
          </div>
          <div className="bento-grid bento-grid-2 !gap-2">
            {GEMINI_MODELS.map((m) => (
              <label key={m.id}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all"
                style={{
                  background: model === m.id ? 'rgba(126,63,242,0.08)' : 'var(--lumen-surface)',
                  border: `1px solid ${model === m.id ? 'rgba(126,63,242,0.2)' : 'var(--lumen-border)'}`,
                }}>
                <input type="radio" name="model" value={m.id} checked={model === m.id}
                  onChange={() => saveModel(m.id)} className="sr-only" />
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ border: `2px solid ${model === m.id ? '#7E3FF2' : 'var(--lumen-text-muted)'}` }}>
                  {model === m.id && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#7E3FF2' }} />}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium" style={{ color: model === m.id ? '#7E3FF2' : 'var(--lumen-text)' }}>
                    {m.label}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--lumen-text-muted)' }}>{m.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* App info */}
        <div className="bento-card bento-span-full">
          <div className="flex items-center gap-2 mb-4">
            <Info size={15} style={{ color: '#7E3FF2' }} />
            <h3 className="text-[13px] font-semibold" style={{ color: 'var(--lumen-text)' }}>Informacion</h3>
          </div>

          <div className="bento-grid bento-grid-3 !gap-3">
            <div className="rounded-2xl p-3 flex items-center justify-between"
              style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
              <span className="text-xs" style={{ color: 'var(--lumen-text-muted)' }}>Version</span>
              <span className="text-xs font-mono font-medium" style={{ color: 'var(--lumen-text)' }}>v{version || '0.5.2'}</span>
            </div>
            <div className="rounded-2xl p-3 flex items-center justify-between"
              style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
              <span className="text-xs" style={{ color: 'var(--lumen-text-muted)' }}>Motor IA</span>
              <span className="text-xs font-medium" style={{ color: '#4285F4' }}>Google Gemini</span>
            </div>
            <div className="rounded-2xl p-3 flex items-center justify-between"
              style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
              <div className="flex items-center gap-1.5">
                <Github size={11} style={{ color: 'var(--lumen-text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--lumen-text-muted)' }}>Repo</span>
              </div>
              <span className="text-xs font-mono" style={{ color: '#7E3FF2' }}>userf8a2c4/lumen</span>
            </div>
          </div>

          <button onClick={checkUpdate} disabled={checking} className="btn-ghost w-full justify-center mt-4">
            <RefreshCw size={12} className={checking ? 'animate-spin' : ''} /> Buscar actualizaciones
          </button>
          {msg && (
            <p className="text-[10px] text-center mt-1.5" style={{ color: 'var(--lumen-text-muted)' }}>{msg}</p>
          )}
        </div>
      </div>
    </div>
  );
}
