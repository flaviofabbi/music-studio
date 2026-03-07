import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Video, 
  Search, 
  Filter, 
  Trash2, 
  Download, 
  Play,
  MoreVertical,
  Calendar,
  Layers
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export function Library() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'music' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchLibrary(user.uid);
      } else {
        setLoading(false);
      }
    });

    const fetchLibrary = async (uid: string) => {
      setLoading(true);
      try {
        const musicQuery = query(
          collection(db, 'musicas'),
          where('id_usuario', '==', uid),
          orderBy('data', 'desc')
        );
        
        const videoQuery = query(
          collection(db, 'videos'),
          where('id_usuario', '==', uid),
          orderBy('data', 'desc')
        );

        const [musicSnap, videoSnap] = await Promise.all([
          getDocs(musicQuery),
          getDocs(videoQuery)
        ]);

        const musicas = musicSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'music' }));
        const videos = videoSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'video' }));

        setItems([...musicas, ...videos].sort((a: any, b: any) => {
          const dateA = a.data?.seconds || 0;
          const dateB = b.data?.seconds || 0;
          return dateB - dateA;
        }));
      } catch (err) {
        console.error("Error fetching library:", err);
      } finally {
        setLoading(false);
      }
    };

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, type: 'music' | 'video') => {
    if (!window.confirm('Tem certeza que deseja excluir esta criação?')) return;
    try {
      await deleteDoc(doc(db, type === 'music' ? 'musicas' : 'videos', id));
      setItems(items.filter(item => item.id !== id));
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || (filter === 'music' && item.type === 'music') || (filter === 'video' && item.type === 'video');
    const matchesSearch = item.titulo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Sua Biblioteca</h2>
          <p className="text-zinc-400">Gerencie todas as suas criações em um só lugar.</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text"
              placeholder="Buscar criações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-64"
            />
          </div>
          <div className="flex bg-zinc-900/50 border border-white/10 rounded-xl p-1">
            <button 
              onClick={() => setFilter('all')}
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", filter === 'all' ? "bg-emerald-500 text-black" : "text-zinc-400 hover:text-white")}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilter('music')}
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", filter === 'music' ? "bg-emerald-500 text-black" : "text-zinc-400 hover:text-white")}
            >
              Músicas
            </button>
            <button 
              onClick={() => setFilter('video')}
              className={cn("px-4 py-1.5 rounded-lg text-xs font-bold transition-all", filter === 'video' ? "bg-emerald-500 text-black" : "text-zinc-400 hover:text-white")}
            >
              Vídeos
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500"></div>
          <p className="text-zinc-500 font-medium">Carregando sua biblioteca...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={item.id}
                className="group bg-zinc-900/40 hover:bg-zinc-900/60 border border-white/5 rounded-3xl overflow-hidden transition-all flex flex-col"
              >
                <div className="aspect-video relative overflow-hidden bg-black/40">
                  {item.type === 'music' ? (
                    <img 
                      src={item.coverArt || 'https://picsum.photos/seed/music/800/450'} 
                      alt={item.titulo} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                      <Video size={48} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                    <button className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center hover:scale-110 transition-transform">
                      <Play size={20} fill="currentColor" className="ml-1" />
                    </button>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      item.type === 'music' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" : "bg-cyan-500/20 text-cyan-400 border-cyan-500/20"
                    )}>
                      {item.type === 'music' ? 'Música' : 'Vídeo'}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {item.titulo}
                      </h4>
                      <p className="text-xs text-zinc-500 flex items-center space-x-1 mt-1">
                        <Calendar size={12} />
                        <span>{new Date(item.data?.seconds * 1000).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <button className="text-zinc-500 hover:text-white transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <div className="flex items-center space-x-3 mt-auto pt-4 border-t border-white/5">
                    <button className="flex-1 flex items-center justify-center space-x-2 bg-white/5 hover:bg-white/10 text-zinc-300 py-2 rounded-xl text-xs font-bold transition-all">
                      <Download size={14} />
                      <span>Baixar</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id, item.type)}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 bg-zinc-900/20 border-2 border-dashed border-white/5 rounded-[3rem] text-center">
          <div className="w-20 h-20 rounded-3xl bg-zinc-900 flex items-center justify-center text-zinc-700 mb-6">
            <Layers size={40} />
          </div>
          <h3 className="text-xl font-bold text-zinc-400 mb-2">Sua biblioteca está vazia</h3>
          <p className="text-zinc-600 max-w-xs mb-8">
            Você ainda não criou nenhuma música ou traduziu vídeos. Comece agora!
          </p>
        </div>
      )}
    </div>
  );
}
