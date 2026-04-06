import { useState, useEffect } from 'react';
import { useVaultStore } from './stores/vaultStore';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';

function App() {
  const { isAuthenticated, theme } = useVaultStore();
  const [authMode, setAuthMode] = useState('login');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (!isAuthenticated) {
    if (authMode === 'login') {
      return <Login onSwitchToRegister={() => setAuthMode('register')} />;
    }
    return <Register onSwitchToLogin={() => setAuthMode('login')} />;
  }

  return <Dashboard />;
}

export default App;
