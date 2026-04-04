import React, { useState, useEffect } from 'react';
import LoadingScreen from './components/LoadingScreen';
import Sidebar from './components/Sidebar';
import StatusBar from './components/StatusBar';
import KnowledgeBase from './components/KnowledgeBase/KnowledgeBase';
import Search from './components/Search/Search';
import Contacts from './components/Contacts/Contacts';
import Assistant from './components/Assistant/Assistant';
import Examples from './components/Examples/Examples';
import Notes from './components/Notes/Notes';
import Settings from './components/Settings/Settings';
import UpdateBanner from './components/UpdateBanner';

const MODULES = {
  assistant: { label: 'Asistente de Caso', component: Assistant },
  knowledge: { label: 'Base de Conocimiento', component: KnowledgeBase },
  search: { label: 'Busqueda Instantanea', component: Search },
  contacts: { label: 'Directorio de Escalacion', component: Contacts },
  examples: { label: 'Casos de Ejemplo', component: Examples },
  notes: { label: 'Notas', component: Notes },
  settings: { label: 'Configuracion', component: Settings },
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('assistant');
  const [moduleProps, setModuleProps] = useState({});
  const [update, setUpdate] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [version, setVersion] = useState('1.0.0');
  const [model, setModel] = useState('claude-sonnet-4-20250514');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState('dark');

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
          <ActiveComponent {...moduleProps} navigateTo={navigateTo} onModelChange={handleModelChange} />
        </main>
      </div>

      {/* Status bar footer */}
      <StatusBar version={version} syncStatus={syncStatus} model={model} />
    </div>
  );
}
