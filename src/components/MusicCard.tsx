import React from "react";
import { Play, MoreVertical, Download, Share2 } from "lucide-react";
import { cn } from "../lib/utils";

interface MusicCardProps {
  song: {
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    style: string;
    createdAt: any;
  };
  onPlay: () => void;
  isActive?: boolean;
}

export function MusicCard({ song, onPlay, isActive }: MusicCardProps) {
  return (
    <div className={cn(
      "group relative bg-zinc-900/40 border border-white/5 rounded-2xl p-4 hover:bg-zinc-800/60 transition-all duration-300",
      isActive && "border-white/20 bg-zinc-800/80 ring-1 ring-white/10"
    )}>
      <div className="relative aspect-square mb-4 overflow-hidden rounded-xl">
        <img 
          src={song.coverUrl} 
          alt={song.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button 
            onClick={onPlay}
            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
          >
            <Play size={24} fill="currentColor" className="ml-1" />
          </button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-2">
        <div className="overflow-hidden">
          <h3 className="text-white font-bold truncate group-hover:text-primary transition-colors">{song.title}</h3>
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mt-1">{song.style}</p>
        </div>
        <button className="text-zinc-500 hover:text-white transition-colors">
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-[10px] text-zinc-600 font-medium">
          {new Date(song.createdAt?.seconds * 1000).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-3">
          <button className="text-zinc-500 hover:text-white transition-colors"><Download size={16} /></button>
          <button className="text-zinc-500 hover:text-white transition-colors"><Share2 size={16} /></button>
        </div>
      </div>
    </div>
  );
}
