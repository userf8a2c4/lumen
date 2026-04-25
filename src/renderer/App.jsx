import React, { useState, useEffect } from 'react';
import LoadingScreen from './components/LoadingScreen';
import Sidebar from './components/Sidebar';
import StatusBar from './components/StatusBar';
import KnowledgeBase from './components/KnowledgeBase/KnowledgeBase';
import Contacts from './components/Contacts/Contacts';
import Assistant from './components/Assistant/Assistant';
import Notes from './components/Notes/Notes';
import Agenda from './components/Agenda/Agenda';
import EvidenceVault from './components/Evidence/EvidenceVault';
import LogicDesigner from './components/LogicDesigner/LogicDesigner';
import AC3 from './components/AC3/AC3';
import Settings from './components/Settings/Settings';
import UpdateBanner from './components/UpdateBanner';
import DailyInsight from './components/DailyInsight';
import Dashboard from './components/Dashboard/Dashboard';
import LU from './components/LU';
import ErrorBoundary from './components/ErrorBoundary';

function extractNameFromEmail(email) {
  if (!email || !email.trim()) return 'Lu';
  const local = email.split('@')[0];
  // Strip numbers and split on common separators
  const clean = local.replace(/[0-9_\-\.]+/g, ' ').trim();
  const first = clean.split(/\s+/)[0] || local;
  if (!first || first.length < 2) return 'Lu';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

const DEFAULT_SECTION_LABELS = {
  dashboard: 'Dashboard',
  ac3:       'Decisiones',
  knowledge: 'Biblioteca',
  contacts:  'Directorio',
  notes:     'Notas',
  settings:  'Configuración',
};

export const DEFAULT_APPEARANCE = {
  darkPrimary:    '#ffffff',
  darkSecondary:  '#7E3FF2',
  lightPrimary:   '#000000',
  lightSecondary: '#7E3FF2',
  fontFamily:     'Inter',
};

const FONT_STACKS = {
  'Inter':          "'Inter', -apple-system, system-ui, sans-serif",
  'Roboto':         "'Roboto', -apple-system, system-ui, sans-serif",
  'IBM Plex Sans':  "'IBM Plex Sans', -apple-system, system-ui, sans-serif",
  'JetBrains Mono': "'JetBrains Mono', 'Courier New', monospace",
  'system-ui':      "-apple-system, system-ui, BlinkMacSystemFont, sans-serif",
};

function applyAppearance(appearance, currentTheme) {
  const isDark = currentTheme !== 'light';
  document.documentElement.style.setProperty('--lumen-accent', isDark ? appearance.darkPrimary : appearance.lightPrimary);
  document.documentElement.style.setProperty('--lumen-accent-secondary', isDark ? appearance.darkSecondary : appearance.lightSecondary);
  const stack = FONT_STACKS[appearance.fontFamily] || FONT_STACKS['Inter'];
  document.documentElement.style.setProperty('--lumen-font', stack);
}

const MODULES = {
  dashboard: { label: 'Inicio',         component: Dashboard },
  agenda:    { label: 'Agenda',         component: Agenda },
  ac3:       { label: 'AC3 Decisiones', component: AC3 },
  assistant: { label: 'Laboratorio',    component: Assistant },
  knowledge: { label: 'Biblioteca',     component: KnowledgeBase },
  contacts:  { label: 'Directorio',     component: Contacts },
  notes:     { label: 'Notas',          component: Notes },
  evidence:  { label: 'Evidencias',     component: EvidenceVault },
  logic:     { label: 'Diseñador',      component: LogicDesigner },
  settings:  { label: 'Configuración',  component: Settings },
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [moduleProps, setModuleProps] = useState({});
  const [update, setUpdate] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [version, setVersion] = useState('1.0.0');
  const [model, setModel] = useState('gemini-2.5-flash');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [userName, setUserName] = useState('Lu');
  const [sectionLabels, setSectionLabels] = useState(DEFAULT_SECTION_LABELS);
  const [appearance, setAppearance] = useState(DEFAULT_APPEARANCE);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.lumen.app.getVersion().then(setVersion).catch(() => {});
    window.lumen.settings.getModel().then(setModel).catch(() => {});
    window.lumen.settings.getSectionLabels().then((json) => {
      if (json) {
        try { setSectionLabels((prev) => ({ ...prev, ...JSON.parse(json) })); } catch {}
      }
    }).catch(() => {});
    window.lumen.settings.getTheme().then((t) => {
      const resolvedTheme = t || 'dark';
      setTheme(resolvedTheme);
      document.documentElement.className = resolvedTheme === 'light' ? 'light-theme' : '';
      window.lumen.settings.getAppearanceSettings().then((json) => {
        let app = DEFAULT_APPEARANCE;
        if (json) {
          try { app = { ...DEFAULT_APPEARANCE, ...JSON.parse(json) }; } catch {}
        } else {
          window.lumen.settings.getAccentColor().then((ac) => {
            if (ac) {
              app = { ...DEFAULT_APPEARANCE, darkPrimary: ac };
            }
            setAppearance(app);
            applyAppearance(app, resolvedTheme);
          }).catch(() => {});
          return;
        }
        setAppearance(app);
        applyAppearance(app, resolvedTheme);
      }).catch(() => {});
    }).catch(() => {});
    window.lumen.settings.getUserEmail().then((email) => {
      // Full first name (e.g. "Lucila" not "Lu") — formal address
      if (email) {
        const name = extractNameFromEmail(email);
        setUserName(name || 'Lucila');
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!window.lumen?.updater) return;

    const cleanups = [
      window.lumen.updater.onUpdateAvailable((info) => {
        setUpdate({ status: 'available', version: info.version, notes: info.releaseNotes });
        setSyncStatus('update');
      }),
      window.lumen.updater.onUpdateNotAvailable(() => {
        setSyncStatus('synced');
      }),
      window.lumen.updater.onDownloadProgress((info) => {
        setUpdate((prev) => ({ ...prev, status: 'downloading', percent: info.percent }));
      }),
      window.lumen.updater.onUpdateDownloaded((info) => {
        setUpdate({ status: 'downloaded', version: info.version });
      }),
      window.lumen.updater.onUpdateError(() => {
        setSyncStatus('error');
      }),
    ];

    return () => cleanups.forEach((cleanup) => cleanup && cleanup());
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.className = next === 'light' ? 'light-theme' : '';
    window.lumen.settings.setTheme(next).catch(() => {});
    applyAppearance(appearance, next);
  };

  const handleAppearanceChange = async (newAppearance) => {
    setAppearance(newAppearance);
    applyAppearance(newAppearance, theme);
    await window.lumen.settings.setAppearanceSettings(JSON.stringify(newAppearance)).catch(() => {});
  };

  const navigateTo = (module, props = {}) => {
    setActiveModule(module);
    setModuleProps(props);
  };

  const handleModelChange = (m) => {
    setModel(m);
  };

  const handleSectionLabelsChange = async (newLabels) => {
    setSectionLabels(newLabels);
    await window.lumen.settings.setSectionLabels(JSON.stringify(newLabels)).catch(() => {});
  };

  if (loading) return <LoadingScreen />;

  const ActiveComponent = MODULES[activeModule].component;

  return (
    <div className="flex flex-col h-screen" style={{ background: 'transparent' }}>
      {/* Daily insight toast */}
      <DailyInsight userName={userName} />

      {/* Update banner */}
      {update && (
        <UpdateBanner
          update={update}
          onDownload={() => window.lumen.updater.download()}
          onInstall={() => window.lumen.updater.install()}
          onDismiss={() => setUpdate(null)}
        />
      )}

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeModule={activeModule}
          onNavigate={(m) => navigateTo(m)}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          theme={theme}
          onToggleTheme={toggleTheme}
          sectionLabels={sectionLabels}
        />
        <main className={`flex-1 ${activeModule === 'ac3' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto p-6'}`}>
          <ErrorBoundary name={activeModule}>
            <ActiveComponent {...moduleProps} navigateTo={navigateTo} onModelChange={handleModelChange} userName={userName} sectionLabels={sectionLabels} onSectionLabelsChange={handleSectionLabelsChange} appearance={appearance} onAppearanceChange={handleAppearanceChange} theme={theme} />
          </ErrorBoundary>
        </main>
      </div>

      {/* Status bar footer */}
      <StatusBar version={version} syncStatus={syncStatus} model={model} />

      {/* LU — fixed bottom-right chat widget */}
      <ErrorBoundary name="LU">
        <LU />
      </ErrorBoundary>
    </div>
  );
}
