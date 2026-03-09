import { GoogleGenAI, Type, Modality } from "@google/genai";

// The API key is injected by the platform
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateLyrics = async (params: {
  theme: string;
  style: string;
  mood: string;
  language: string;
  genre?: string;
  instruments?: string[];
  structure?: string[];
}) => {
  const model = "gemini-3.1-pro-preview";
  const prompt = `Gere uma letra de música completa e profissional com as seguintes especificações:
  - Tema: ${params.theme}
  - Estilo: ${params.style}
  - Humor/Clima: ${params.mood}
  - Idioma: ${params.language}
  ${params.genre ? `- Gênero: ${params.genre}` : ''}
  ${params.instruments ? `- Instrumentos sugeridos para o arranjo: ${params.instruments.join(', ')}` : ''}
  
  A estrutura deve seguir rigorosamente: ${params.structure ? params.structure.join(', ') : 'Verso 1, Pré-Refrão, Refrão, Verso 2, Refrão, Ponte, Refrão Final'}.
  
  Para cada seção, forneça a letra e uma breve descrição do arranjo instrumental sugerido (ex: "Bateria entra forte", "Piano suave").
  
  Retorne em formato JSON.`;

  const response = await genAI.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          lyrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                section: { type: Type.STRING },
                content: { type: Type.STRING },
                arrangement: { type: Type.STRING, description: "Descrição do arranjo para esta seção" },
              },
            },
          },
        },
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const optimizeLyrics = async (lyrics: string, instruction: string) => {
  const model = "gemini-3.1-pro-preview";
  const prompt = `Otimize a seguinte letra de música baseada nesta instrução: "${instruction}". 
  Mantenha a estrutura de seções (Verso, Refrão, etc.).
  Letra original:
  ${lyrics}
  
  Retorne a letra otimizada em formato JSON com a mesma estrutura: { title: string, lyrics: [{ section: string, content: string }] }.`;

  const response = await genAI.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          lyrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                section: { type: Type.STRING },
                content: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const generateCoverArt = async (theme: string, style: string) => {
  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        {
          text: `Uma capa de álbum profissional e artística para uma música com o tema "${theme}" e estilo musical "${style}". Estilo visual moderno, vibrante e minimalista.`,
        },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};

const pcmToWav = (pcmBase64: string, sampleRate: number = 24000): string => {
  const binaryString = atob(pcmBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // file length
  view.setUint32(4, 36 + len, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (1 = PCM)
  view.setUint16(20, 1, true);
  // channel count (1 = mono)
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // data chunk length
  view.setUint32(40, len, true);

  const wavBytes = new Uint8Array(44 + len);
  wavBytes.set(new Uint8Array(wavHeader), 0);
  wavBytes.set(bytes, 44);

  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < wavBytes.length; i += chunk) {
    const subArray = wavBytes.subarray(i, i + chunk);
    binary += String.fromCharCode.apply(null, Array.from(subArray));
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
};

export const generateSpeech = async (text: string, voiceName: string = "Kore") => {
  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return pcmToWav(base64Audio);
  }
  return null;
};

export const generateSocialCaption = async (title: string, lyrics: string, style: string) => {
  const model = "gemini-3.1-pro-preview";
  const prompt = `Crie uma legenda cativante para redes sociais (Instagram/TikTok) para uma música chamada "${title}". 
  A música é do estilo "${style}".
  Use trechos marcantes desta letra:
  ${lyrics}
  
  A legenda deve ser em Português, incluir emojis e hashtags relevantes.
  Retorne apenas o texto da legenda.`;

  const response = await genAI.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text;
};

export const translateLyrics = async (lyrics: string, targetLanguage: string) => {
  const model = "gemini-3.1-pro-preview";
  const prompt = `Traduza a seguinte letra de música para "${targetLanguage}". 
  Mantenha a estrutura de seções (Verso, Refrão, etc.).
  Letra original:
  ${lyrics}
  
  Retorne a letra traduzida em formato JSON com a mesma estrutura: { title: string, lyrics: [{ section: string, content: string }] }.`;

  const response = await genAI.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          lyrics: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                section: { type: Type.STRING },
                content: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const LANGUAGES = [
  'Português', 'Inglês', 'Espanhol', 'Francês', 'Italiano', 
  'Alemão', 'Holandês', 'Russo', 'Japonês', 'Coreano', 
  'Chinês', 'Hindi', 'Árabe', 'Turco', 'Sueco', 
  'Norueguês', 'Dinamarquês', 'Polonês', 'Grego', 'Hebraico'
];

export const transcribeAndTranslateAdvanced = async (fileBase64: string, mimeType: string, targetLanguage: string) => {
  const model = "gemini-3-flash-preview";
  const prompt = `Analise este arquivo de áudio/vídeo. 
  1. Transcreva o conteúdo com precisão. Se for música, separe em versos e identifique pausas.
  2. Identifique a ESTRUTURA MUSICAL (ex: [Intro], [Verso 1], [Refrão], [Ponte], [Outro]).
  3. Traduza a transcrição para "${targetLanguage}".
  4. Gere timestamps detalhados para cada palavra (word-level timestamps) para permitir efeito de karaoke/TikTok.
  
  Retorne um JSON com:
  - originalLanguage: idioma detectado
  - fullTranscription: texto completo original
  - fullTranslation: texto completo traduzido
  - structure: um array de strings com a estrutura detectada (ex: ["Intro", "Verso 1", "Refrão"])
  - segments: lista de segmentos (frases/versos), cada um com:
    - start: tempo início (segundos)
    - end: tempo fim (segundos)
    - text: texto traduzido do segmento
    - type: tipo do segmento (ex: "Verso", "Refrão", "Intro")
    - words: lista de palavras no segmento, cada uma com { word: string, start: number, end: number }
  
  Se não houver voz detectável, retorne um objeto indicando que nenhuma voz foi encontrada.`;

  const response = await genAI.models.generateContent({
    model,
    contents: [
      {
        inlineData: {
          data: fileBase64,
          mimeType: mimeType,
        },
      },
      { text: prompt },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          originalLanguage: { type: Type.STRING },
          fullTranscription: { type: Type.STRING },
          fullTranslation: { type: Type.STRING },
          structure: { type: Type.ARRAY, items: { type: Type.STRING } },
          segments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                start: { type: Type.NUMBER },
                end: { type: Type.NUMBER },
                text: { type: Type.STRING },
                type: { type: Type.STRING },
                words: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING },
                      start: { type: Type.NUMBER },
                      end: { type: Type.NUMBER },
                    }
                  }
                }
              },
            },
          },
        },
      },
    },
  });

  return JSON.parse(response.text || "{}");
};

