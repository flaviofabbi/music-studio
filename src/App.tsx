import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { Music, Library, Languages, User, LogOut, Menu, X } from "lucide-react";
import { CreateMusic } from "./pages/CreateMusic";
import { Library as LibraryPage } from "./pages/Library";
import { VideoSubtitle } from "./pages/VideoSubtitle";
import { auth, signInWithGoogle } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { cn } from "./lib/utils";

function Navbar() {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const navItems = [
    { path: "/", label: "Estúdio", icon: Music },
    { path: "/library", label: "Biblioteca", icon: Library },
    { path: "/subtitles", label: "Legendas", icon: Languages },
  ];

  return (
    <nav className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Music size={24} fill="currentColor" />
          </div>
          <span className="text-2xl font-black text-white uppercase tracking-tighter italic">AudioFE</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] transition-colors",
                location.pathname === item.path ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{user.displayName}</span>
                <button onClick={() => signOut(auth)} className="text-[8px] font-bold text-zinc-500 hover:text-red-500 uppercase tracking-widest">Sair</button>
              </div>
              <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-xl border border-white/10" />
            </div>
          ) : (
            <button 
              onClick={signInWithGoogle}
              className="px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform"
            >
              Entrar
            </button>
          )}
          
          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-zinc-900 border-b border-white/5 overflow-hidden"
          >
            <div className="px-4 py-8 flex flex-col gap-6">
              {navItems.map((item) => (
                <Link 
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-4 text-lg font-black uppercase tracking-widest",
                    location.pathname === item.path ? "text-white" : "text-zinc-500"
                  )}
                >
                  <item.icon size={24} />
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

import { AnimatePresence, motion } from "framer-motion";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-zinc-300 selection:bg-white selection:text-black">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<CreateMusic />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/subtitles" element={<VideoSubtitle />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="py-12 border-t border-white/5 text-center">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">
            AudioFE © 2026 • Fellipe AI Music Studio
          </p>
        </footer>
      </div>
    </Router>
  );
}
