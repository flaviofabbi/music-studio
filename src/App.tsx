import React, { useState, useEffect } from 'react';
import { auth } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { CreateMusic } from './pages/CreateMusic';
import { CreateLyrics } from './pages/CreateLyrics';
import { TranslateVideo } from './pages/TranslateVideo';
import { Library } from './pages/Library';
import { Admin } from './pages/Admin';
import { Login } from './pages/Login';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    const handleBypass = (e: any) => {
      setUser(e.detail);
      setLoading(false);
    };

    window.addEventListener('auth:bypass', handleBypass);
    
    // Safety timeout: if loading takes more than 5 seconds, stop it
    const timeout = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      window.removeEventListener('auth:bypass', handleBypass);
      clearTimeout(timeout);
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        <p className="text-zinc-500 text-sm animate-pulse">Iniciando sistema...</p>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'create-music':
        return <CreateMusic />;
      case 'create-lyrics':
        return <CreateLyrics />;
      case 'translate-video':
        return <TranslateVideo />;
      case 'library':
        return <Library />;
      case 'admin':
        return <Admin />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout user={user} currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}