export const generateDubbingTTS = async (text: string, voiceName: string = 'Kore') => {
  const model = "gemini-2.5-flash-preview-tts";
  const response = await genAI.models.generateContent({
    model,
    contents: [{ parts: [{ text: `Duble o seguinte texto com emoção: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  return base64Audio ? pcmToWav(base64Audio) : null;
};

export const transcribeAndTranslateVideo = async (fileBase64: string, mimeType: string) => {
  const model = "gemini-3-flash-preview";
  const prompt = `Transcreva o áudio deste vídeo e traduza para Português (Brasil). 
  Retorne o resultado em formato JSON com uma lista de legendas sincronizadas.
  Cada item deve ter: 'start' (tempo de início em segundos), 'end' (tempo de fim em segundos) e 'text' (texto traduzido).
  Também inclua o 'originalLanguage' detectado.`;

  const response = await genAI.models.generateContent({
    model,
    contents: [
      {
        inlineData: {
          data: fileBase64,
          mimeType: mimeType,
        },
      },
      { text: prompt },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          originalLanguage: { type: Type.STRING },
          subtitles: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                start: { type: Type.NUMBER },
                end: { type: Type.NUMBER },
                text: { type: Type.STRING },
              },
            },
          },
        },
      },
    },
  });

  return JSON.parse(response.text || "{}");
};
