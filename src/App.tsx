import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { Music, Library, Languages, User, LogOut, Menu, X, Sparkles } from "lucide-react";
import { Logo } from "./components/Logo";
import { HomeScreen } from "./screens/HomeScreen";
import { MusicGeneratorScreen } from "./screens/MusicGeneratorScreen";
import { VideoEditorScreen } from "./screens/VideoEditorScreen";
import { SubtitleEditorScreen } from "./screens/SubtitleEditorScreen";
import { ExportScreen } from "./screens/ExportScreen";
import { Library as LibraryPage } from "./pages/Library";
import { auth, signInWithGoogle } from "./lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { cn } from "./lib/utils";
import { AnimatePresence, motion } from "framer-motion";

function Navbar() {
  const [video, setVideo] = useState<string | null>(null);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const videoURL = URL.createObjectURL(file);
    setVideo(videoURL);
  };
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const navItems = [
    { path: "/", label: "Início", icon: Music },
    { path: "/library", label: "Projetos", icon: Library },
  ];

  return (
    <>
      <input 
        type="file" 
        accept="video/*" 
        onChange={handleVideoUpload}
        className="hidden"
        id="video-upload"
      />
      <nav className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Logo className="h-10" />
          <span className="text-xl font-black text-white uppercase italic tracking-tighter">
            Audio<span className="text-cyan-500">FE</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-colors",
                location.pathname === item.path ? "text-white" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <item.icon size={14} />
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
    </>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="text-center"
            >
              <Logo className="h-32 mx-auto mb-6" />
              <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter mb-8">
                Audio<span className="text-cyan-500">FE</span>
              </h1>
              <motion.div 
                className="h-1 bg-white/10 rounded-full overflow-hidden w-64 mx-auto"
                initial={{ width: 0 }}
                animate={{ width: 256 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              >
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-black text-zinc-300 selection:bg-cyan-500 selection:text-white">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/generate-music" element={<MusicGeneratorScreen />} />
            <Route path="/editor" element={<VideoEditorScreen />} />
            <Route path="/subtitle-editor" element={<SubtitleEditorScreen />} />
            <Route path="/export" element={<ExportScreen />} />
            <Route path="/library" element={<LibraryPage />} />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="py-12 border-t border-white/5 text-center flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
            <Logo className="h-8" />
            <span className="text-xl font-black text-white uppercase italic tracking-tighter">
              Audio<span className="text-cyan-500">FE</span>
            </span>
          </div>
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">
            AudioFE © 2026 • AI Music Video Studio
          </p>
        </footer>
      </div>
    </Router>
  );
}
