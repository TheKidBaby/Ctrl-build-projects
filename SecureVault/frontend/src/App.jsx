import { useState, useEffect } from 'react';
import { useVaultStore } from './stores/vaultStore';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';

export default function App() {
  const { isAuthenticated, theme } = useVaultStore();
  const [authMode, setAuthMode] = useState('login');
  const [, setTick] = useState(0);

  useEffect(() => {
    const handler = () => setTick(t => t + 1);
    window.addEventListener('theme-change', handler);
    return () => window.removeEventListener('theme-change', handler);
  }, []);

  if (!isAuthenticated) {
    return authMode === 'login'
      ? <Login onSwitchToRegister={() => setAuthMode('register')} />
      : <Register onSwitchToLogin={() => setAuthMode('login')} />;
  }
  return <Dashboard />;
}
