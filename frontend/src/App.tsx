import { useState, useEffect } from 'react';
import { healthAPI } from './services/api';
import Setup from './pages/Setup';
import HomeView from './pages/HomeView';
import UserPortal from './pages/UserPortal';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import DisplayBoard from './pages/DisplayBoard';

export type AppView = 'setup' | 'home' | 'user' | 'admin-login' | 'admin' | 'display';

export default function App() {
  const [view, setView] = useState<AppView>('home');
  const [isHealthy, setIsHealthy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [queueId, setQueueId] = useState<string | null>(() =>
    localStorage.getItem('palo_queue_id')
  );

  useEffect(() => {
    const init = async () => {
      try {
        await healthAPI.check();
        setIsHealthy(true);
      } catch {
        setIsHealthy(false);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    // First-time setup if no queue configured
    if (!loading && isHealthy && !queueId) {
      setView('setup');
    }
  }, [loading, isHealthy, queueId]);

  const handleSetupComplete = (orgId: string, qId: string) => {
    localStorage.setItem('palo_org_id', orgId);
    localStorage.setItem('palo_queue_id', qId);
    setQueueId(qId);
    setView('home');
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('palo_admin');
    setView('home');
  };

  const handleAdminLoginSuccess = () => {
    sessionStorage.setItem('palo_admin', '1');
    setView('admin');
  };

  const handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    setQueueId(null);
    setView('setup');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="inline-block w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 text-lg font-medium">Starting Pālo...</p>
        </div>
      </div>
    );
  }

  if (!isHealthy) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="bg-slate-900 border border-red-800 rounded-2xl p-10 max-w-sm w-full text-center shadow-2xl">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">Backend Offline</h2>
          <p className="text-slate-400 mb-6">Cannot reach the API at localhost:8000. Make sure the backend is running.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (view === 'setup') {
      return <Setup onSetupComplete={handleSetupComplete} />;
    }

    if (!queueId) {
      return <Setup onSetupComplete={handleSetupComplete} />;
    }

    switch (view) {
      case 'home':
        return <HomeView queueId={queueId} setView={setView} onReset={handleReset} />;
      case 'user':
        return <UserPortal queueId={queueId} onBack={() => setView('home')} />;
      case 'admin-login':
        return <AdminLogin onSuccess={handleAdminLoginSuccess} onBack={() => setView('home')} />;
      case 'admin':
        return <AdminDashboard queueId={queueId} onLogout={handleAdminLogout} />;
      case 'display':
        return <DisplayBoard queueId={queueId} onBack={() => setView('home')} />;
      default:
        return <HomeView queueId={queueId} setView={setView} onReset={handleReset} />;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#020617] selection:bg-blue-500/30 selection:text-blue-200">
      <div className="vanguard-bg" />
      
      {/* Dynamic Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '3s' }} />
      </div>

      <div className="relative z-10 min-h-screen">
        {renderContent()}
      </div>
    </div>
  );
}
