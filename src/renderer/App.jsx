import React, { useState, useEffect } from 'react';
import LoadingScreen from './components/LoadingScreen';
import Sidebar from './components/Sidebar';
import StatusBar from './components/StatusBar';
import KnowledgeBase from './components/KnowledgeBase/KnowledgeBase';
import Search from './components/Search/Search';
import Contacts from './components/Contacts/Contacts';
import Assistant from './components/Assistant/Assistant';
import Examples from './components/Examples/Examples';
import Settings from './components/Settings/Settings';
import UpdateBanner from './components/UpdateBanner';

const MODULES = {
  assistant: { label: 'Asistente de Caso', component: Assistant },
  knowledge: { label: 'Base de Conocimiento', component: KnowledgeBase },
  search: { label: 'Búsqueda Instantánea', component: Search },
  contacts: { label: 'Directorio de Escalación', component: Contacts },
  examples: { label: 'Casos de Ejemplo', component: Examples },
  settings: { label: 'Configuración', component: Settings },
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('assistant');
  const [moduleProps, setModuleProps] = useState({});
  const [update, setUpdate] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [version, setVersion] = useState('1.0.0');
  const [model, setModel] = useState('claude-sonnet-4-20250514');

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.lumen.app.getVersion().then(setVersion).catch(() => {});
    window.lumen.settings.getModel().then(setModel).catch(() => {});
  }, []);

  useEffect(() => {
    if (!window.lumen?.updater) return;

    window.lumen.updater.onUpdateAvailable((info) => {
      setUpdate({ status: 'available', version: info.version, notes: info.releaseNotes });
      setSyncStatus('update');
    });
    window.lumen.updater.onUpdateNotAvailable(() => {
      setSyncStatus('synced');
    });
    window.lumen.updater.onDownloadProgress((info) => {
      setUpdate((prev) => ({ ...prev, status: 'downloading', percent: info.percent }));
    });
    window.lumen.updater.onUpdateDownloaded((info) => {
      setUpdate({ status: 'downloaded', version: info.version });
    });
    window.lumen.updater.onUpdateError(() => {
      setSyncStatus('error');
    });
  }, []);

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
    <div className="flex flex-col h-screen bg-lumen-bg">
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
        <Sidebar activeModule={activeModule} onNavigate={(m) => navigateTo(m)} />
        <main className="flex-1 overflow-y-auto p-6">
          <ActiveComponent {...moduleProps} navigateTo={navigateTo} onModelChange={handleModelChange} />
        </main>
      </div>

      {/* Status bar footer */}
      <StatusBar version={version} syncStatus={syncStatus} model={model} />
    </div>
  );
}
