import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Share2, CheckCircle2, Loader2, ChevronLeft, Instagram, Twitter, MessageCircle } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";

export function ExportScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("id");
  const videoUrl = searchParams.get("videoUrl");

  const [isDone, setIsDone] = useState(!!videoUrl);

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `lyricvibe-${projectId}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-160px)]">
      <AnimatePresence mode="wait">
        {!isDone ? (
          <motion.div
            key="exporting"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="text-center space-y-12 w-full"
          >
            <div className="relative w-48 h-48 mx-auto">
              <div className="absolute inset-0 border-4 border-zinc-900 rounded-full" />
              <motion.div 
                className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-white italic">...</span>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Renderizando</span>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Finalizando seu Clipe</h1>
              <p className="text-zinc-500 font-medium max-w-xs mx-auto">
                Isso pode levar alguns segundos dependendo do tamanho do vídeo.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-12 w-full"
          >
            <div className="relative aspect-video max-w-2xl mx-auto bg-zinc-900 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
              {videoUrl && (
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full h-full object-contain"
                  autoPlay
                />
              )}
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter">Vídeo Pronto!</h1>
              <p className="text-zinc-500 font-medium">Sua obra prima está pronta para ser compartilhada.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md mx-auto">
              <button 
                onClick={handleDownload}
                className="flex items-center justify-center gap-3 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest italic hover:scale-105 transition-all"
              >
                <Download size={24} /> Baixar MP4
              </button>
              <button className="flex items-center justify-center gap-3 py-5 bg-zinc-900 text-white border border-white/10 rounded-2xl font-black uppercase tracking-widest italic hover:scale-105 transition-all">
                <Share2 size={24} /> Compartilhar
              </button>
            </div>

            <div className="pt-12 border-t border-white/5">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-8">Compartilhar direto em</p>
              <div className="flex justify-center gap-8">
                {[Instagram, Twitter, MessageCircle].map((Icon, i) => (
                  <button key={i} className="w-16 h-16 bg-zinc-900/50 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all">
                    <Icon size={28} />
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={() => navigate("/")}
              className="text-xs font-black text-zinc-500 hover:text-white uppercase tracking-widest flex items-center gap-2 mx-auto"
            >
              <ChevronLeft size={16} /> Voltar ao Início
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
