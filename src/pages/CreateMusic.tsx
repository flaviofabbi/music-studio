import React, { useState } from 'react';
import { 
  Music, 
  Sparkles, 
  Mic2, 
  Clock, 
  Globe, 
  Heart,
  Play,
  Pause,
  Download,
  FileText,
  Image as  ImageIcon,
  RotateCcw,
  Share2,
  X,
  Wand2,
  Type as TypeIcon,
  Music2,
  Loader2,
  Copy,
  Check,
  Instagram
} from 'lucide-react';
import { generateLyrics, generateCoverArt, generateSpeech, optimizeLyrics, generateSocialCaption, translateLyrics } from '../lib/gemini';
import { db, auth, storage } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export function CreateMusic() {
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualLyrics, setManualLyrics] = useState('');
  const [socialCaption, setSocialCaption] = useState<string | null>(null);
  const [generatingCaption, setGeneratingCaption] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [formData, setFormData] = useState({
    theme: '',
    style: 'Pop',
    mood: 'Feliz',
    language: 'Português',
    duration: '3:00',
    voiceType: 'Feminina',
    customLyrics: ''
  });

  const styles = ['Pop', 'Rap', 'Trap', 'Sertanejo', 'Funk', 'Rock', 'Gospel', 'Eletrônica'];
  const moods = ['Romântico', 'Triste', 'Motivacional', 'Feliz', 'Épico'];

  const optimizationOptions = [
    { id: 'rhyme', label: 'Melhorar Rimas', icon: Music2, instruction: 'Melhore as rimas e a métrica da letra.' },
    { id: 'poetic', label: 'Mais Poético', icon: Sparkles, instruction: 'Torne a letra mais poética e profunda.' },
    { id: 'slang', label: 'Adicionar Gírias', icon: Mic2, instruction: 'Adicione gírias e expressões urbanas atuais.' },
    { id: 'shorten', label: 'Encurtar', icon: TypeIcon, instruction: 'Encurte a letra mantendo a mensagem principal.' },
  ];

  const handleOptimize = async (instruction: string) => {
    if (!result?.lyrics) return;
    setOptimizing(true);
    try {
      const currentLyricsText = result.lyrics.map((s: any) => `[${s.section}]\n${s.content}`).join('\n\n');
      const optimized = await optimizeLyrics(currentLyricsText, instruction);
      setResult({ ...result, ...optimized });
    } catch (err) {
      console.error("Error optimizing lyrics:", err);
    } finally {
      setOptimizing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualLyrics) return;
    setLoading(true);
    setShowManualModal(false);
    try {
      // Parse manual lyrics into sections if possible, or just one big section
      const sections = manualLyrics.split('\n\n').map(block => {
        const lines = block.split('\n');
        const firstLine = lines[0].trim();
        if (firstLine.startsWith('[') && firstLine.endsWith(']')) {
          return { section: firstLine.slice(1, -1), content: lines.slice(1).join('\n') };
        }
        return { section: 'Verso', content: block };
      });

      const lyricsData = {
        title: 'Minha Composição',
        lyrics: sections
      };

      const coverArt = await generateCoverArt(formData.theme || 'Música', formData.style);
      const fullText = sections.map(s => s.content).join(' ');
      const audio = await generateSpeech(fullText.substring(0, 500));

      setResult({ ...lyricsData, coverArt, audio, style: formData.style, duration: formData.duration });
      setAudioUrl(audio);
    } catch (err) {
      console.error("Error processing manual lyrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCaption = async () => {
    if (!result?.lyrics) return;
    setGeneratingCaption(true);
    try {
      const fullLyrics = result.lyrics.map((s: any) => s.content).join('\n');
      const caption = await generateSocialCaption(result.title, fullLyrics, result.style);
      setSocialCaption(caption || '');
    } catch (err) {
      console.error("Error generating caption:", err);
    } finally {
      setGeneratingCaption(false);
    }
  };

  const handleTranslate = async () => {
    if (!result?.lyrics) return;
    setTranslating(true);
    try {
      const currentLyricsText = result.lyrics.map((s: any) => `[${s.section}]\n${s.content}`).join('\n\n');
      const translated = await translateLyrics(currentLyricsText, 'Português');
      setResult({ ...result, ...translated });
    } catch (err) {
      console.error("Error translating lyrics:", err);
    } finally {
      setTranslating(false);
    }
  };

  const handleCopyLyrics = () => {
    if (!result?.lyrics) return;
    const fullLyrics = result.lyrics.map((s: any) => `[${s.section}]\n${s.content}`).join('\n\n');
    navigator.clipboard.writeText(fullLyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerate = async () => {
    if (!formData.theme) return;
    setLoading(true);
    setResult(null);
    setAudioUrl(null);

    try {
      // 1. Generate Lyrics
      const lyricsData = await generateLyrics({
        theme: formData.theme,
        style: formData.style,
        mood: formData.mood,
        language: formData.language
      });

      // 2. Generate Cover Art
      const coverArt = await generateCoverArt(formData.theme, formData.style);

      // 3. Generate "Music" (using TTS for the lyrics as a proxy for now)
      const fullText = lyricsData.lyrics.map((s: any) => s.content).join(' ');
      const audio = await generateSpeech(fullText.substring(0, 500)); // Limit for demo

      const musicResult = {
        ...lyricsData,
        coverArt,
        audio,
        style: formData.style,
        duration: formData.duration
      };

      setResult(musicResult);
      setAudioUrl(audio);

      // 4. Save to Firestore
      if (auth.currentUser) {
        await addDoc(collection(db, 'musicas'), {
          id_usuario: auth.currentUser.uid,
          titulo: lyricsData.title,
          tema: formData.theme,
          estilo: formData.style,
          humor: formData.mood,
          idioma: formData.language,
          data: serverTimestamp(),
          tipo: 'Música IA',
          coverArt,
          audioUrl: audio
        });
      }
    } catch (err) {
      console.error("Error generating music:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Criar Música</h2>
          <p className="text-zinc-400">Transforme suas ideias em melodias com o poder da IA.</p>
        </div>
        <div className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full border border-emerald-500/20">
          <Sparkles size={16} />
          <span className="text-sm font-bold">Modo Criativo Ativo</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Tema da Música</label>
              <textarea
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                placeholder="Ex: Uma canção sobre superação e novos começos no verão..."
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-32 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Estilo</label>
                <select
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                >
                  {styles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Humor</label>
                <select
                  value={formData.mood}
                  onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                >
                  {moods.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Voz</label>
                <div className="flex bg-black/50 border border-white/10 rounded-xl p-1">
                  {['Masc', 'Fem'].map(v => (
                    <button
                      key={v}
                      onClick={() => setFormData({ ...formData, voiceType: v === 'Masc' ? 'Masculina' : 'Feminina' })}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                        (formData.voiceType.startsWith(v)) ? "bg-emerald-500 text-black" : "text-zinc-400 hover:text-white"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Idioma</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none"
                >
                  <option value="Português">Português</option>
                  <option value="Inglês">Inglês</option>
                  <option value="Espanhol">Espanhol</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !formData.theme}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-black"></div>
                  <span>Compondo...</span>
                </>
              ) : (
                <>
                  <Music size={20} />
                  <span>GERAR MÚSICA</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowManualModal(true)}
              className="w-full bg-white/5 hover:bg-white/10 text-zinc-300 font-bold py-3 rounded-2xl flex items-center justify-center space-x-2 transition-all border border-white/10"
            >
              <FileText size={18} />
              <span>Inserir Letra Manualmente</span>
            </button>
          </div>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-full"
              >
                {/* Player Header */}
                <div className="p-8 bg-gradient-to-b from-emerald-500/10 to-transparent">
                  <div className="flex items-start space-x-6">
                    <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0">
                      <img src={result.coverArt} alt="Cover" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-emerald-400 mb-2">
                        <Sparkles size={14} />
                        <span className="text-xs font-bold uppercase tracking-wider">AI Generated Masterpiece</span>
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-2">{result.title}</h3>
                      <div className="flex items-center space-x-4 text-zinc-400 text-sm">
                        <span className="flex items-center space-x-1">
                          <Mic2 size={14} />
                          <span>{formData.voiceType}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{result.duration}</span>
                        </span>
                        <span className="px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold uppercase border border-white/10">
                          {result.style}
                        </span>
                      </div>
                      
                      <div className="mt-6 flex items-center space-x-4">
                        <button 
                          onClick={() => setIsPlaying(!isPlaying)}
                          className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center text-black hover:scale-105 transition-transform"
                        >
                          {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                        </button>
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: isPlaying ? '100%' : '0%' }}
                            transition={{ duration: 30, ease: "linear" }}
                            className="h-full bg-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optimization Bar */}
                <div className="px-8 py-4 bg-black/20 border-y border-white/5 overflow-x-auto scrollbar-hide">
                  <div className="flex items-center space-x-3 min-w-max">
                    <div className="flex items-center space-x-2 text-zinc-500 mr-2">
                      <Wand2 size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Otimizar:</span>
                    </div>
                    {optimizationOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleOptimize(opt.instruction)}
                        disabled={optimizing}
                        className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 transition-all disabled:opacity-50"
                      >
                        <opt.icon size={12} className="text-emerald-400" />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                    {optimizing && (
                      <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold animate-pulse">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Otimizando...</span>
                      </div>
                    )}
                    {formData.language !== 'Português' && (
                      <button
                        onClick={handleTranslate}
                        disabled={translating}
                        className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-xs font-bold text-blue-400 transition-all disabled:opacity-50"
                      >
                        {translating ? <Loader2 size={12} className="animate-spin" /> : <Globe size={12} />}
                        <span>Traduzir para PT</span>
                      </button>
                    )}
                    <button
                      onClick={handleGenerateCaption}
                      disabled={generatingCaption}
                      className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-xs font-bold text-emerald-400 transition-all disabled:opacity-50"
                    >
                      {generatingCaption ? <Loader2 size={12} className="animate-spin" /> : <Instagram size={12} />}
                      <span>Legenda Social</span>
                    </button>
                  </div>
                </div>

                {/* Social Caption Preview */}
                {socialCaption && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="px-8 py-4 bg-emerald-500/5 border-b border-white/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Legenda para Redes Sociais</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(socialCaption);
                          alert('Legenda copiada!');
                        }}
                        className="text-[10px] font-bold text-emerald-400 hover:underline"
                      >
                        COPIAR
                      </button>
                    </div>
                    <p className="text-xs text-zinc-300 italic leading-relaxed">
                      {socialCaption}
                    </p>
                  </motion.div>
                )}

                {/* Lyrics Section */}
                <div className="flex-1 p-8 overflow-y-auto max-h-[400px] scrollbar-hide">
                  <div className="space-y-8">
                    {result.lyrics.map((section: any, idx: number) => (
                      <div key={idx}>
                        <h4 className="text-emerald-500/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                          [{section.section}]
                        </h4>
                        <p className="text-lg text-zinc-200 leading-relaxed whitespace-pre-line font-medium">
                          {section.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-6 border-t border-white/5 bg-black/20 grid grid-cols-4 gap-4">
                  <button className="flex flex-col items-center justify-center space-y-1 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                    <Download size={20} className="text-zinc-400 group-hover:text-emerald-400" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">MP3</span>
                  </button>
                  <button 
                    onClick={handleCopyLyrics}
                    className="flex flex-col items-center justify-center space-y-1 p-3 rounded-2xl hover:bg-white/5 transition-colors group"
                  >
                    {copied ? (
                      <Check size={20} className="text-emerald-400" />
                    ) : (
                      <FileText size={20} className="text-zinc-400 group-hover:text-emerald-400" />
                    )}
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">{copied ? 'Copiado!' : 'Letra'}</span>
                  </button>
                  <button className="flex flex-col items-center justify-center space-y-1 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                    <RotateCcw size={20} className="text-zinc-400 group-hover:text-emerald-400" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Remixar</span>
                  </button>
                  <button className="flex flex-col items-center justify-center space-y-1 p-3 rounded-2xl hover:bg-white/5 transition-colors group">
                    <Share2 size={20} className="text-zinc-400 group-hover:text-emerald-400" />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Share</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[500px] border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 rounded-3xl bg-zinc-900 flex items-center justify-center text-zinc-700 mb-6">
                  <Music size={40} />
                </div>
                <h3 className="text-xl font-bold text-zinc-500 mb-2">Sua música aparecerá aqui</h3>
                <p className="text-zinc-600 max-w-xs">
                  Preencha os campos ao lado e deixe a inteligência artificial compor algo único para você.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Manual Lyrics Modal */}
      <AnimatePresence>
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowManualModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <FileText className="text-emerald-500" />
                  <span>Inserir Letra Manualmente</span>
                </h3>
                <button 
                  onClick={() => setShowManualModal(false)}
                  className="p-2 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-zinc-400">
                  Dica: Use <span className="text-emerald-400">[Verso]</span>, <span className="text-emerald-400">[Refrão]</span> para organizar sua música.
                </p>
                <textarea
                  value={manualLyrics}
                  onChange={(e) => setManualLyrics(e.target.value)}
                  placeholder="[Verso 1]&#10;Minha vida é uma estrada...&#10;&#10;[Refrão]&#10;E eu sigo em frente..."
                  className="w-full h-80 bg-black/50 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none font-mono text-sm leading-relaxed"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowManualModal(false)}
                    className="flex-1 py-3 rounded-xl font-bold text-zinc-400 hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleManualSubmit}
                    disabled={!manualLyrics}
                    className="flex-[2] bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-all"
                  >
                    Confirmar e Gerar Áudio
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
