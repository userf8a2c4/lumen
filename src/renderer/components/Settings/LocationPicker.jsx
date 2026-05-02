/**
 * LocationPicker — Selector de 3 ubicaciones con mapa OpenStreetMap + Leaflet.
 * Cada ubicación (Casa, Trabajo, Otro) tiene un pin arrastrable.
 * Reverse geocoding via Nominatim (gratuito, sin API key).
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';

// Fix Leaflet default icons (Vite/webpack issue)
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
delete L.Icon.Default.prototype._getIconUrl;

const ICON_COLORS = { home: '#10b981', work: '#60a5fa', other: '#f59e0b' };
const ICON_LABELS = { home: 'Casa', work: 'Trabajo', other: 'Otro' };

function makeIcon(color) {
  return L.divIcon({
    html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.45)"></div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// Reverse geocode with Nominatim
async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
      { headers: { 'User-Agent': 'LUMEN-App/1.0' } }
    );
    const data = await res.json();
    // Build a short readable address
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

// Single location card with embedded mini-map
function LocationCard({ loc, onChange }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [geocoding, setGeocoding] = useState(false);

  // Default to Toluca centro if no coords
  const defaultLat = loc.lat ?? 19.2934;
  const defaultLng = loc.lng ?? -99.6569;

  useEffect(() => {
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapRef.current, {
      center: [defaultLat, defaultLng],
      zoom: loc.lat ? 15 : 13,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([defaultLat, defaultLng], {
      draggable: true,
      icon: makeIcon(ICON_COLORS[loc.id]),
    }).addTo(map);

    marker.on('dragend', async (e) => {
      const { lat, lng } = e.target.getLatLng();
      setGeocoding(true);
      const address = await reverseGeocode(lat, lng);
      setGeocoding(false);
      onChange({ ...loc, lat, lng, address });
    });

    // Click to move pin
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setGeocoding(true);
      const address = await reverseGeocode(lat, lng);
      setGeocoding(false);
      onChange({ ...loc, lat, lng, address });
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line

  // Sync marker when lat/lng changes externally
  useEffect(() => {
    if (markerRef.current && loc.lat && loc.lng) {
      markerRef.current.setLatLng([loc.lat, loc.lng]);
      mapInstanceRef.current?.setView([loc.lat, loc.lng], 15, { animate: true });
    }
  }, [loc.lat, loc.lng]);

  const color = ICON_COLORS[loc.id];

  return (
    <div style={{
      border: `1px solid ${loc.enabled ? color + '55' : 'var(--lumen-border)'}`,
      borderRadius: 8, overflow: 'hidden',
      opacity: loc.enabled ? 1 : 0.5,
      transition: 'opacity 0.2s, border-color 0.2s',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px',
        background: loc.enabled ? `${color}10` : 'var(--lumen-card)',
        borderBottom: '1px solid var(--lumen-border)',
      }}>
        <MapPin size={13} style={{ color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--lumen-text)', flex: 1 }}>
          {ICON_LABELS[loc.id]}
        </span>
        {/* Enabled toggle */}
        <button
          type="button"
          onClick={() => onChange({ ...loc, enabled: !loc.enabled })}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}
          title={loc.enabled ? 'Desactivar ubicación' : 'Activar ubicación'}
        >
          {loc.enabled
            ? <ToggleRight size={20} style={{ color }} />
            : <ToggleLeft size={20} style={{ color: 'var(--lumen-text-muted)' }} />
          }
        </button>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ height: 160, width: '100%', cursor: 'crosshair' }} />

      {/* Address display */}
      <div style={{ padding: '7px 12px', background: 'var(--lumen-card)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {geocoding
          ? <Loader2 size={11} className="animate-spin" style={{ color: 'var(--lumen-text-muted)', flexShrink: 0 }} />
          : <MapPin size={11} style={{ color: 'var(--lumen-text-muted)', flexShrink: 0 }} />
        }
        <span style={{ fontSize: 10, color: geocoding ? 'var(--lumen-text-muted)' : 'var(--lumen-text-secondary)', lineHeight: 1.4, flex: 1 }}>
          {geocoding ? 'Obteniendo dirección...' : loc.address || 'Arrastra o haz clic en el mapa para fijar ubicación'}
        </span>
      </div>
    </div>
  );
}

export default function LocationPicker({ locations, onChange }) {
  const handleChange = useCallback((updated) => {
    onChange(locations.map((l) => l.id === updated.id ? updated : l));
  }, [locations, onChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 10, color: 'var(--lumen-text-muted)', lineHeight: 1.55, marginBottom: 4 }}>
        Haz clic en el mapa o arrastra el pin para fijar cada ubicación. El widget de promociones en Dashboard usará estas coordenadas para buscar negocios y ofertas cercanas.
      </p>
      {locations.map((loc) => (
        <LocationCard key={loc.id} loc={loc} onChange={handleChange} />
      ))}
    </div>
  );
}
