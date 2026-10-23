import { useCallback, useEffect, useState } from 'react';
import api, { getData, setAccessToken } from './services/api.js';
import { navigation } from './constants/navigation.js';
import Sidebar from './components/layout/Sidebar.jsx';
import DashboardPage from './Pages/DashboardPage.jsx';
import ResourcePage from './Pages/ResourcePage.jsx';
import PowerBIPage from './Pages/PowerBIPage.jsx';
import AuthPage from './Pages/AuthPage.jsx';

function AppShell({ active, setActive, user, onSignOut, children, toast }) {
  const pageName = navigation.find((item) => item.id === active)?.label || active;
  return (
    <div className="app-shell">
      <Sidebar active={active} setActive={setActive} />
      <main className="main-area">
        <header className="topbar">
          <div className="crumb">
            <span>Workspace</span><b>/</b><strong>{pageName}</strong>
          </div>
          <div className="top-actions">
            <span className="connection"><i /> API connected</span>
            <button className="icon-button" aria-label="Sign out" title="Sign out" onClick={onSignOut}>↪</button>
            <div className="avatar top-avatar" title={user.email}>{user.name.slice(0, 2).toUpperCase()}</div>
          </div>
        </header>
        <div className="page-content">{children}</div>
        <footer className="footer">
          <span>© 2026 SubSentry</span>
          <span>Subscription intelligence, made clear <b>✳</b></span>
        </footer>
      </main>
      {toast && <div className={`toast ${toast.isError ? 'toast-error' : ''}`}>{toast.isError ? '!' : '✓'} &nbsp;{toast.message}</div>}
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);

  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSummary(await getData('/analytics/summary'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.post('/auth/refresh', {})
      .then(({ data }) => {
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
      })
      .catch(() => {})
      .finally(() => setSessionReady(true));
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const timer = window.setTimeout(() => { void refreshDashboard(); }, 0);
    return () => window.clearTimeout(timer);
  }, [user, refreshDashboard]);

  useEffect(() => {
    const expireSession = () => setUser(null);
    window.addEventListener('session-expired', expireSession);
    return () => window.removeEventListener('session-expired', expireSession);
  }, []);

  useEffect(() => {
    const handleNavigation = (event) => setActive(event.detail);
    window.addEventListener('navigate', handleNavigation);
    return () => window.removeEventListener('navigate', handleNavigation);
  }, []);

  const notify = (message, isError = false) => {
    setToast({ message, isError });
    window.setTimeout(() => setToast(null), 3200);
  };

  const signOut = async () => {
    try {
      await api.post('/auth/logout', {});
    } finally {
      setAccessToken('');
      setUser(null);
      setSummary(null);
    }
  };

  if (!sessionReady) {
    return <main className="auth-page"><div className="auth-loading">SubSentry <span>✳</span></div></main>;
  }
  if (!user) return <AuthPage onAuthenticated={setUser} />;

  let page;
  if (active === 'dashboard') {
    page = <DashboardPage summary={summary} loading={loading} error={error} onRefresh={refreshDashboard} />;
  } else if (active === 'powerbi') {
    page = <PowerBIPage notify={notify} />;
  } else {
    page = <ResourcePage key={active} section={active} notify={notify} />;
  }

  return (
    <AppShell active={active} setActive={setActive} user={user} onSignOut={signOut} toast={toast}>
      {page}
    </AppShell>
  );
}
