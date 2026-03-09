import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Music, 
  RotateCcw, 
  Wand2,
  Type as TypeIcon,
  Mic2,
  Music2,
  Loader2,
  Save
} from 'lucide-react';
import { generateLyrics, optimizeLyrics } from '../lib/gemini';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export function CreateLyrics() {
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const [formData, setFormData] = useState({
    theme: '',
    style: 'Pop',
    mood: 'Feliz',
    language: 'Português'
  });

  const styles = ['Pop', 'Rap', 'Trap', 'Sertanejo', 'Funk', 'Rock', 'Gospel', 'Eletrônica'];
  const moods = ['Romântico', 'Triste', 'Motivacional', 'Feliz', 'Épico', 'Energético'];

  const optimizationOptions = [
    { id: 'rhyme', label: 'Melhorar Rimas', icon: Music2, instruction: 'Melhore as rimas e a métrica da letra.' },
    { id: 'poetic', label: 'Mais Poético', icon: Sparkles, instruction: 'Torne a letra mais poética e profunda.' },
    { id: 'slang', label: 'Adicionar Gírias', icon: Mic2, instruction: 'Adicione gírias e expressões urbanas atuais.' },
    { id: 'shorten', label: 'Encurtar', icon: TypeIcon, instruction: 'Encurte a letra mantendo a mensagem principal.' },
  ];

  const handleGenerate = async () => {
    if (!formData.theme) return;
    setLoading(true);
    setResult(null);
    setSaved(false);

    try {
      const lyricsData = await generateLyrics({
        theme: formData.theme,
        style: formData.style,
        mood: formData.mood,
        language: formData.language
      });
      setResult(lyricsData);
    } catch (err) {
      console.error("Error generating lyrics:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async (instruction: string) => {
    if (!result?.lyrics) return;
    setOptimizing(true);
    try {
      const currentLyricsText = result.lyrics.map((s: any) => `[${s.section}]\n${s.content}`).join('\n\n');
      const optimized = await optimizeLyrics(currentLyricsText, instruction);
      setResult({ ...result, ...optimized });
      setSaved(false);
    } catch (err) {
      console.error("Error optimizing lyrics:", err);
    } finally {
      setOptimizing(false);
    }
  };

  const handleCopy = () => {
    if (!result?.lyrics) return;
    const fullLyrics = result.lyrics.map((s: any) => `[${s.section}]\n${s.content}`).join('\n\n');
    navigator.clipboard.writeText(fullLyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!result || !auth.currentUser) return;
    try {
      await addDoc(collection(db, 'letras'), {
        id_usuario: auth.currentUser.uid,
        titulo: result.title,
        tema: formData.theme,
        estilo: formData.style,
        lyrics: result.lyrics,
        data: serverTimestamp()
      });
      setSaved(true);
    } catch (err) {
      console.error("Error saving lyrics:", err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Criador de Letras</h2>
          <p className="text-zinc-400">Gere letras profissionais e criativas para suas músicas.</p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full border border-blue-500/20">
          <FileText size={16} />
          <span className="text-sm font-bold">Compositor IA Ativo</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Sobre o que é a música?</label>
              <textarea
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                placeholder="Ex: Uma história de amor proibido em uma cidade futurista..."
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 h-32 resize-none"
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

            <button
              onClick={handleGenerate}
              disabled={loading || !formData.theme}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Escrevendo...</span>
                </>
              ) : (
                <>
                  <Wand2 size={20} />
                  <span>GERAR LETRA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result Panel */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-full"
              >
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-white">{result.title}</h3>
                    <p className="text-zinc-500 text-sm">{formData.style} • {formData.mood}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={handleCopy}
                      className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                      title="Copiar Letra"
                    >
                      {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={saved}
                      className={cn(
                        "p-3 rounded-xl transition-all",
                        saved ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white"
                      )}
                      title="Salvar na Biblioteca"
                    >
                      {saved ? <Check size={20} /> : <Save size={20} />}
                    </button>
                  </div>
                </div>

                {/* Optimization Bar */}
                <div className="px-8 py-4 bg-black/20 border-b border-white/5 overflow-x-auto scrollbar-hide">
                  <div className="flex items-center space-x-3 min-w-max">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mr-2">Ajustar:</span>
                    {optimizationOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleOptimize(opt.instruction)}
                        disabled={optimizing}
                        className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 transition-all disabled:opacity-50"
                      >
                        <opt.icon size={12} className="text-blue-400" />
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 p-8 overflow-y-auto max-h-[500px] scrollbar-hide">
                  <div className="space-y-8">
                    {result.lyrics.map((section: any, idx: number) => (
                      <div key={idx}>
                        <h4 className="text-blue-500/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                          [{section.section}]
                        </h4>
                        <p className="text-lg text-zinc-200 leading-relaxed whitespace-pre-line font-medium">
                          {section.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-black/20">
                  <button 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all"
                    onClick={() => {
                      // Logic to navigate to CreateMusic with these lyrics
                      alert('Em breve: Transformar esta letra em música completa!');
                    }}
                  >
                    <Music size={20} />
                    <span>TRANSFORMAR EM MÚSICA</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[500px] border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 rounded-3xl bg-zinc-900 flex items-center justify-center text-zinc-700 mb-6">
                  <FileText size={40} />
                </div>
                <h3 className="text-xl font-bold text-zinc-500 mb-2">Sua letra aparecerá aqui</h3>
                <p className="text-zinc-600 max-w-xs">
                  Descreva seu tema e deixe a IA compor os versos perfeitos para você.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
