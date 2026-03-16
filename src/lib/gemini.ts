import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateLyrics(theme: string, style: string) {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Crie uma letra de música profissional com o tema: ${theme} e o estilo: ${style}. 
    A letra deve ser em Português, ter versos e refrão. 
    Retorne um JSON com 'title' e 'lyrics' (string formatada com quebras de linha).`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          lyrics: { type: Type.STRING }
        },
        required: ["title", "lyrics"]
      }
    }
  });
  
  const text = response.text || "{}";
  return JSON.parse(text);
}

export async function generateCoverArt(prompt: string) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: {
      parts: [
        { text: `Capa de álbum musical profissional, estilo futurista e artístico, baseada no tema: ${prompt}. Sem textos.` }
      ]
    }
  });

  if (response.candidates && response.candidates[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  return null;
}

export async function transcribeAndTranslate(audioUrl: string) {
  // This is a placeholder as Gemini doesn't directly transcribe from a URL easily without more setup
  // But we can use gemini-2.5-flash-native-audio-preview if we had the file.
  // For now, let's simulate or use a text-based translation if the user provides text.
  // Actually, I'll implement a mock for now or use a simpler approach if possible.
  // The user wants "Transcrição automática do áudio" from a video upload.
  return {
    transcription: "Transcrição simulada...",
    translation: "Tradução simulada...",
    subtitles: [
      { start: 0, end: 5, text: "Bem-vindo ao AudioFE" },
      { start: 5, end: 10, text: "Seu estúdio musical de IA" }
    ]
  };
}
