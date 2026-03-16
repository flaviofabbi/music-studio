import React, { useState } from "react";
import { Music, Wand2, Play, Loader2, Sparkles, Disc, Mic2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { LyricsEditor } from "../components/LyricsEditor";
import { generateMusic } from "../services/musicGen";
import { generateLyrics, generateCoverArt } from "../lib/gemini";
import { db, auth } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export function CreateMusic() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Pop");
  const [lyrics, setLyrics] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  const styles = ["Pop", "Rock", "Sertanejo", "Gospel", "Eletrônico", "Funk", "Trap", "Jazz"];

  const handleGenerateLyrics = async () => {
    if (!prompt) return alert("Insira um tema ou descrição primeiro!");
    setIsGeneratingLyrics(true);
    try {
      const data = await generateLyrics(prompt, style);
      setLyrics(data.lyrics);
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar letra.");
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const handleGenerateMusic = async () => {
    if (!prompt) return alert("Descreva sua música!");
    setIsGenerating(true);
    setProgress(10);
    
    try {
      // 1. Generate Cover Art
      setProgress(20);
      const coverUrl = await generateCoverArt(prompt);
      
      // 2. Generate Music
      setProgress(40);
      const musicData = await generateMusic(`${prompt}. Style: ${style}. Lyrics: ${lyrics.substring(0, 200)}`);
      setProgress(90);

      const newSong = {
        title: prompt.split(" ").slice(0, 3).join(" ") || "Nova Música",
        artist: auth.currentUser?.displayName || "AudioFE Artist",
        audioUrl: musicData.audioUrl,
        coverUrl: coverUrl || "https://picsum.photos/seed/music/800/800",
        style,
        lyrics,
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid || "anonymous"
      };

      // 3. Save to Firebase
      await addDoc(collection(db, "songs"), newSong);
      
      setResult(newSong);
      setProgress(100);
    } catch (error: any) {
      console.error(error);
      alert("Erro ao gerar música: " + error.message);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 pb-32">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Column: Controls */}
        <div className="flex-1 space-y-8">
          <header className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Music className="text-white" size={24} />
              </div>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">Criar Música</h1>
            </div>
            <p className="text-zinc-500 font-medium">Transforme suas ideias em som profissional com IA.</p>
          </header>

          <div className="space-y-6">
            {/* Prompt Input */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Sparkles size={14} /> Descrição da Música
              </label>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Uma música pop energética sobre superação com sintetizadores modernos..."
                className="w-full h-32 bg-zinc-900 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-white/30 transition-colors resize-none"
              />
            </div>

            {/* Style Selection */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Disc size={14} /> Estilo Musical
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {styles.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyle(s)}
                    className={cn(
                      "py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest border transition-all",
                      style === s 
                        ? "bg-white text-black border-white" 
                        : "bg-zinc-900 text-zinc-500 border-white/5 hover:border-white/20"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-4">
              <button
                onClick={handleGenerateMusic}
                disabled={isGenerating}
                className="w-full group relative overflow-hidden bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] italic text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Play size={24} fill="currentColor" />}
                  {isGenerating ? "Criando sua Obra..." : "Gerar Música"}
                </div>
                {isGenerating && (
                  <motion.div 
                    className="absolute bottom-0 left-0 h-1 bg-zinc-300"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Lyrics Editor */}
        <div className="w-full lg:w-[400px] h-full">
          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 h-full">
            <LyricsEditor 
              lyrics={lyrics}
              onChange={setLyrics}
              onGenerate={handleGenerateLyrics}
              isGenerating={isGeneratingLyrics}
            />
          </div>
        </div>
      </div>

      {/* Result Preview */}
      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 p-8 bg-zinc-900/80 border border-white/10 rounded-[2rem] flex flex-col md:flex-row items-center gap-8"
          >
            <img src={result.coverUrl} className="w-48 h-48 rounded-2xl shadow-2xl object-cover" alt="Cover" />
            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <h2 className="text-3xl font-black text-white uppercase italic">{result.title}</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">{result.style} • {result.artist}</p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <button className="px-6 py-3 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-zinc-200 transition-colors">
                  <Play size={16} fill="currentColor" /> Tocar Agora
                </button>
                <a href={result.audioUrl} download className="px-6 py-3 bg-zinc-800 text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-zinc-700 transition-colors">
                  Baixar MP3
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
