import React, { useState } from 'react';
import { MapPin, Loader2, ToggleLeft, ToggleRight, Navigation, CheckCircle2, AlertCircle } from 'lucide-react';

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

function LocationCard({ loc, onChange }) {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const color = ICON_COLORS[loc.id];

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
          err.code === 1 ? 'Permiso de ubicación denegado. Permite el acceso en la configuración de Windows.' :
          err.code === 2 ? 'No se pudo obtener la ubicación. Verifica que el GPS esté activo.' :
          'Tiempo de espera agotado. Intenta de nuevo.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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
            : <ToggleLeft  size={20} style={{ color: 'var(--lumen-text-muted)' }} />
          }
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
        </div>

        {/* Capture button */}
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
            border: `1px solid ${
              status === 'success' ? 'rgba(16,185,129,0.3)'
            : status === 'error'   ? 'rgba(239,68,68,0.25)'
            : color + '40'}`,
            color: status === 'success' ? '#10b981'
                 : status === 'error'   ? '#f87171'
                 : color,
          }}
        >
          {status === 'loading' && <Loader2 size={13} className="animate-spin" />}
          {status === 'success' && <CheckCircle2 size={13} />}
          {status === 'error'   && <AlertCircle size={13} />}
          {status === 'idle'    && <Navigation size={13} />}

          {status === 'loading' ? 'Obteniendo ubicación…'
         : status === 'success' ? '¡Ubicación guardada!'
         : status === 'error'   ? 'Error — Intentar de nuevo'
         : loc.address          ? 'Actualizar ubicación actual'
         :                        'Usar mi ubicación actual'}
        </button>

        {/* Error detail */}
        {status === 'error' && errorMsg && (
          <p style={{ fontSize: 10, color: '#f87171', lineHeight: 1.5, margin: 0 }}>
            {errorMsg}
          </p>
        )}

        {/* Coords hint */}
        {loc.lat && loc.lng && (
          <p style={{ fontSize: 9, color: 'var(--lumen-text-muted)', fontFamily: 'monospace', margin: 0 }}>
            {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
          </p>
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
        Presiona el botón en cada ubicación para capturar tu posición GPS actual.
        El widget de promociones en Dashboard usará estas coordenadas para buscar negocios y ofertas cercanas.
      </p>
      {locations.map((loc) => (
        <LocationCard key={loc.id} loc={loc} onChange={handleChange} />
      ))}
    </div>
  );
}
