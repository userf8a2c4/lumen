// Theme customization helpers
// Allows the user to override colors per mode (dark/light) and font family.

export const FONT_OPTIONS = [
  { id: 'Inter',       label: 'Inter (predeterminado)', stack: "'Inter', -apple-system, system-ui, sans-serif" },
  { id: 'System UI',   label: 'Sistema',                stack: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif" },
  { id: 'Roboto',      label: 'Roboto',                 stack: "'Roboto', 'Helvetica Neue', Arial, sans-serif" },
  { id: 'Serif',       label: 'Serif',                  stack: "'Iowan Old Style', 'Apple Garamond', Georgia, serif" },
  { id: 'Monospace',   label: 'Monoespaciada',          stack: "'JetBrains Mono', 'Fira Code', Consolas, monospace" },
];

export const DEFAULT_THEME = {
  dark: {
    accent: '#FFFFFF',
    bg:     '#000000',
    text:   '#FFFFFF',
    border: '#FFFFFF',
  },
  light: {
    accent: '#000000',
    bg:     '#F0F0F0',
    text:   '#000000',
    border: '#000000',
  },
  font: 'Inter',
};

// "#RRGGBB" → "rgba(r,g,b,a)"
export function hexToRgba(hex, alpha = 1) {
  if (!hex || typeof hex !== 'string') return `rgba(255,255,255,${alpha})`;
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return `rgba(255,255,255,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getFontStack(fontId) {
  const found = FONT_OPTIONS.find((f) => f.id === fontId);
  return found ? found.stack : FONT_OPTIONS[0].stack;
}

// Merge user customization with defaults safely.
export function mergeTheme(custom) {
  const c = custom || {};
  return {
    dark:  { ...DEFAULT_THEME.dark,  ...(c.dark  || {}) },
    light: { ...DEFAULT_THEME.light, ...(c.light || {}) },
    font:  c.font || DEFAULT_THEME.font,
  };
}

export function applyThemeCustomization(mode, custom) {
  const root = document.documentElement;
  root.className = mode === 'light' ? 'light-theme' : '';

  const merged = mergeTheme(custom);
  const t = merged[mode] || DEFAULT_THEME[mode];
  const isLight = mode === 'light';

  root.style.setProperty('--lumen-bg',             t.bg);
  root.style.setProperty('--lumen-text',           t.text);
  root.style.setProperty('--lumen-text-secondary', hexToRgba(t.text, isLight ? 0.55 : 0.65));
  root.style.setProperty('--lumen-text-muted',     hexToRgba(t.text, isLight ? 0.40 : 0.40));
  root.style.setProperty('--lumen-accent',         t.accent);
  root.style.setProperty('--lumen-accent-hover',   t.accent);
  root.style.setProperty('--lumen-border',         hexToRgba(t.border, isLight ? 0.14 : 0.10));
  root.style.setProperty('--lumen-border-light',   hexToRgba(t.border, isLight ? 0.22 : 0.18));
  root.style.setProperty('--lumen-font',           getFontStack(merged.font));
}

export async function loadAndApplyTheme(mode) {
  let custom = null;
  try {
    const raw = await window.lumen.settings.getThemeCustomization();
    if (raw) custom = JSON.parse(raw);
  } catch {}
  applyThemeCustomization(mode, custom);
  return custom;
}

export async function saveThemeCustomization(custom) {
  try {
    await window.lumen.settings.setThemeCustomization(JSON.stringify(custom));
  } catch {}
}
