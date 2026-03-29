import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, ChevronLeft, Clock, Type, Trash2, Plus } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { cn } from "../lib/utils";

export function SubtitleEditorScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get("id");

  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (projectId) {
      const fetchProject = async () => {
        const docRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().subtitles) {
          setSubtitles(docSnap.data().subtitles);
        }
      };
      fetchProject();
    }
  }, [projectId]);

  const handleSave = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "projects", projectId), {
        subtitles: subtitles
      });
      navigate(`/editor?id=${projectId}`);
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSubtitle = (id: number, field: string, value: any) => {
    setSubtitles(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteSubtitle = (id: number) => {
    setSubtitles(prev => prev.filter(s => s.id !== id));
  };

  const addSubtitle = () => {
    const lastSub = subtitles[subtitles.length - 1];
    const newId = Math.max(0, ...subtitles.map(s => s.id)) + 1;
    const newSub = {
      id: newId,
      start: lastSub ? lastSub.end : "00:00:00,000",
      end: lastSub ? lastSub.end : "00:00:05,000",
      text: "Nova frase...",
      startTimeSeconds: lastSub ? lastSub.endTimeSeconds : 0,
      endTimeSeconds: lastSub ? lastSub.endTimeSeconds + 5 : 5
    };
    setSubtitles([...subtitles, newSub]);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <header className="flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Editar Letras</h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Ajuste fino da sincronização</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-4 bg-cyan-500 text-white rounded-2xl font-black uppercase tracking-widest italic flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)]"
        >
          <Save size={20} />
          {isSaving ? "Salvando..." : "Salvar"}
        </button>
      </header>

      <div className="space-y-4">
        {subtitles.map((s, index) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6 group hover:border-white/10 transition-colors"
          >
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 font-black text-xs">
                {index + 1}
              </div>
              <div className="flex-1 md:w-48 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                  <Clock size={12} /> Início / Fim
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={s.start}
                    onChange={(e) => updateSubtitle(s.id, "start", e.target.value)}
                    className="w-full bg-zinc-800 border-none rounded-lg p-2 text-xs font-mono text-white focus:ring-1 ring-cyan-500"
                  />
                  <span className="text-zinc-700">-</span>
                  <input 
                    type="text" 
                    value={s.end}
                    onChange={(e) => updateSubtitle(s.id, "end", e.target.value)}
                    className="w-full bg-zinc-800 border-none rounded-lg p-2 text-xs font-mono text-white focus:ring-1 ring-cyan-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                <Type size={12} /> Texto da Legenda
              </div>
              <input 
                type="text" 
                value={s.text}
                onChange={(e) => updateSubtitle(s.id, "text", e.target.value)}
                className="w-full bg-zinc-800 border-none rounded-xl p-4 text-sm font-bold text-white focus:ring-1 ring-cyan-500"
              />
            </div>

            <button 
              onClick={() => deleteSubtitle(s.id)}
              className="p-4 text-zinc-700 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={20} />
            </button>
          </motion.div>
        ))}

        <button 
          onClick={addSubtitle}
          className="w-full py-8 border-2 border-dashed border-white/5 rounded-3xl text-zinc-600 hover:text-white hover:border-white/20 transition-all flex flex-col items-center justify-center gap-2"
        >
          <Plus size={32} />
          <span className="text-xs font-black uppercase tracking-widest">Adicionar Frase</span>
        </button>
      </div>
    </div>
  );
}
