import React, { useState, useEffect } from 'react';
import { 
  Music, 
  Video, 
  History, 
  Plus, 
  ArrowRight, 
  Play, 
  Download,
  Clock,
  Star,
  AlertCircle,
  FileText,
  Globe,
  Captions,
  Mic2
} from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({ 
    musicCount: 0, 
    videoCount: 0, 
    lyricsCount: 0,
    transcriptionCount: 0, 
    subtitleCount: 0,
    languagesCount: 0,
    dubbingCount: 0
  });
  const [recentCreations, setRecentCreations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchDashboardData(user.uid);
      } else {
        setLoading(false);
      }
    });

    const fetchDashboardData = async (uid: string) => {
      setError(null);
      try {
        const musicQuery = query(
          collection(db, 'musicas'),
          where('id_usuario', '==', uid),
          orderBy('data', 'desc'),
          limit(5)
        );
        
        const videoQuery = query(
          collection(db, 'videos'),
          where('id_usuario', '==', uid),
          orderBy('data', 'desc'),
          limit(5)
        );

        const transQuery = query(
          collection(db, 'transcricoes'),
          where('id_usuario', '==', uid)
        );

        const subQuery = query(
          collection(db, 'legendas'),
          where('id_usuario', '==', uid)
        );

        const dubQuery = query(
          collection(db, 'dublagens'),
          where('id_usuario', '==', uid)
        );

        const lyricsQuery = query(
          collection(db, 'letras'),
          where('id_usuario', '==', uid)
        );

        const [musicSnap, videoSnap, lyricsSnap, transSnap, subSnap, dubSnap] = await Promise.all([
          getDocs(musicQuery),
          getDocs(videoQuery),
          getDocs(lyricsQuery),
          getDocs(transQuery),
          getDocs(subQuery),
          getDocs(dubQuery)
        ]);

        // Count unique languages from transcriptions
        const languages = new Set();
        transSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.idioma) languages.add(data.idioma);
        });

        const musicas = musicSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'music' }));
        const videos = videoSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'video' }));

        setRecentCreations([...musicas, ...videos].sort((a: any, b: any) => {
          const dateA = a.data?.seconds || a.data_criacao?.seconds || 0;
          const dateB = b.data?.seconds || b.data_criacao?.seconds || 0;
          return dateB - dateA;
        }).slice(0, 5));
        
        setStats({
          musicCount: musicSnap.size,
          videoCount: videoSnap.size,
          lyricsCount: lyricsSnap.size,
          transcriptionCount: transSnap.size,
          subtitleCount: subSnap.size,
          languagesCount: languages.size || 1,
          dubbingCount: dubSnap.size
        });
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        if (err.message.includes('permission')) {
          setError("Acesso Negado: Verifique as Regras do Firestore no Console do Firebase.");
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-emerald-600 to-cyan-600 p-12">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              O futuro da criação musical está aqui.
            </h2>
            <p className="text-emerald-50/80 text-lg mb-8">
              Gere músicas completas, letras e traduza vídeos com inteligência artificial de ponta.
            </p>
            <div className="flex space-x-4">
              <button 
                onClick={() => onNavigate('create-music')}
                className="bg-white text-emerald-600 px-8 py-4 rounded-2xl font-bold flex items-center space-x-2 hover:scale-105 transition-transform"
              >
                <Plus size={20} />
                <span>Criar Música</span>
              </button>
              <button 
                onClick={() => onNavigate('create-lyrics')}
                className="bg-emerald-700/30 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-bold flex items-center space-x-2 hover:bg-emerald-700/40 transition-all"
              >
                <FileText size={20} />
                <span>Criar Letra</span>
              </button>
              <button 
                onClick={() => onNavigate('translate-video')}
                className="bg-zinc-800/50 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-bold flex items-center space-x-2 hover:bg-zinc-800/60 transition-all"
              >
                <Video size={20} />
                <span>Traduzir Vídeo</span>
              </button>
            </div>
          </div>
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none">
            <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-10 right-40 w-48 h-48 bg-cyan-300 rounded-full blur-3xl"></div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex items-start space-x-4">
          <AlertCircle className="text-red-500 flex-shrink-0" />
          <div>
            <h4 className="text-red-500 font-bold mb-1">Erro de Permissão no Firestore</h4>
            <p className="text-red-500/70 text-sm">
              O banco de dados está bloqueado. Para corrigir: <br />
              1. Vá no Console do Firebase &gt; Firestore &gt; Rules. <br />
              2. Publique as regras que permitem acesso ao usuário logado. <br />
              3. Verifique se há um link de criação de índice no Console (F12) do navegador.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Music size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">+12%</span>
          </div>
          <p className="text-zinc-400 text-sm font-medium mb-1">Músicas Geradas</p>
          <h3 className="text-3xl font-bold">{stats.musicCount}</h3>
        </div>
        
        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Captions size={24} />
            </div>
            <span className="text-xs font-bold text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded-full">+{stats.videoCount}</span>
          </div>
          <p className="text-zinc-400 text-sm font-medium mb-1">Legendas Geradas</p>
          <h3 className="text-3xl font-bold">{stats.videoCount}</h3>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Globe size={24} />
            </div>
            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full">{stats.languagesCount} Idiomas</span>
          </div>
          <p className="text-zinc-400 text-sm font-medium mb-1">Traduções Realizadas</p>
          <h3 className="text-3xl font-bold">{stats.subtitleCount}</h3>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <Mic2 size={24} />
            </div>
            <span className="text-xs font-bold text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded-full">+{stats.dubbingCount}</span>
          </div>
          <p className="text-zinc-400 text-sm font-medium mb-1">Dublagens Criadas</p>
          <h3 className="text-3xl font-bold">{stats.dubbingCount}</h3>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <FileText size={24} />
            </div>
            <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full">+{stats.lyricsCount}</span>
          </div>
          <p className="text-zinc-400 text-sm font-medium mb-1">Letras Compostas</p>
          <h3 className="text-3xl font-bold">{stats.lyricsCount}</h3>
        </div>
      </div>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold flex items-center space-x-3">
            <Clock className="text-emerald-500" />
            <span>Atividade Recente</span>
          </h3>
          <button 
            onClick={() => onNavigate('library')}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-bold flex items-center space-x-1"
          >
            <span>Ver tudo</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-emerald-500"></div>
            </div>
          ) : recentCreations.length > 0 ? (
            recentCreations.map((item) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={item.id}
                className="group bg-zinc-900/30 hover:bg-zinc-900/60 border border-white/5 p-4 rounded-2xl flex items-center justify-between transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    item.type === 'music' ? "bg-emerald-500/10 text-emerald-500" : "bg-cyan-500/10 text-cyan-500"
                  )}>
                    {item.type === 'music' ? <Music size={20} /> : <Captions size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors">{item.titulo || item.nome_arquivo}</h4>
                    <p className="text-xs text-zinc-500">{item.tipo} • {new Date((item.data?.seconds || item.data_criacao?.seconds) * 1000).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                    <Play size={18} />
                  </button>
                  <button className="p-2 text-zinc-400 hover:text-white transition-colors">
                    <Download size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-zinc-900/20 border border-dashed border-white/10 rounded-3xl">
              <p className="text-zinc-500">Nenhuma criação encontrada. Comece a criar agora!</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
