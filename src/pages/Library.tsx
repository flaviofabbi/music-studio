import React, { useEffect, useState } from "react";
import { Library as LibraryIcon, Search, Filter, Music, Play } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { MusicCard } from "../components/MusicCard";
import { MusicPlayer } from "../components/MusicPlayer";

export function Library() {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSong, setActiveSong] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "songs"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const songsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSongs(songsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.style.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 pb-40">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              <LibraryIcon className="text-white" size={24} />
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">Minha Biblioteca</h1>
          </div>
          <p className="text-zinc-500 font-medium">Suas criações salvas no AudioFE.</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar músicas ou estilos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Carregando sua coleção...</p>
        </div>
      ) : filteredSongs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSongs.map((song) => (
            <MusicCard 
              key={song.id} 
              song={song} 
              onPlay={() => setActiveSong(song)}
              isActive={activeSong?.id === song.id}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center">
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700">
            <Music size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Nenhuma música encontrada</h3>
            <p className="text-zinc-500 max-w-xs mx-auto">Comece a criar suas próprias músicas agora mesmo no estúdio!</p>
          </div>
          <a href="/" className="px-8 py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform">
            Ir para o Estúdio
          </a>
        </div>
      )}

      <MusicPlayer song={activeSong} onClose={() => setActiveSong(null)} />
    </div>
  );
}
