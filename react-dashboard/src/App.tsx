import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Users, BarChart2, LogOut } from 'lucide-react';
import { MembersPage } from './pages/Members';
import { StatsPage } from './pages/Stats';
import { LoginPage } from './pages/Login';
import api, { initCsrf } from './api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

type Page = 'members' | 'stats';

function Dashboard() {
  const [page, setPage] = useState<Page>('members');

  async function handleLogout() {
    await api.post('/api/auth/logout');
    window.location.reload();
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="font-bold text-green-700">SOS-Expat</div>
          <div className="text-xs text-gray-500">Trustpilot Dashboard</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => setPage('members')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${page === 'members' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Users className="w-4 h-4" />
            Membres
          </button>
          <button
            onClick={() => setPage('stats')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${page === 'stats' ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <BarChart2 className="w-4 h-4" />
            Statistiques
          </button>
        </nav>
        <div className="p-3 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {page === 'members' && <MembersPage />}
        {page === 'stats' && <StatsPage />}
      </main>
    </div>
  );
}

function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    initCsrf()
      .then(() => api.get('/api/auth/me'))
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false));
  }, []);

  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Chargement...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {authenticated ? (
        <Dashboard />
      ) : (
        <LoginPage onLogin={() => setAuthenticated(true)} />
      )}
    </QueryClientProvider>
  );
}

export default App;
