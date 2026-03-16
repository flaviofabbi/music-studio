import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, Download, Share2, X } from "lucide-react";
import { Howl } from "howler";
import { cn } from "../lib/utils";

interface MusicPlayerProps {
  song: {
    title: string;
    artist: string;
    audioUrl: string;
    coverUrl: string;
  } | null;
  onClose?: () => void;
}

export function MusicPlayer({ song, onClose }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [duration, setDuration] = useState(0);
  const soundRef = useRef<Howl | null>(null);

  useEffect(() => {
    if (song) {
      if (soundRef.current) {
        soundRef.current.unload();
      }

      soundRef.current = new Howl({
        src: [song.audioUrl],
        html5: true,
        volume: volume,
        onplay: () => setIsPlaying(true),
        onpause: () => setIsPlaying(false),
        onstop: () => setIsPlaying(false),
        onload: () => setDuration(soundRef.current?.duration() || 0),
        onend: () => setIsPlaying(false),
      });

      soundRef.current.play();
    }

    return () => {
      if (soundRef.current) {
        soundRef.current.unload();
      }
    };
  }, [song]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (soundRef.current && isPlaying) {
        const seek = soundRef.current.seek() as number;
        setProgress((seek / duration) * 100);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  const togglePlay = () => {
    if (!soundRef.current) return;
    if (isPlaying) {
      soundRef.current.pause();
    } else {
      soundRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (soundRef.current) {
      soundRef.current.seek((val / 100) * duration);
      setProgress(val);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (soundRef.current) {
      soundRef.current.volume(val);
    }
  };

  if (!song) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-lg border-t border-white/10 p-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-4">
        {/* Song Info */}
        <div className="flex items-center gap-4 w-full md:w-1/4">
          <img src={song.coverUrl} alt={song.title} className="w-14 h-14 rounded-lg object-cover shadow-lg" />
          <div className="overflow-hidden">
            <h4 className="text-white font-bold truncate">{song.title}</h4>
            <p className="text-zinc-400 text-sm truncate">{song.artist}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-2 w-full md:w-2/4">
          <div className="flex items-center gap-6">
            <button className="text-zinc-400 hover:text-white transition-colors"><SkipBack size={20} /></button>
            <button 
              onClick={togglePlay}
              className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors"><SkipForward size={20} /></button>
          </div>
          <div className="flex items-center gap-3 w-full">
            <span className="text-[10px] text-zinc-500 font-mono w-10 text-right">
              {Math.floor((progress / 100) * duration / 60)}:{(Math.floor((progress / 100) * duration % 60)).toString().padStart(2, '0')}
            </span>
            <input 
              type="range" 
              value={progress} 
              onChange={handleSeek}
              className="flex-1 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
            <span className="text-[10px] text-zinc-500 font-mono w-10">
              {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 w-full md:w-1/4">
          <div className="flex items-center gap-2 group">
            <Volume2 size={18} className="text-zinc-400" />
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={handleVolume}
              className="w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
            />
          </div>
          <a href={song.audioUrl} download={`${song.title}.mp3`} className="text-zinc-400 hover:text-white transition-colors">
            <Download size={20} />
          </a>
          <button className="text-zinc-400 hover:text-white transition-colors"><Share2 size={20} /></button>
          {onClose && (
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors ml-2">
              <X size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
