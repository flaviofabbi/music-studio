import React, { useState, useCallback, useRef, useEffect } from "react";
import { FileVideo, Upload, Loader2, Download, Languages, FileText, CheckCircle2, Play, Pause, Type, Palette, Layout as LayoutIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../lib/utils";
import { processVideoSubtitles, generateSRT } from "../services/subtitleService";

type SubtitleStyle = 'classic' | 'capcut-yellow' | 'modern' | 'neon' | 'minimal';

interface Subtitle {
  id: number;
  start: string; // HH:MM:SS,mmm
  end: string;
  text: string;
  startTimeSeconds: number;
  endTimeSeconds: number;
}

export function VideoSubtitle() {
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ transcription: string; translation: string; subtitles: Subtitle[] } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<SubtitleStyle>('classic');
  const [fontSize, setFontSize] = useState(24);
  
  const videoRef = useRef<HTMLVideoElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setVideoUrl(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': [] },
    multiple: false
  });

  const timeToSeconds = (timeStr: string) => {
    const [hms, mmm] = timeStr.split(',');
    const [h, m, s] = hms.split(':').map(Number);
    return h * 3600 + m * 60 + s + Number(mmm) / 1000;
  };

  const handleProcess = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const data = await processVideoSubtitles(file) as any;
      // Convert times to seconds for easier comparison
      const processedSubtitles = data.subtitles.map((s: any) => ({
        ...s,
        startTimeSeconds: timeToSeconds(s.start),
        endTimeSeconds: timeToSeconds(s.end)
      }));
      setResult({ ...data, subtitles: processedSubtitles });
    } catch (error) {
      console.error(error);
      alert("Erro ao processar vídeo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSRT = () => {
    if (!result) return;
    const srt = generateSRT(result.subtitles);
    const blob = new Blob([srt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "legendas.srt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const currentSubtitle = result?.subtitles.find(
    s => currentTime >= s.startTimeSeconds && currentTime <= s.endTimeSeconds
  );

  const getStyleClasses = () => {
    switch (selectedStyle) {
      case 'capcut-yellow':
        return "text-yellow-400 font-black drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase italic";
      case 'modern':
        return "bg-black/60 text-white px-4 py-2 rounded-lg font-sans font-medium backdrop-blur-sm";
      case 'neon':
        return "text-cyan-400 font-bold drop-shadow-[0_0_10px_rgba(34,211,238,0.8)] tracking-widest";
      case 'minimal':
        return "text-white/90 font-light tracking-tighter border-b border-white/20 pb-1";
      default:
        return "text-white font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 pb-32">
      <header className="space-y-2 mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Languages className="text-white" size={24} />
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">CapCut Studio AI</h1>
        </div>
        <p className="text-zinc-500 font-medium">Insira legendas dinâmicas e estilizadas em seus vídeos musicais.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Editor Area */}
        <div className="lg:col-span-8 space-y-6">
          <div className="relative aspect-video bg-zinc-900 rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl group">
            {videoUrl ? (
              <>
                <video 
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                {/* Subtitle Overlay */}
                <AnimatePresence>
                  {currentSubtitle && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none px-12 text-center"
                    >
                      <span 
                        className={cn("transition-all duration-300", getStyleClasses())}
                        style={{ fontSize: `${fontSize}px` }}
                      >
                        {currentSubtitle.text}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Custom Controls Overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <button 
                    onClick={togglePlay}
                    className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white pointer-events-auto hover:scale-110 transition-transform"
                  >
                    {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
                  </button>
                </div>
              </>
            ) : (
              <div 
                {...getRootProps()} 
                className={cn(
                  "w-full h-full flex flex-col items-center justify-center text-center p-12 cursor-pointer transition-all",
                  isDragActive ? "bg-white/5" : "hover:bg-white/5"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-24 h-24 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                  <Upload className="text-zinc-500" size={40} />
                </div>
                <h2 className="text-2xl font-black text-white uppercase italic tracking-widest mb-2">Upload de Vídeo</h2>
                <p className="text-zinc-500 max-w-xs">Arraste seu clipe aqui para começar a legendar com IA.</p>
              </div>
            )}
          </div>

          {/* Timeline / Progress */}
          {videoUrl && (
            <div className="bg-zinc-900/60 border border-white/5 rounded-3xl p-6 flex items-center gap-6">
              <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden relative">
                <div 
                  className="absolute top-0 left-0 h-full bg-white transition-all duration-100"
                  style={{ width: `${(currentTime / (videoRef.current?.duration || 1)) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-zinc-500 w-20">
                {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6">
          {/* Style Selector */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-[2rem] p-8 space-y-8">
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Palette size={14} /> Estilo das Legendas
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(['classic', 'capcut-yellow', 'modern', 'neon', 'minimal'] as SubtitleStyle[]).map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={cn(
                      "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                      selectedStyle === style 
                        ? "bg-white text-black border-white" 
                        : "bg-zinc-800 text-zinc-400 border-transparent hover:border-white/20"
                    )}
                  >
                    {style.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Type size={14} /> Tamanho da Fonte
              </h3>
              <input 
                type="range" 
                min="12" 
                max="64" 
                value={fontSize} 
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-600">
                <span>12px</span>
                <span>{fontSize}px</span>
                <span>64px</span>
              </div>
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              {!result ? (
                <button
                  onClick={handleProcess}
                  disabled={!file || isProcessing}
                  className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest italic hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center gap-3">
                      <Loader2 className="animate-spin" size={20} />
                      <span>Processando...</span>
                    </div>
                  ) : "Gerar Legendas com IA"}
                </button>
              ) : (
                <div className="space-y-3">
                  <button 
                    onClick={downloadSRT}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-colors"
                  >
                    <Download size={18} /> Exportar SRT
                  </button>
                  <button 
                    onClick={() => { setFile(null); setVideoUrl(null); setResult(null); }}
                    className="w-full py-4 text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Novo Vídeo
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Subtitle List */}
          {result && (
            <div className="bg-zinc-900/60 border border-white/5 rounded-[2rem] p-8 max-h-[400px] overflow-y-auto custom-scrollbar">
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6 flex items-center gap-2 sticky top-0 bg-zinc-900/60 py-2">
                <FileText size={14} /> Lista de Legendas
              </h3>
              <div className="space-y-3">
                {result.subtitles.map((s) => (
                  <div 
                    key={s.id} 
                    className={cn(
                      "w-full text-left p-4 rounded-2xl border transition-all group relative",
                      currentTime >= s.startTimeSeconds && currentTime <= s.endTimeSeconds
                        ? "bg-white/10 border-white/20"
                        : "bg-zinc-800/40 border-transparent hover:border-white/10"
                    )}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <button 
                        onClick={() => {
                          if (videoRef.current) videoRef.current.currentTime = s.startTimeSeconds;
                        }}
                        className="text-[10px] font-mono text-zinc-500 hover:text-white transition-colors"
                      >
                        {s.start}
                      </button>
                      {currentTime >= s.startTimeSeconds && currentTime <= s.endTimeSeconds && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      )}
                    </div>
                    <textarea
                      value={s.text}
                      onChange={(e) => {
                        const newSubtitles = result.subtitles.map(sub => 
                          sub.id === s.id ? { ...sub, text: e.target.value } : sub
                        );
                        setResult({ ...result, subtitles: newSubtitles });
                      }}
                      className="w-full bg-transparent text-xs text-zinc-300 focus:text-white focus:outline-none resize-none border-none p-0"
                      rows={1}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
