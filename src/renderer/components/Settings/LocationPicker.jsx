import React, { useState } from 'react';
import { MapPin, Loader2, ToggleLeft, ToggleRight, Navigation, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

const ICON_COLORS = { home: '#10b981', work: '#60a5fa', other: '#f59e0b' };
const ICON_LABELS = { home: 'Casa', work: 'Trabajo', other: 'Otro' };

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
      { headers: { 'User-Agent': 'LUMEN-App/1.0' } }
    );
    const data = await res.json();
    const a = data.address || {};
    const parts = [
      a.road || a.pedestrian || a.footway,
      a.house_number,
      a.suburb || a.neighbourhood,
      a.city || a.town || a.village || a.municipality,
      a.state,
    ].filter(Boolean);
    return parts.join(', ') || data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

function isValidCoord(val, min, max) {
  const n = parseFloat(val);
  return !isNaN(n) && n >= min && n <= max;
}

async function getLocationByIP() {
  // Primary: ipapi.co
  try {
    const res = await fetch('https://ipapi.co/json/', { headers: { 'User-Agent': 'LUMEN-App/1.0' } });
    const d = await res.json();
    if (d.latitude && d.longitude) return { lat: d.latitude, lng: d.longitude, city: d.city || d.region || '' };
  } catch {}
  // Fallback: ip-api.com
  try {
    const res = await fetch('https://ip-api.com/json/?fields=lat,lon,city,status');
    const d = await res.json();
    if (d.status === 'success') return { lat: d.lat, lng: d.lon, city: d.city || '' };
  } catch {}
  return null;
}

