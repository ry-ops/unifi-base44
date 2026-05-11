import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Devices from '@/pages/Devices';
import Clients from '@/pages/Clients';
import Networks from '@/pages/Networks';
import Security from '@/pages/Security';
import Terminal from '@/pages/Terminal';
import Chat from '@/pages/Chat';
import Settings from '@/pages/Settings';
import WiFi from '@/pages/WiFi';
import Gateway from '@/pages/Gateway';
import Insights from '@/pages/Insights';
import Zones from '@/pages/Zones';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/devices" element={<Devices />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/networks" element={<Networks />} />
        <Route path="/wifi" element={<WiFi />} />
        <Route path="/gateway" element={<Gateway />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/zones" element={<Zones />} />
        <Route path="/security" element={<Security />} />
        <Route path="/terminal" element={<Terminal />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App