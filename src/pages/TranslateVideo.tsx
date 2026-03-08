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
  FileCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

import { db, auth } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { transcribeAndTranslateVideo } from '../lib/gemini';

export function TranslateVideo() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [subtitleStyle, setSubtitleStyle] = useState('modern');
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const subtitleStyles = [
    { id: 'classic', label: 'Clássico', className: 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] font-serif' },
    { id: 'modern', label: 'Moderno', className: 'bg-black/60 px-4 py-1 rounded-lg text-white font-sans' },
    { id: 'bold', label: 'Destaque', className: 'text-yellow-400 font-black uppercase tracking-tighter drop-shadow-md' },
    { id: 'netflix', label: 'Netflix', className: 'text-white font-sans drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]' },
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
      // 2. Transcribe and Translate using Gemini
      const data = await transcribeAndTranslateVideo(base64, file.type);
      
      if (!data.subtitles || data.subtitles.length === 0) {
        throw new Error("Áudio não detectado no arquivo.");
      }

      setStep(4); // Skip to sync/final steps for UI feel
      
      const videoResult = {
        title: file.name,
        originalLang: data.originalLanguage || 'Detectado',
        targetLang: 'Português',
        duration: 'Processado',
        videoUrl: URL.createObjectURL(file),
        subtitles: data.subtitles || [],
        fullText: data.subtitles.map((s: any) => s.text).join(' ')
      };

      setResult(videoResult);

      // Save to Firestore
      if (auth.currentUser) {
        // Save to 'videos' collection
        const videoDoc = await addDoc(collection(db, 'videos'), {
          id_usuario: auth.currentUser.uid,
          nome_arquivo: file.name,
          titulo: file.name,
          tipo: file.type.startsWith('video') ? 'Vídeo' : 'Áudio',
          idioma_origem: videoResult.originalLang,
          idioma_destino: 'Português',
          data: serverTimestamp(),
          videoUrl: videoResult.videoUrl,
          estilo_legenda: subtitleStyle
        });

        // Save to 'transcricoes' collection
        await addDoc(collection(db, 'transcricoes'), {
          id_usuario: auth.currentUser.uid,
          id_video: videoDoc.id,
          nome_arquivo: file.name,
          texto_original: videoResult.fullText, // In this flow, we translate directly, so original is the same as translated for now or we could separate them if Gemini provided both
          texto_traduzido: videoResult.fullText,
          data: serverTimestamp()
        });

        // Save to 'legendas' collection
        await addDoc(collection(db, 'legendas'), {
          id_usuario: auth.currentUser.uid,
          id_video: videoDoc.id,
          nome_arquivo: file.name,
          formato: 'SRT',
          conteudo: generateSRT(videoResult.subtitles),
          data: serverTimestamp()
        });
      }
    } catch (err: any) {
      console.error("Error processing video:", err);
      alert(err.message || "Erro ao processar vídeo. Verifique o tamanho do arquivo.");
    } finally {
      setProcessing(false);
      setStep(0);
    }
  };

  // Subtitle synchronization logic
  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !result?.subtitles) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      const sub = result.subtitles.find((s: any) => time >= s.start && time <= s.end);
      setCurrentSubtitle(sub ? sub.text : '');
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [result]);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-white mb-2">Traduzir Vídeo</h2>
        <p className="text-zinc-400">Tradução automática e legendagem profissional em segundos.</p>
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
                <div className="flex items-center space-x-3 bg-black/50 border border-white/10 rounded-xl px-4 py-3">
                  <Languages size={18} className="text-emerald-500" />
                  <span className="text-white font-medium">Português (Brasil)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Estilo da Legenda</label>
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
                  {file?.type.startsWith('video') ? (
                    <video 
                      ref={videoRef}
                      src={result.videoUrl} 
                      className="w-full h-full object-contain"
                      controls
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 animate-pulse">
                        <Music size={48} />
                      </div>
                      <audio 
                        ref={videoRef as any}
                        src={result.videoUrl} 
                        className="w-full max-w-md"
                        controls
                      />
                    </div>
                  )}
                  {currentSubtitle && (
                    <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none px-12 text-center z-10">
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={currentSubtitle}
                        className={cn(
                          "text-xl transition-all duration-300",
                          subtitleStyles.find(s => s.id === subtitleStyle)?.className
                        )}
                      >
                        {currentSubtitle}
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
                    <div className="flex space-x-2">
                      <button 
                        onClick={downloadSRT}
                        className="bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:scale-105 transition-transform"
                      >
                        <FileCode size={18} />
                        <span>Baixar SRT</span>
                      </button>
                      <button className="bg-white/5 text-white border border-white/10 px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-white/10 transition-all">
                        <Download size={18} />
                        <span>Vídeo</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-2xl p-6 border border-white/5 max-h-[200px] overflow-y-auto scrollbar-hide">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Preview da Transcrição</h4>
                    <div className="space-y-2">
                      {result.subtitles.map((sub: any, i: number) => (
                        <p key={i} className="text-zinc-400 text-sm leading-relaxed">
                          <span className="text-emerald-500/50 text-[10px] font-mono mr-2">[{sub.start.toFixed(1)}s]</span>
                          {sub.text}
                        </p>
                      ))}
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
