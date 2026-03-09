import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  Video, 
  Languages, 
  Type, 
  Download, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  FileText,
  Settings2,
  Clock,
  Music,
  FileCode,
  Sparkles,
  Mic2,
  Globe,
  Captions,
  Volume2,
  ListMusic
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { transcribeAndTranslateAdvanced, LANGUAGES, generateDubbingTTS } from '../lib/gemini';

export function TranslateVideo() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [subtitleStyle, setSubtitleStyle] = useState('modern');
  const [targetLanguage, setTargetLanguage] = useState('Português');
  const [currentSubtitle, setCurrentSubtitle] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [dubbingUrl, setDubbingUrl] = useState<string | null>(null);
  const [isDubbing, setIsDubbing] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const dubbingRef = React.useRef<HTMLAudioElement>(null);

  const subtitleStyles = [
    { id: 'classic', label: 'Clássico', className: 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] font-serif' },
    { id: 'modern', label: 'Moderno', className: 'bg-black/60 px-4 py-1 rounded-lg text-white font-sans' },
    { id: 'bold', label: 'Destaque', className: 'text-yellow-400 font-black uppercase tracking-tighter drop-shadow-md' },
    { id: 'netflix', label: 'Netflix', className: 'text-white font-sans drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]' },
    { id: 'tiktok', label: 'TikTok Style', className: 'text-5xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,1)] uppercase' },
    { id: 'karaoke', label: 'Karaoke', className: 'text-3xl font-bold flex flex-wrap justify-center gap-2' },
  ];

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
      setStep(0);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
      'audio/*': ['.mp3', '.wav', '.m4a']
    },
    multiple: false
  });

  const generateSRT = (subtitles: any[]) => {
    return subtitles.map((sub, index) => {
      const formatTime = (seconds: number) => {
        const date = new Date(0);
        date.setSeconds(seconds);
        const timeString = date.toISOString().substr(11, 8);
        const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
        return `${timeString},${ms}`;
      };

      return `${index + 1}\n${formatTime(sub.start)} --> ${formatTime(sub.end)}\n${sub.text}\n`;
    }).join('\n');
  };

  const generateVTT = (subtitles: any[]) => {
    let vtt = "WEBVTT\n\n";
    subtitles.forEach((sub, index) => {
      const formatTime = (seconds: number) => {
        const date = new Date(0);
        date.setSeconds(seconds);
        return date.toISOString().substr(11, 12);
      };
      vtt += `${formatTime(sub.start)} --> ${formatTime(sub.end)}\n${sub.text}\n\n`;
    });
    return vtt;
  };

  const handleMediaError = (e: React.SyntheticEvent<HTMLMediaElement, Event>) => {
    const error = (e.currentTarget as HTMLMediaElement).error;
    console.error("Media element error:", error);
    let message = "O formato de mídia não é suportado pelo seu navegador.";
    if (error) {
      switch (error.code) {
        case 1: message = "Reprodução abortada."; break;
        case 2: message = "Erro de rede ao carregar a mídia."; break;
        case 3: message = "Erro de decodificação da mídia."; break;
        case 4: message = "Formato de mídia não suportado pelo navegador."; break;
      }
    }
    setMediaError(message);
  };

  const downloadSRT = () => {
    if (!result?.subtitles) return;
    const srtContent = generateSRT(result.subtitles);
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title.split('.')[0]}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadVTT = () => {
    if (!result?.subtitles) return;
    const vttContent = generateVTT(result.subtitles);
    const blob = new Blob([vttContent], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${result.title.split('.')[0]}.vtt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    setStep(1);
    
    try {
      // 1. Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      setStep(2);
      // 2. Transcribe and Translate using Gemini Advanced
      const data = await transcribeAndTranslateAdvanced(base64, file.type, targetLanguage);
      
      if (!data.segments || data.segments.length === 0) {
        throw new Error("Nenhuma voz detectada no arquivo enviado.");
      }

      setStep(4);
      
      const videoResult = {
        title: file.name,
        originalLang: data.originalLanguage || 'Detectado',
        targetLang: targetLanguage,
        duration: 'Processado',
        videoUrl: URL.createObjectURL(file),
        subtitleUrl: URL.createObjectURL(new Blob([generateVTT(data.segments)], { type: 'text/vtt' })),
        subtitles: data.segments || [],
        fullText: data.fullTranslation,
        originalText: data.fullTranscription,
        structure: data.structure || []
      };

      setResult(videoResult);

      // Save to Firestore
      if (auth.currentUser) {
        const videoDoc = await addDoc(collection(db, 'videos'), {
          id_usuario: auth.currentUser.uid,
          nome_arquivo: file.name,
          titulo: file.name,
          tipo: file.type.startsWith('video') ? 'Vídeo' : 'Música',
          idioma_origem: videoResult.originalLang,
          idioma_destino: targetLanguage,
          data_criacao: serverTimestamp(),
          videoUrl: videoResult.videoUrl,
          estilo_legenda: subtitleStyle,
          estrutura_musica: videoResult.structure
        });

        await addDoc(collection(db, 'transcricoes'), {
          id_usuario: auth.currentUser.uid,
          id_video: videoDoc.id,
          nome_arquivo: file.name,
          texto_original: videoResult.originalText,
          texto_traduzido: videoResult.fullText,
          idioma: targetLanguage,
          data_criacao: serverTimestamp()
        });

        await addDoc(collection(db, 'legendas'), {
          id_usuario: auth.currentUser.uid,
          id_video: videoDoc.id,
          nome_arquivo: file.name,
          formato: 'SRT/VTT',
          conteudo: generateSRT(videoResult.subtitles),
          idioma: targetLanguage,
          data_criacao: serverTimestamp()
        });
      }
    } catch (err: any) {
      console.error("Error processing video:", err);
      alert(err.message || "Erro ao processar arquivo.");
    } finally {
      setProcessing(false);
      setStep(0);
    }
  };

  const handleDubbing = async () => {
    if (!result?.fullText) return;
    setIsDubbing(true);
    try {
      const url = await generateDubbingTTS(result.fullText);
      setDubbingUrl(url);
      
      if (auth.currentUser && result) {
        await addDoc(collection(db, 'dublagens'), {
          id_usuario: auth.currentUser.uid,
          nome_musica: result.title,
          texto_traduzido: result.fullText,
          arquivo_dublagem: url,
          idioma: targetLanguage,
          data_criacao: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Dubbing error:", err);
      alert("Erro ao gerar dublagem.");
    } finally {
      setIsDubbing(false);
    }
  };

  // Subtitle synchronization logic
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !result?.subtitles) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setCurrentTime(time);
      const sub = result.subtitles.find((s: any) => time >= s.start && time <= s.end);
      setCurrentSubtitle(sub || null);
      
      if (dubbingRef.current && !dubbingRef.current.paused) {
        // Sync dubbing if needed, but usually they just play together
      }
    };

    const handlePlay = () => {
      if (dubbingRef.current && dubbingUrl) {
        dubbingRef.current.currentTime = video.currentTime;
        dubbingRef.current.play();
      }
    };

    const handlePause = () => {
      if (dubbingRef.current) dubbingRef.current.pause();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [result, dubbingUrl]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center space-x-3">
          <Captions className="text-emerald-500" size={32} />
          <span>Legendas & Tradução</span>
        </h2>
        <p className="text-zinc-400">Geração de legendas inteligentes e tradução profissional para vídeos e músicas.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload & Config */}
        <div className="lg:col-span-5 space-y-6">
          <div 
            {...getRootProps()} 
            className={cn(
              "border-2 border-dashed rounded-[2.5rem] p-12 text-center transition-all cursor-pointer group",
              isDragActive ? "border-emerald-500 bg-emerald-500/5" : "border-white/10 hover:border-white/20 bg-zinc-900/30",
              file && "border-emerald-500/50 bg-emerald-500/5"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all",
                file ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-500 group-hover:text-emerald-400"
              )}>
                {file ? <CheckCircle2 size={32} /> : <Upload size={32} />}
              </div>
              {file ? (
                <div>
                  <p className="text-white font-bold mb-1">{file.name}</p>
                  <p className="text-zinc-500 text-xs">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <>
                  <p className="text-white font-bold mb-2">Arraste seu vídeo aqui</p>
                  <p className="text-zinc-500 text-sm">MP4, MOV, AVI ou MKV (Máx 500MB)</p>
                </>
              )}
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-400 flex items-center space-x-2">
                <Settings2 size={16} />
                <span>Configurações</span>
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Idioma de Destino</label>
                <select 
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white font-medium outline-none focus:border-emerald-500 transition-colors"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <Captions size={14} className="text-emerald-500" />
                  <span>Estilo da Legenda</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {subtitleStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSubtitleStyle(style.id)}
                      className={cn(
                        "py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                        subtitleStyle === style.id 
                          ? "bg-emerald-500 text-black border-emerald-500" 
                          : "bg-white/5 text-zinc-400 border-white/5 hover:border-white/10"
                      )}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center min-h-[80px] text-center">
                <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mb-2">Prévia do Estilo</span>
                <div className={cn(
                  "text-sm transition-all duration-300",
                  subtitleStyles.find(s => s.id === subtitleStyle)?.className
                )}>
                  Sua legenda aparecerá assim
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Formato de Saída</label>
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 py-2 rounded-lg text-xs font-bold">Embutida</button>
                  <button className="bg-white/5 text-zinc-400 py-2 rounded-lg text-xs font-bold hover:text-white">Arquivo .SRT</button>
                </div>
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={!file || processing}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-500/20"
            >
              {processing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <Languages size={20} />
                  <span>TRADUZIR AGORA</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview & Status */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {processing ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-12 flex flex-col items-center justify-center text-center"
              >
                <div className="relative w-32 h-32 mb-8">
                  <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center text-emerald-500">
                    <Video size={40} />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Traduzindo seu vídeo</h3>
                <div className="w-full max-w-sm space-y-4">
                  {[
                    "Detectando idioma...",
                    "Transcrevendo áudio...",
                    "Traduzindo conteúdo...",
                    "Gerando legendas..."
                  ].map((s, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px]",
                        step > i ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-500"
                      )}>
                        {step > i ? "✓" : i + 1}
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        step > i ? "text-white" : "text-zinc-500"
                      )}>{s}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col h-full"
              >
                <div className="aspect-video bg-black relative flex items-center justify-center group">
                  {mediaError ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                      <AlertCircle className="text-red-500" size={48} />
                      <p className="text-red-400 font-bold uppercase text-xs tracking-wider">{mediaError}</p>
                      <button 
                        onClick={() => setMediaError(null)}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white transition-all"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  ) : file?.type.startsWith('video') ? (
                    <video 
                      ref={videoRef} 
                      controls 
                      className="w-full h-full object-contain"
                      onError={handleMediaError}
                    >
                      <source src={result.videoUrl} type="video/mp4" />
                      <track
                        src={result.subtitleUrl}
                        kind="subtitles"
                        srcLang="pt"
                        label="Português"
                        default
                      />
                      Seu navegador não suporta o elemento de vídeo.
                    </video>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 animate-pulse">
                        <Music size={48} />
                      </div>
                      <audio 
                        ref={videoRef as any}
                        className="w-full max-w-md"
                        controls
                        onError={handleMediaError}
                      >
                        <source src={dubbingUrl || result.videoUrl} type={(dubbingUrl || result.videoUrl)?.startsWith('data:audio/wav') ? 'audio/wav' : 'audio/mpeg'} />
                        Seu navegador não suporta o elemento de áudio.
                      </audio>
                    </div>
                  )}
                  {currentSubtitle && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-12 text-center z-10">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={currentSubtitle.text}
                        className={cn(
                          "transition-all duration-300",
                          subtitleStyles.find(s => s.id === subtitleStyle)?.className
                        )}
                      >
                        {subtitleStyle === 'karaoke' ? (
                          currentSubtitle.words?.map((w: any, i: number) => (
                            <span 
                              key={i} 
                              className={cn(
                                "transition-colors duration-200",
                                currentTime >= w.start && currentTime <= w.end ? "text-yellow-400" : "text-white"
                              )}
                            >
                              {w.word}{' '}
                            </span>
                          )) || currentSubtitle.text
                        ) : (
                          currentSubtitle.text
                        )}
                      </motion.div>
                    </div>
                  )}
                </div>

                <div className="p-8 space-y-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{result.title}</h3>
                      <div className="flex items-center space-x-4 text-zinc-400 text-sm">
                        <span className="flex items-center space-x-1">
                          <Languages size={14} />
                          <span>{result.originalLang} → {result.targetLang}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock size={14} />
                          <span>{result.duration}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <button 
                        onClick={handleDubbing}
                        disabled={isDubbing}
                        className="bg-cyan-500 text-black px-4 py-3 rounded-xl font-bold flex items-center space-x-2 hover:scale-105 transition-transform text-sm disabled:opacity-50"
                      >
                        {isDubbing ? <Loader2 size={18} className="animate-spin" /> : <Mic2 size={18} />}
                        <span>Dublar</span>
                      </button>
                      <button 
                        onClick={downloadSRT}
                        className="bg-emerald-500 text-black px-4 py-3 rounded-xl font-bold flex items-center space-x-2 hover:scale-105 transition-transform text-sm"
                      >
                        <FileCode size={18} />
                        <span>SRT</span>
                      </button>
                      <button 
                        onClick={downloadVTT}
                        className="bg-emerald-500 text-black px-4 py-3 rounded-xl font-bold flex items-center space-x-2 hover:scale-105 transition-transform text-sm"
                      >
                        <FileCode size={18} />
                        <span>VTT</span>
                      </button>
                    </div>
                  </div>

                  {dubbingUrl && (
                    <div className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Volume2 className="text-cyan-400" />
                        <div>
                          <p className="text-white font-bold text-sm">Dublagem Pronta!</p>
                          <p className="text-cyan-400/70 text-xs">Voz em {result.targetLang}</p>
                        </div>
                      </div>
                      <audio ref={dubbingRef} src={dubbingUrl} className="hidden" />
                      <button 
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = dubbingUrl;
                          a.download = `dublagem_${result.title}.wav`;
                          a.click();
                        }}
                        className="bg-cyan-500 text-black p-2 rounded-lg hover:bg-cyan-400 transition-colors"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/30 rounded-2xl p-6 border border-white/5 max-h-[300px] overflow-y-auto scrollbar-hide">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center space-x-2">
                        <FileText size={14} />
                        <span>Letra Traduzida</span>
                      </h4>
                      <div className="space-y-4">
                        {result.subtitles.map((sub: any, i: number) => (
                          <div key={i} className="space-y-1">
                            {sub.type && (
                              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-tighter">[{sub.type}]</span>
                            )}
                            <p className="text-zinc-400 text-sm leading-relaxed">
                              <span className="text-emerald-500/50 text-[10px] font-mono mr-2">[{sub.start.toFixed(1)}s]</span>
                              {sub.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-black/30 rounded-2xl p-6 border border-white/5">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center space-x-2">
                        <ListMusic size={14} />
                        <span>Estrutura Musical</span>
                      </h4>
                      <div className="space-y-3">
                        {result.structure.length > 0 ? result.structure.map((s: string, i: number) => (
                          <div key={i} className="flex items-center space-x-3 bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px] font-bold">
                              {i + 1}
                            </div>
                            <span className="text-sm text-white font-medium">{s}</span>
                          </div>
                        )) : (
                          <p className="text-zinc-500 text-xs italic">Nenhuma estrutura identificada.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[500px] border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 rounded-3xl bg-zinc-900 flex items-center justify-center text-zinc-700 mb-6">
                  <Video size={40} />
                </div>
                <h3 className="text-xl font-bold text-zinc-500 mb-2">Aguardando vídeo</h3>
                <p className="text-zinc-600 max-w-xs">
                  Faça o upload de um vídeo para iniciar o processo de tradução e legendagem automática.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
