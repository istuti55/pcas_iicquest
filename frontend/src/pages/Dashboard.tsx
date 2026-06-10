import { useState, useEffect } from 'react';
import { queueAPI } from '../services/api';
import JoinQueueView from '../components/JoinQueueView';
import OperatorDashboard from '../components/OperatorDashboard';
import DisplayBoard from '../components/DisplayBoard';
import { LogOut } from 'lucide-react';

interface DashboardProps {
  queueId: string;
}

type View = 'join' | 'operator' | 'display';

export default function Dashboard({ queueId }: DashboardProps) {
  const [currentView, setCurrentView] = useState<View>('join');
  const [queueData, setQueueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const response = await queueAPI.get(queueId);
        setQueueData(response.data);
      } catch (error) {
        console.error('Failed to fetch queue:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQueue();
    const interval = setInterval(fetchQueue, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [queueId]);

  const handleLogout = () => {
    localStorage.removeItem('palo_org_id');
    localStorage.removeItem('palo_queue_id');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-flex animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pālo</h1>
            <p className="text-sm text-gray-600">{queueData?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <nav className="flex gap-2">
              <button
                onClick={() => setCurrentView('join')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'join'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Join Queue
              </button>
              <button
                onClick={() => setCurrentView('operator')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'operator'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Operator
              </button>
              <button
                onClick={() => setCurrentView('display')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentView === 'display'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Display
              </button>
            </nav>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'join' && <JoinQueueView queueId={queueId} />}
        {currentView === 'operator' && <OperatorDashboard queueId={queueId} />}
        {currentView === 'display' && <DisplayBoard queueId={queueId} />}
      </main>
    </div>
  );
}
