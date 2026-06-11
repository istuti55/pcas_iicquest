import { useState, useEffect } from 'react';
import { healthAPI, organizationAPI, queueAPI } from './services/api';
import HomeView from './pages/HomeView';
import UserPortal from './pages/UserPortal';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import DisplayBoard from './pages/DisplayBoard';

export type AppView = 'home' | 'user' | 'admin-login' | 'admin' | 'display';

export default function App() {
  const [view, setView] = useState<AppView>(() => {
    const params = new URLSearchParams(window.location.search);
    const v = params.get('view') as AppView;
    return v || 'home';
  });
  const [isHealthy, setIsHealthy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [queueId, setQueueId] = useState<string | null>(() =>
    localStorage.getItem('palo_queue_id')
  );
  const [orgId, setOrgId] = useState<string | null>(() =>
    localStorage.getItem('palo_org_id')
  );

  useEffect(() => {
    const init = async () => {
      try {
        await healthAPI.check();
        setIsHealthy(true);

        let savedOrgId = localStorage.getItem('palo_org_id');
        let savedQueueId = localStorage.getItem('palo_queue_id');

        try {
          const orgsRes = await organizationAPI.listAll();
          if (!orgsRes.data || orgsRes.data.length === 0) {
            throw new Error("No organizations found");
          }
          
          const orgExists = savedOrgId && orgsRes.data.some((o: any) => o.id === savedOrgId);
          if (!orgExists) {
            savedOrgId = orgsRes.data[0].id;
            localStorage.setItem('palo_org_id', savedOrgId!);
            savedQueueId = null; 
            localStorage.removeItem('palo_queue_id');
            localStorage.removeItem('palo_active_token_id');
          }

          if (!savedQueueId) {
            const qRes = await queueAPI.list(savedOrgId!);
            const queues = qRes.data;
            if (queues && queues.length > 0) {
              savedQueueId = queues[0].id;
              localStorage.setItem('palo_queue_id', savedQueueId!);
            } else {
              savedQueueId = null;
            }
          }
        } catch {
          savedQueueId = null;
        }

        if (savedOrgId) setOrgId(savedOrgId);
        if (savedQueueId) setQueueId(savedQueueId);
      } catch {
        setIsHealthy(false);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleAdminLogout = () => {
    sessionStorage.removeItem('palo_admin');
    setView('home');
  };

  const handleAdminLoginSuccess = () => {
    sessionStorage.setItem('palo_admin', '1');
    setView('admin');
  };

  const handleQueueChange = (newQueueId: string) => {
    localStorage.setItem('palo_queue_id', newQueueId);
    setQueueId(newQueueId);
  };

  const handleReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    setQueueId(null);
    setView('home');
    window.location.reload();
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

  // If no queue resolved at all, show a simple error state
  if (!queueId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="bg-slate-900 border border-amber-800 rounded-2xl p-10 max-w-sm w-full text-center shadow-2xl">
          <div className="text-5xl mb-4">🗂️</div>
          <h2 className="text-2xl font-bold text-amber-400 mb-2">No Queue Found</h2>
          <p className="text-slate-400 mb-6">The backend hasn't created any queues yet. Make sure the backend has fully started.</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (view) {
      case 'home':
        return <HomeView orgId={orgId!} setView={setView} onReset={handleReset} onSelectQueue={handleQueueChange} />;
      case 'user':
        return <UserPortal orgId={orgId!} defaultQueueId={queueId!} onBack={() => setView('home')} />;
      case 'admin-login':
        return <AdminLogin onSuccess={handleAdminLoginSuccess} onBack={() => setView('home')} />;
      case 'admin':
        return <AdminDashboard queueId={queueId!} orgId={orgId!} onLogout={handleAdminLogout} onQueueChange={handleQueueChange} />;
      case 'display':
        return <DisplayBoard queueId={queueId!} onBack={() => setView('home')} />;
      default:
        return <HomeView orgId={orgId!} setView={setView} onReset={handleReset} onSelectQueue={handleQueueChange} />;
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
