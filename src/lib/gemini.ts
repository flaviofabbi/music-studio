import { GoogleGenAI, Type, Modality } from "@google/genai";

// The API key is injected by the platform
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const generateLyrics = async (params: {
  theme: string;
  style: string;
  mood: string;
  language: string;
}) => {
  const model = "gemini-3.1-pro-preview";
  const prompt = `Gere uma letra de música completa com o tema "${params.theme}", no estilo "${params.style}", com um humor "${params.mood}" e no idioma "${params.language}". 
  A estrutura deve incluir: Verso 1, Pré-Refrão, Refrão, Verso 2, Refrão, Ponte, Refrão Final.
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

export const generateSpeech = async (text: string) => {
  const response = await genAI.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Kore" },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return `data:audio/mp3;base64,${base64Audio}`;
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
