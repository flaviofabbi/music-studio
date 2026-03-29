import React from "react";
import { motion } from "framer-motion";
import { Music, Video, Folder, Sparkles, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";

export function HomeScreen() {
  const navigate = useNavigate();

  const menuItems = [
    {
      title: "Criar Música",
      description: "Gere batidas e letras com IA",
      icon: Music,
      color: "from-cyan-600 to-blue-600",
      path: "/generate-music",
      delay: 0.1
    },
    {
      title: "Importar Vídeo",
      description: "Adicione legendas ao seu clipe",
      icon: Video,
      color: "from-cyan-500 to-blue-600",
      path: "/editor",
      delay: 0.2
    },
    {
      title: "Projetos",
      description: "Veja suas criações salvas",
      icon: Folder,
      color: "from-zinc-700 to-zinc-900",
      path: "/library",
      delay: 0.3
    }
  ];

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <Logo className="h-24 mx-auto mb-6" />
        <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-4">
          Audio<span className="text-cyan-500">FE</span>
        </h1>
        <p className="text-zinc-500 font-medium max-w-md mx-auto">
          A próxima geração de vídeos musicais. Crie, sincronize e compartilhe em segundos.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {menuItems.map((item) => (
          <motion.button
            key={item.path}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: item.delay }}
            onClick={() => navigate(item.path)}
            className="group relative overflow-hidden bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] text-left hover:border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className={item.color + " w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"}>
              <item.icon className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-black text-white uppercase italic mb-2 tracking-tight">
              {item.title}
            </h3>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">
              {item.description}
            </p>
            
            <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="text-white/20" size={24} />
            </div>
          </motion.button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-20 flex items-center gap-8"
      >
        <div className="flex -space-x-3">
          {[1, 2, 3, 4].map((i) => (
            <img 
              key={i}
              src={`https://picsum.photos/seed/${i + 10}/100/100`} 
              className="w-10 h-10 rounded-full border-2 border-black object-cover"
              alt="User"
            />
          ))}
        </div>
        <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">
          +10k criadores usando AudioFE
        </p>
      </motion.div>
    </div>
  );
}
