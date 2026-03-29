import React, { useEffect, useState } from "react";
import { Library as LibraryIcon, Search, Music, Video, Calendar, Trash2 } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

export function Library() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "projects"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Deseja excluir este projeto?")) {
      await deleteDoc(doc(db, "projects", id));
    }
  };

  const filteredProjects = projects.filter(p => 
    p.prompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.style?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 pb-40">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center">
              <LibraryIcon className="text-cyan-500" size={28} />
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">Meus Projetos</h1>
          </div>
          <p className="text-zinc-500 font-medium">Sua coleção de vídeos musicais AudioFE.</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar projetos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
          />
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 border-4 border-white/5 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-zinc-500 font-black uppercase tracking-[0.2em] text-[10px]">Sincronizando biblioteca...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div 
              key={project.id}
              onClick={() => navigate(`/editor?id=${project.id}`)}
              className="group relative bg-zinc-900/50 border border-white/5 rounded-[2rem] overflow-hidden cursor-pointer hover:border-cyan-500/30 transition-all hover:scale-[1.02]"
            >
              <div className="aspect-video bg-zinc-800 relative overflow-hidden">
                {project.coverUrl ? (
                  <img src={project.coverUrl} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" alt="" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="text-zinc-700" size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <div className="px-3 py-1 bg-cyan-500/20 backdrop-blur-md border border-cyan-500/30 rounded-full text-[8px] font-black text-cyan-400 uppercase tracking-widest">
                    {project.style || 'Original'}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="text-sm font-black text-white uppercase italic tracking-tight line-clamp-1">
                      {project.prompt || 'Sem título'}
                    </h3>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                      <Calendar size={10} />
                      {project.createdAt?.toDate ? project.createdAt.toDate().toLocaleDateString('pt-BR') : 'Recente'}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, project.id)}
                    className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                    <Music size={10} /> {project.audioUrl ? 'Áudio OK' : 'Sem áudio'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                    <Video size={10} /> {project.videoUrl ? 'Vídeo OK' : 'Sem vídeo'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 space-y-6 text-center">
          <div className="w-24 h-24 bg-zinc-900/50 rounded-[2rem] flex items-center justify-center text-zinc-800">
            <Music size={48} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Sua biblioteca está vazia</h3>
            <p className="text-zinc-500 font-medium max-w-xs mx-auto">Crie seu primeiro vídeo musical com IA agora mesmo.</p>
          </div>
          <button 
            onClick={() => navigate("/generate-music")}
            className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest italic hover:scale-105 transition-all"
          >
            Começar Criação
          </button>
        </div>
      )}
    </div>
  );
}
