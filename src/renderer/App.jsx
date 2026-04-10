import React, { useState, useEffect } from 'react';
import LoadingScreen from './components/LoadingScreen';
import Sidebar from './components/Sidebar';
import StatusBar from './components/StatusBar';
import KnowledgeBase from './components/KnowledgeBase/KnowledgeBase';
import Contacts from './components/Contacts/Contacts';
import Assistant from './components/Assistant/Assistant';
import Notes from './components/Notes/Notes';
import Settings from './components/Settings/Settings';
import UpdateBanner from './components/UpdateBanner';
import DailyInsight from './components/DailyInsight';
import Dashboard from './components/Dashboard/Dashboard';

function extractNameFromEmail(email) {
  if (!email || !email.trim()) return 'Lu';
  const local = email.split('@')[0];
  const first = local.split('.')[0];
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

const MODULES = {
  dashboard: { label: 'Inicio',        component: Dashboard },
  assistant: { label: 'Laboratorio',   component: Assistant },
  knowledge: { label: 'Biblioteca',    component: KnowledgeBase },
  contacts:  { label: 'Directorio',    component: Contacts },
  notes:     { label: 'Notas',         component: Notes },
  settings:  { label: 'Configuracion', component: Settings },
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [moduleProps, setModuleProps] = useState({});
  const [update, setUpdate] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [version, setVersion] = useState('1.0.0');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [userName, setUserName] = useState('Lu');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.lumen.app.getVersion().then(setVersion).catch(() => {});
    window.lumen.settings.getModel().then(setModel).catch(() => {});
    window.lumen.settings.getTheme().then((t) => {
      if (t) {
        setTheme(t);
        document.documentElement.className = t === 'light' ? 'light-theme' : '';
      }
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
  };

  const navigateTo = (module, props = {}) => {
    setActiveModule(module);
    setModuleProps(props);
  };

  const handleModelChange = (m) => {
    setModel(m);
  };

  if (loading) return <LoadingScreen />;

  const ActiveComponent = MODULES[activeModule].component;

  return (
    <div className="flex flex-col h-screen" style={{ background: 'var(--lumen-bg)' }}>
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
        />
        <main className="flex-1 overflow-y-auto p-6">
          <ActiveComponent {...moduleProps} navigateTo={navigateTo} onModelChange={handleModelChange} userName={userName} />
        </main>
      </div>

      {/* Status bar footer */}
      <StatusBar version={version} syncStatus={syncStatus} model={model} />
    </div>
  );
}
