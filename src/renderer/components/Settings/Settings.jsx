import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Cpu, Info, RefreshCw, Check, Eye, EyeOff, Bug, Github } from 'lucide-react';

const MODELS = [
  { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4 (Recomendado)' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (Rápido)' },
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
  const [reportDesc, setReportDesc] = useState('');

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
    try { await window.lumen.updater.check(); setMsg('Verificación iniciada.'); }
    catch { setMsg('No se pudo verificar.'); }
    finally { setChecking(false); }
  };

  const handleReport = async () => {
    if (!reportDesc.trim()) return;
    await window.lumen.updater.reportError(reportDesc.trim());
    setReportDesc('');
  };

  return (
    <div className="max-w-3xl">
      <div className="dark-card p-5 mb-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-lumen-accent/10 flex items-center justify-center">
          <SettingsIcon size={20} className="text-lumen-accent" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-lumen-text">Configuración</h2>
          <p className="text-xs text-lumen-text-muted">Administra tu API Key y preferencias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* API Key */}
        <div className="dark-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Key size={16} className="text-lumen-accent" />
            <h3 className="text-sm font-semibold text-lumen-text">API Key de Anthropic</h3>
          </div>

          {apiKeyDisplay && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Check size={12} className="text-emerald-400" />
              <code className="text-xs text-emerald-400 font-mono">{apiKeyDisplay}</code>
            </div>
          )}

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-api..."
                className="dark-input !text-xs !font-mono !pr-8" />
              <button onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-lumen-card-hover rounded">
                {showKey ? <EyeOff size={12} className="text-lumen-text-muted" /> : <Eye size={12} className="text-lumen-text-muted" />}
              </button>
            </div>
            <button onClick={saveKey} disabled={!apiKey.trim()} className="btn-accent !py-2 !px-3 !text-xs">
              {saved ? <><Check size={12} /> OK</> : 'Guardar'}
            </button>
          </div>
          <p className="text-[11px] text-lumen-text-muted mt-2">Cifrada con DPAPI del sistema operativo.</p>
        </div>

        {/* Model */}
        <div className="dark-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu size={16} className="text-lumen-accent" />
            <h3 className="text-sm font-semibold text-lumen-text">Modelo de Claude</h3>
          </div>
          <div className="space-y-2">
            {MODELS.map((m) => (
              <label key={m.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all border text-sm
                  ${model === m.id
                    ? 'bg-lumen-accent/10 border-lumen-accent/20 text-lumen-accent'
                    : 'border-transparent hover:bg-lumen-card-hover text-lumen-text-secondary'}`}>
                <input type="radio" name="model" value={m.id} checked={model === m.id} onChange={() => saveModel(m.id)} className="sr-only" />
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${model === m.id ? 'border-lumen-accent' : 'border-lumen-text-muted'}`}>
                  {model === m.id && <div className="w-1.5 h-1.5 rounded-full bg-lumen-accent" />}
                </div>
                <div>
                  <span className="text-[13px] font-medium">{m.label}</span>
                  <p className="text-[10px] text-lumen-text-muted font-mono">{m.id}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* App info */}
        <div className="dark-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-lumen-accent" />
            <h3 className="text-sm font-semibold text-lumen-text">Información</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-lumen-surface rounded-xl p-3 border border-lumen-border flex justify-between">
              <span className="text-xs text-lumen-text-muted">Versión</span>
              <span className="text-xs font-mono text-lumen-text">v{version || '1.0.0'}</span>
            </div>
            <div className="bg-lumen-surface rounded-xl p-3 border border-lumen-border flex justify-between">
              <span className="text-xs text-lumen-text-muted">Plataforma</span>
              <span className="text-xs text-lumen-text">Windows</span>
            </div>
            <div className="bg-lumen-surface rounded-xl p-3 border border-lumen-border flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Github size={12} className="text-lumen-text-muted" />
                <span className="text-xs text-lumen-text-muted">Repositorio</span>
              </div>
              <span className="text-xs text-lumen-accent font-mono">userf8a2c4/lumen</span>
            </div>
            <button onClick={checkUpdate} disabled={checking} className="btn-ghost w-full justify-center">
              <RefreshCw size={12} className={checking ? 'animate-spin' : ''} /> Buscar actualizaciones
            </button>
            {msg && <p className="text-[10px] text-lumen-text-muted text-center">{msg}</p>}
          </div>
        </div>

        {/* Error reporting */}
        <div className="dark-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bug size={16} className="text-red-400" />
            <h3 className="text-sm font-semibold text-lumen-text">Reportar error</h3>
          </div>
          <p className="text-xs text-lumen-text-muted mb-3">Describe el problema y se abrirá un reporte en GitHub.</p>
          <textarea
            value={reportDesc}
            onChange={(e) => setReportDesc(e.target.value)}
            rows={3}
            className="dark-input resize-y mb-3"
            placeholder="Describe el error que encontraste..."
          />
          <button onClick={handleReport} disabled={!reportDesc.trim()} className="btn-ghost w-full justify-center !border-red-500/20 !text-red-400 hover:!bg-red-500/10">
            <Bug size={12} /> Enviar reporte
          </button>
        </div>
      </div>
    </div>
  );
}
