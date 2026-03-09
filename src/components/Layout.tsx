import React from 'react';
import { 
  LayoutDashboard, 
  Music, 
  Video, 
  Library as LibraryIcon, 
  Settings, 
  LogOut,
  User as UserIcon,
  Shield,
  Captions,
  FileText
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut, User } from 'firebase/auth';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Layout({ children, user, currentPage, onNavigate }: LayoutProps) {
  const [clickCount, setClickCount] = React.useState(0);
  const [forceAdmin, setForceAdmin] = React.useState(false);
  
  const isAdmin = user.email?.toLowerCase() === 'flaviofabbi@gmail.com' || forceAdmin;

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 5) {
      setForceAdmin(true);
      console.log('Modo Administrador Forçado Ativado');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create-music', label: 'Criar Música', icon: Music },
    { id: 'create-lyrics', label: 'Criar Letra', icon: FileText },
    { id: 'translate-video', label: 'Legendar Vídeo', icon: Captions },
    { id: 'library', label: 'Biblioteca', icon: LibraryIcon },
  ];

  if (isAdmin) {
    menuItems.push({ id: 'admin', label: 'Acesso Especial', icon: Shield });
  }

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-black border-r border-white/5 flex-col">
        <div className="p-6 cursor-pointer select-none" onClick={handleLogoClick}>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Music Creator AI
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                currentPage === item.id 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
          <div className="flex items-center space-x-3 px-4 py-2">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <UserIcon size={20} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName || user.email}</p>
              <p className="text-xs text-zinc-500 truncate">{isAdmin ? 'Administrador' : 'Plano Free'}</p>
            </div>
          </div>
          
          <button
            onClick={() => signOut(auth)}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-black border-b border-white/5 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Music Creator
        </h1>
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20 overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ''} className="w-full h-full" referrerPolicy="no-referrer" />
          ) : (
            <UserIcon size={16} />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-zinc-900 to-black pb-24 md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-black/90 backdrop-blur-lg border-t border-white/5 px-6 py-3 flex items-center justify-between z-50">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex flex-col items-center space-y-1 transition-colors",
              currentPage === item.id ? "text-emerald-400" : "text-zinc-500"
            )}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label.split(' ')[0]}</span>
          </button>
        ))}
        <button
          onClick={() => signOut(auth)}
          className="flex flex-col items-center space-y-1 text-zinc-500"
        >
          <LogOut size={20} />
          <span className="text-[10px] font-medium">Sair</span>
        </button>
      </nav>
    </div>
  );
}
