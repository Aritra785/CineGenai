
import React, { useState, useEffect } from 'react';
import { AppState, CreditState } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<AppState>(AppState.LOGIN);
  const [credits, setCredits] = useState<CreditState>({ remaining: 300, isInfinite: false });

  useEffect(() => {
    const savedCredits = localStorage.getItem('cinegen_credits');
    const savedInfinite = localStorage.getItem('cinegen_infinite') === 'true';
    
    if (savedInfinite) {
      setCredits({ remaining: 999999, isInfinite: true });
    } else if (savedCredits) {
      setCredits({ remaining: parseInt(savedCredits, 10), isInfinite: false });
    } else {
      localStorage.setItem('cinegen_credits', '300');
    }
  }, []);

  const updateCredits = (amount: number) => {
    setCredits(prev => {
      if (prev.isInfinite) return prev;
      const newVal = Math.max(0, prev.remaining + amount);
      localStorage.setItem('cinegen_credits', newVal.toString());
      return { ...prev, remaining: newVal };
    });
  };

  const handleLogin = (mode: 'dev' | 'key' | 'random') => {
    if (mode === 'dev') {
      const devState = { remaining: 999999, isInfinite: true };
      setCredits(devState);
      localStorage.setItem('cinegen_infinite', 'true');
    } else {
      localStorage.setItem('cinegen_infinite', 'false');
      // Keep existing credits or reset if it's the first time
      const current = localStorage.getItem('cinegen_credits') || '300';
      setCredits({ remaining: parseInt(current, 10), isInfinite: false });
    }
    setCurrentPage(AppState.DASHBOARD);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500 selection:text-white font-sans">
      {currentPage === AppState.LOGIN ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Dashboard credits={credits} updateCredits={updateCredits} />
      )}
    </div>
  );
};

export default App;
