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
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export function TranslateVideo() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<any>(null);

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
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    multiple: false
  });

  const handleProcess = async () => {
    if (!file) return;
    setProcessing(true);
    
    // Simulate processing steps
    const steps = [
      "Detectando idioma original...",
      "Transcrevendo áudio (Whisper AI)...",
      "Traduzindo para Português...",
      "Sincronizando legendas...",
      "Renderizando vídeo final..."
    ];

    for (let i = 0; i < steps.length; i++) {
      setStep(i + 1);
      await new Promise(r => setTimeout(r, 2000));
    }

    setResult({
      title: file.name,
      originalLang: 'Inglês',
      targetLang: 'Português',
      duration: '02:45',
      videoUrl: URL.createObjectURL(file) // For demo, we use the original file
    });
    setProcessing(false);
  };

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
                  <button className="bg-emerald-500 text-black py-2 rounded-lg text-xs font-bold">Embutida</button>
                  <button className="bg-white/5 text-zinc-400 py-2 rounded-lg text-xs font-bold hover:text-white">Arquivo .SRT</button>
                </div>
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={!file || processing}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-bold py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all"
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
                  <video 
                    src={result.videoUrl} 
                    className="w-full h-full object-contain"
                    controls
                  />
                  <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="bg-black/80 px-4 py-2 rounded text-white text-lg font-bold border border-white/10">
                      [Legenda em Português Gerada]
                    </div>
                  </div>
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
                      <button className="bg-emerald-500 text-black px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:scale-105 transition-transform">
                        <Download size={18} />
                        <span>Vídeo</span>
                      </button>
                      <button className="bg-white/5 text-white border border-white/10 px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-white/10 transition-all">
                        <FileText size={18} />
                        <span>SRT</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-black/30 rounded-2xl p-6 border border-white/5">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Preview da Transcrição</h4>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      "Olá a todos, bem-vindos a este vídeo. Hoje vamos falar sobre como a inteligência artificial está mudando o mundo da música e da criação de conteúdo digital..."
                    </p>
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