function LocationCard({ loc, onChange }) {
  const [status,     setStatus]     = useState('idle'); // idle | loading | success | error
  const [errorMsg,   setErrorMsg]   = useState('');
  const [ipStatus,   setIpStatus]   = useState('idle'); // idle | loading | success | error
  const [manualLat,  setManualLat]  = useState('');
  const [manualLng,  setManualLng]  = useState('');
  const [manualStatus, setManualStatus] = useState('idle'); // idle | loading | success | error
  const [showManual, setShowManual] = useState(false);
  const color = ICON_COLORS[loc.id];

  // ── GPS auto-capture ──────────────────────────────────────────────
  const captureLocation = () => {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMsg('Tu dispositivo no soporta geolocalización.');
      return;
    }
    setStatus('loading');
    setErrorMsg('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const address = await reverseGeocode(lat, lng);
        onChange({ ...loc, lat, lng, address, enabled: true });
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2500);
      },
      (err) => {
        setStatus('error');
        setErrorMsg(
          err.code === 1
            ? 'Permiso denegado. Activa el acceso en Configuración de Windows > Privacidad > Ubicación.'
            : err.code === 2
            ? 'Tu PC no tiene GPS de hardware. Usa "Ubicación por IP" o ingresa coordenadas manualmente.'
            : 'Tiempo de espera agotado. Intenta de nuevo.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ── IP-based location (fallback for PCs without GPS hardware) ────
  const captureByIP = async () => {
    setIpStatus('loading');
    try {
      const result = await getLocationByIP();
      if (!result) { setIpStatus('error'); return; }
      const address = await reverseGeocode(result.lat, result.lng);
      onChange({ ...loc, lat: result.lat, lng: result.lng, address, enabled: true });
      setIpStatus('success');
      setStatus('idle'); setErrorMsg('');
      setTimeout(() => setIpStatus('idle'), 2500);
    } catch { setIpStatus('error'); }
  };

  // ── Manual coordinates save ───────────────────────────────────────
  const saveManual = async () => {
    if (!isValidCoord(manualLat, -90, 90) || !isValidCoord(manualLng, -180, 180)) {
      setManualStatus('error');
      return;
    }
    const lat = parseFloat(parseFloat(manualLat).toFixed(6));
    const lng = parseFloat(parseFloat(manualLng).toFixed(6));
    setManualStatus('loading');
    const address = await reverseGeocode(lat, lng);
    onChange({ ...loc, lat, lng, address, enabled: true });
    setManualLat('');
    setManualLng('');
    setManualStatus('success');
    setTimeout(() => { setManualStatus('idle'); setShowManual(false); }, 1800);
  };

  const manualValid = isValidCoord(manualLat, -90, 90) && isValidCoord(manualLng, -180, 180);

  return (
    <div style={{
      border: `1px solid ${loc.enabled ? color + '55' : 'var(--lumen-border)'}`,
      borderRadius: 8, overflow: 'hidden',
      opacity: loc.enabled ? 1 : 0.6,
      transition: 'opacity 0.2s, border-color 0.2s',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px',
        background: loc.enabled ? `${color}10` : 'var(--lumen-card)',
        borderBottom: '1px solid var(--lumen-border)',
      }}>
        <MapPin size={13} style={{ color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lumen-text)', flex: 1 }}>
          {ICON_LABELS[loc.id]}
        </span>
        <button
          type="button"
          onClick={() => onChange({ ...loc, enabled: !loc.enabled })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}
          title={loc.enabled ? 'Desactivar ubicación' : 'Activar ubicación'}
        >
          {loc.enabled
            ? <ToggleRight size={20} style={{ color }} />
            : <ToggleLeft  size={20} style={{ color: 'var(--lumen-text-muted)' }} />}
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--lumen-card)' }}>

        {/* Current address */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <MapPin size={11} style={{ color: loc.address ? color : 'var(--lumen-text-muted)', marginTop: 2, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: loc.address ? 'var(--lumen-text-secondary)' : 'var(--lumen-text-muted)', lineHeight: 1.5, flex: 1 }}>
            {loc.address || 'Sin ubicación configurada'}
          </span>
          {loc.lat && loc.lng && (
            <span style={{ fontSize: 9, color: 'var(--lumen-text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>
              {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
            </span>
          )}
        </div>

        {/* GPS capture button */}
        <button
          onClick={captureLocation}
          disabled={status === 'loading'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '8px 14px', borderRadius: 6, cursor: status === 'loading' ? 'default' : 'pointer',
            fontSize: 11, fontWeight: 600, transition: 'all 0.15s',
            background: status === 'success' ? 'rgba(16,185,129,0.12)'
                      : status === 'error'   ? 'rgba(239,68,68,0.08)'
                      : `${color}14`,
            border: `1px solid ${status === 'success' ? 'rgba(16,185,129,0.3)' : status === 'error' ? 'rgba(239,68,68,0.25)' : color + '40'}`,
            color: status === 'success' ? '#10b981' : status === 'error' ? '#f87171' : color,
          }}
        >
          {status === 'loading' && <Loader2 size={13} className="animate-spin" />}
          {status === 'success' && <CheckCircle2 size={13} />}
          {status === 'error'   && <AlertCircle size={13} />}
          {status === 'idle'    && <Navigation size={13} />}
          {status === 'loading' ? 'Obteniendo ubicación…'
         : status === 'success' ? '¡Ubicación guardada!'
         : status === 'error'   ? 'Error — Intentar de nuevo'
         : loc.address          ? 'Actualizar con GPS actual'
         :                        'Usar mi ubicación actual'}
        </button>

        {/* GPS error detail + IP fallback */}
        {status === 'error' && errorMsg && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ fontSize: 10, color: '#f87171', lineHeight: 1.5, margin: 0 }}>{errorMsg}</p>
            {/* IP fallback button — shown when GPS hardware is missing (code 2) */}
            <button
              onClick={captureByIP}
              disabled={ipStatus === 'loading'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 5, cursor: ipStatus === 'loading' ? 'default' : 'pointer',
                fontSize: 10, fontWeight: 600, transition: 'all 0.15s',
                background: ipStatus === 'success' ? 'rgba(16,185,129,0.1)' : ipStatus === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(96,165,250,0.1)',
                border: `1px solid ${ipStatus === 'success' ? 'rgba(16,185,129,0.3)' : ipStatus === 'error' ? 'rgba(239,68,68,0.25)' : 'rgba(96,165,250,0.3)'}`,
                color: ipStatus === 'success' ? '#10b981' : ipStatus === 'error' ? '#f87171' : '#60a5fa',
              }}
            >
              {ipStatus === 'loading' && <Loader2 size={11} className="animate-spin" />}
              {ipStatus === 'success' && <CheckCircle2 size={11} />}
              {ipStatus === 'error'   && <AlertCircle size={11} />}
              {ipStatus === 'idle'    && <Navigation size={11} />}
              {ipStatus === 'loading' ? 'Obteniendo por IP…'
             : ipStatus === 'success' ? '¡Ubicación guardada!'
             : ipStatus === 'error'   ? 'No se pudo obtener IP'
             :                          'Usar ubicación aproximada por IP'}
            </button>
            <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', margin: 0, lineHeight: 1.4 }}>
              La ubicación por IP es aproximada (nivel ciudad). Para mayor precisión usa las coordenadas manuales.
            </p>
          </div>
        )}

        {/* Toggle manual entry */}
        <button
          onClick={() => { setShowManual((v) => !v); setManualStatus('idle'); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontSize: 10, color: 'var(--lumen-text-muted)',
            textDecoration: 'underline', textDecorationStyle: 'dotted',
            alignSelf: 'flex-start',
          }}
        >
          <KeyRound size={10} />
          {showManual ? 'Ocultar coordenadas manuales' : 'Ingresar coordenadas manualmente'}
        </button>

        {/* Manual coords form */}
        {showManual && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--lumen-border)' }}>
            <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--lumen-text-muted)', margin: 0 }}>
              Coordenadas GPS
            </p>

            <div style={{ display: 'flex', gap: 8 }}>
              {/* Latitude */}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, color: 'var(--lumen-text-muted)', display: 'block', marginBottom: 4 }}>
                  Latitud <span style={{ opacity: 0.6 }}>(-90 a 90)</span>
                </label>
                <input
                  type="number"
                  value={manualLat}
                  onChange={(e) => { setManualLat(e.target.value); setManualStatus('idle'); }}
                  placeholder="ej. 19.4326"
                  step="any"
                  style={{
                    width: '100%', padding: '6px 8px', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${manualLat && !isValidCoord(manualLat, -90, 90) ? '#f87171' : 'var(--lumen-border)'}`,
                    borderRadius: 5, fontSize: 11, color: 'var(--lumen-text)',
                    outline: 'none', fontFamily: 'monospace',
                  }}
                />
              </div>
              {/* Longitude */}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 9, color: 'var(--lumen-text-muted)', display: 'block', marginBottom: 4 }}>
                  Longitud <span style={{ opacity: 0.6 }}>(-180 a 180)</span>
                </label>
                <input
                  type="number"
                  value={manualLng}
                  onChange={(e) => { setManualLng(e.target.value); setManualStatus('idle'); }}
                  placeholder="ej. -99.1332"
                  step="any"
                  style={{
                    width: '100%', padding: '6px 8px', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${manualLng && !isValidCoord(manualLng, -180, 180) ? '#f87171' : 'var(--lumen-border)'}`,
                    borderRadius: 5, fontSize: 11, color: 'var(--lumen-text)',
                    outline: 'none', fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>

            <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', margin: 0, lineHeight: 1.5 }}>
              Puedes obtener coordenadas desde Google Maps: clic derecho en el punto → copia las coordenadas.
            </p>

            {/* Save button */}
            <button
              onClick={saveManual}
              disabled={!manualValid || manualStatus === 'loading'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 5, fontSize: 11, fontWeight: 600,
                cursor: manualValid && manualStatus !== 'loading' ? 'pointer' : 'default',
                transition: 'all 0.15s',
                background: manualStatus === 'success' ? 'rgba(16,185,129,0.12)'
                          : manualStatus === 'error'   ? 'rgba(239,68,68,0.08)'
                          : manualValid                ? `${color}14`
                          :                              'rgba(255,255,255,0.03)',
                border: `1px solid ${manualStatus === 'success' ? 'rgba(16,185,129,0.3)' : manualStatus === 'error' ? 'rgba(239,68,68,0.25)' : manualValid ? color + '40' : 'var(--lumen-border)'}`,
                color: manualStatus === 'success' ? '#10b981' : manualStatus === 'error' ? '#f87171' : manualValid ? color : 'var(--lumen-text-muted)',
              }}
            >
              {manualStatus === 'loading' && <Loader2 size={12} className="animate-spin" />}
              {manualStatus === 'success' && <CheckCircle2 size={12} />}
              {manualStatus === 'error'   && <AlertCircle size={12} />}
              {manualStatus === 'loading' ? 'Guardando…'
             : manualStatus === 'success' ? '¡Guardado!'
             : manualStatus === 'error'   ? 'Coordenadas inválidas'
             :                              'Guardar coordenadas'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LocationPicker({ locations, onChange }) {
  const handleChange = (updated) => {
    onChange(locations.map((l) => l.id === updated.id ? updated : l));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 11, color: 'var(--lumen-text-muted)', lineHeight: 1.6, marginBottom: 4 }}>
        Usa el GPS para capturar tu posición actual, o ingresa coordenadas manualmente.
        El widget de promociones en Dashboard usará estas coordenadas para buscar negocios y ofertas cercanas.
      </p>
      {locations.map((loc) => (
        <LocationCard key={loc.id} loc={loc} onChange={handleChange} />
      ))}
    </div>
  );
}
