import React, { useState } from "react";
import { Music, Wand2, Play, Loader2, Sparkles, Disc, Languages, Type } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { generateMusic } from "../services/musicGen";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export function MusicGeneratorScreen() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Trap");
  const [mood, setMood] = useState("Energético");
  const [language, setLanguage] = useState("Português");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const styles = ["Trap", "Funk", "LoFi", "Pop", "MPB", "Rock", "Reggaeton"];
  const moods = ["Energético", "Melancólico", "Relaxado", "Agressivo", "Romântico"];
  const languages = ["Português", "Inglês", "Espanhol"];

  const handleGenerate = async () => {
    if (!prompt) return alert("Descreva o tema da sua música!");
    setIsGenerating(true);
    setProgress(10);
    
    try {
      const fullPrompt = `${prompt}. Estilo: ${style}. Humor: ${mood}. Idioma: ${language}.`;
      setProgress(30);
      const musicData = await generateMusic(fullPrompt);
      setProgress(90);

      const newProject = {
        title: prompt.split(" ").slice(0, 3).join(" ") || "Nova Batida",
        audioUrl: musicData.audioUrl,
        style,
        mood,
        language,
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid || "anonymous",
        status: "audio_ready"
      };

      const docRef = await addDoc(collection(db, "projects"), newProject);
      setProgress(100);
      
      // Navigate to editor with the new project ID
      setTimeout(() => {
        navigate(`/editor?id=${docRef.id}`);
      }, 500);
    } catch (error: any) {
      console.error(error);
      alert("Erro ao gerar música: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="mb-12 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 rounded-full text-cyan-500 text-[10px] font-black uppercase tracking-widest mb-6"
        >
          <Sparkles size={14} /> AI Music Engine v2.0
        </motion.div>
        <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter mb-4">
          Gerador de <span className="text-cyan-500">Música</span>
        </h1>
        <p className="text-zinc-500 font-medium">Defina o vibe e deixe a IA criar a batida perfeita.</p>
      </header>

      <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 md:p-12 space-y-10">
        {/* Style Selection */}
        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Disc size={14} /> Estilo Musical
          </label>
          <div className="flex flex-wrap gap-2">
            {styles.map((s) => (
              <button
                key={s}
                onClick={() => setStyle(s)}
                className={cn(
                  "py-3 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                  style === s 
                    ? "bg-cyan-500 text-white border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.4)]" 
                    : "bg-zinc-800 text-zinc-500 border-transparent hover:border-white/10"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Mood & Language */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Wand2 size={14} /> Humor
            </label>
            <select 
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="w-full bg-zinc-800 border border-transparent rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
            >
              {moods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Languages size={14} /> Idioma
            </label>
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-zinc-800 border border-transparent rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-cyan-500 transition-colors appearance-none"
            >
              {languages.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>

        {/* Prompt Input */}
        <div className="space-y-4">
          <label className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Type size={14} /> Tema da Letra
          </label>
          <textarea 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Sobre o que é a música? Ex: Uma noite em São Paulo, superação, amor proibido..."
            className="w-full h-32 bg-zinc-800 border border-transparent rounded-2xl p-6 text-white font-medium focus:outline-none focus:border-cyan-500 transition-colors resize-none"
          />
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full group relative overflow-hidden bg-white text-black py-6 rounded-2xl font-black uppercase tracking-[0.3em] italic text-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
        >
          <div className="relative z-10 flex items-center justify-center gap-4">
            {isGenerating ? <Loader2 className="animate-spin" size={28} /> : <Music size={28} fill="currentColor" />}
            {isGenerating ? "Compondo..." : "Gerar AudioFE"}
          </div>
          
          {isGenerating && (
            <motion.div 
              className="absolute bottom-0 left-0 h-1 bg-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
