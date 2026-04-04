import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Cpu, Info, RefreshCw, Check, Eye, EyeOff, Github } from 'lucide-react';

const MODELS = [
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Recomendado)' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (Rapido)' },
  { id: 'claude-opus-4-6', label: 'Claude Opus 4.6 (Avanzado)' },
];

export default function Settings({ onModelChange }) {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyDisplay, setApiKeyDisplay] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [model, setModel] = useState('claude-sonnet-4-20250514');
  const [version, setVersion] = useState('');
  const [saved, setSaved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      window.lumen.settings.getApiKey(),
      window.lumen.settings.getModel(),
      window.lumen.app.getVersion(),
    ]).then(([k, m, v]) => { setApiKeyDisplay(k || ''); setModel(m); setVersion(v); }).catch(() => {});
  }, []);

  const saveKey = async () => {
    if (!apiKey.trim()) return;
    await window.lumen.settings.setApiKey(apiKey.trim());
    setApiKeyDisplay(apiKey.slice(0, 7) + '...' + apiKey.slice(-4));
    setApiKey(''); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const saveModel = async (m) => {
    setModel(m);
    await window.lumen.settings.setModel(m);
    onModelChange?.(m);
  };

  const checkUpdate = async () => {
    setChecking(true); setMsg('');
    try { await window.lumen.updater.check(); setMsg('Verificacion iniciada.'); }
    catch { setMsg('No se pudo verificar.'); }
    finally { setChecking(false); }
  };

  return (
    <div className="max-w-3xl">
      <div className="dark-card p-5 mb-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(126,63,242,0.1)' }}>
          <SettingsIcon size={20} style={{ color: '#7E3FF2' }} />
        </div>
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--lumen-text)' }}>Configuracion</h2>
          <p className="text-xs" style={{ color: 'var(--lumen-text-muted)' }}>Administra tu API Key y preferencias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* API Key */}
        <div className="dark-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Key size={16} style={{ color: '#7E3FF2' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--lumen-text)' }}>API Key de Anthropic</h3>
          </div>

          {apiKeyDisplay && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Check size={12} style={{ color: '#10b981' }} />
              <code className="text-xs font-mono" style={{ color: '#10b981' }}>{apiKeyDisplay}</code>
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-api..." className="dark-input !text-xs !font-mono !pr-8" />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded">
                {showKey ? <EyeOff size={12} style={{ color: 'var(--lumen-text-muted)' }} /> : <Eye size={12} style={{ color: 'var(--lumen-text-muted)' }} />}
              </button>
            </div>
            <button onClick={saveKey} disabled={!apiKey.trim()} className="btn-accent !py-2 !px-3 !text-xs">
              {saved ? <><Check size={12} /> OK</> : 'Guardar'}
            </button>
          </div>
          <p className="text-[11px] mt-2" style={{ color: 'var(--lumen-text-muted)' }}>Cifrada con DPAPI del sistema operativo.</p>
        </div>

        {/* Model */}
        <div className="dark-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={16} style={{ color: '#7E3FF2' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--lumen-text)' }}>Modelo de Claude</h3>
          </div>
          <div className="space-y-2">
            {MODELS.map((m) => (
              <label key={m.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all text-sm"
                style={{
                  background: model === m.id ? 'rgba(126,63,242,0.1)' : 'transparent',
                  border: `1px solid ${model === m.id ? 'rgba(126,63,242,0.2)' : 'transparent'}`,
                  color: model === m.id ? '#7E3FF2' : 'var(--lumen-text-secondary)',
                }}>
                <input type="radio" name="model" value={m.id} checked={model === m.id} onChange={() => saveModel(m.id)} className="sr-only" />
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ border: `2px solid ${model === m.id ? '#7E3FF2' : 'var(--lumen-text-muted)'}` }}>
                  {model === m.id && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#7E3FF2' }} />}
                </div>
                <div>
                  <span className="text-[13px] font-medium">{m.label}</span>
                  <p className="text-[10px] font-mono" style={{ color: 'var(--lumen-text-muted)' }}>{m.id}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* App info */}
        <div className="dark-card p-5 md:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} style={{ color: '#7E3FF2' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--lumen-text)' }}>Informacion</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 flex justify-between" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
              <span className="text-xs" style={{ color: 'var(--lumen-text-muted)' }}>Version</span>
              <span className="text-xs font-mono" style={{ color: 'var(--lumen-text)' }}>v{version || '1.0.0'}</span>
            </div>
            <div className="rounded-xl p-3 flex justify-between" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
              <span className="text-xs" style={{ color: 'var(--lumen-text-muted)' }}>Plataforma</span>
              <span className="text-xs" style={{ color: 'var(--lumen-text)' }}>Windows</span>
            </div>
            <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: 'var(--lumen-surface)', border: '1px solid var(--lumen-border)' }}>
              <div className="flex items-center gap-1.5">
                <Github size={12} style={{ color: 'var(--lumen-text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--lumen-text-muted)' }}>Repositorio</span>
              </div>
              <span className="text-xs font-mono" style={{ color: '#7E3FF2' }}>userf8a2c4/lumen</span>
            </div>
          </div>
          <button onClick={checkUpdate} disabled={checking} className="btn-ghost w-full justify-center mt-3">
            <RefreshCw size={12} className={checking ? 'animate-spin' : ''} /> Buscar actualizaciones
          </button>
          {msg && <p className="text-[10px] text-center mt-1" style={{ color: 'var(--lumen-text-muted)' }}>{msg}</p>}
        </div>
      </div>
    </div>
  );
}
