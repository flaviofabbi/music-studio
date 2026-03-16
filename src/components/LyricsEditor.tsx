import React from "react";
import { Wand2, Copy, Check } from "lucide-react";
import { cn } from "../lib/utils";

interface LyricsEditorProps {
  lyrics: string;
  onChange: (val: string) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
}

export function LyricsEditor({ lyrics, onChange, onGenerate, isGenerating }: LyricsEditorProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(lyrics);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold uppercase tracking-widest text-sm">Letras do Estúdio</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
          >
            {isGenerating ? "Gerando..." : <><Wand2 size={14} /> Gerar com IA</>}
          </button>
          <button 
            onClick={handleCopy}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          </button>
        </div>
      </div>
      
      <div className="relative flex-1 group">
        <div className="absolute -inset-0.5 bg-gradient-to-b from-white/10 to-transparent rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity" />
        <textarea 
          value={lyrics}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Insira sua letra aqui ou gere uma automaticamente..."
          className="relative w-full h-full min-h-[400px] bg-zinc-900/50 border border-white/10 rounded-2xl p-6 text-zinc-300 font-serif text-lg leading-relaxed focus:outline-none focus:border-white/20 transition-colors resize-none custom-scrollbar"
        />
      </div>
    </div>
  );
}
