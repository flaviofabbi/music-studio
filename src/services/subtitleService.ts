export async function processVideoSubtitles(audioUrl: string) {
  try {
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioUrl })
    });

    if (!response.ok) {
      throw new Error("Failed to transcribe");
    }

    const data = await response.json();
    
    if (data.transcription && data.transcription.segments) {
      return {
        transcription: data.transcription.text,
        translation: "",
        subtitles: data.transcription.segments.map((s: any, i: number) => ({
          id: i + 1,
          start: formatTime(s.start),
          end: formatTime(s.end),
          text: s.text.trim()
        }))
      };
    }

    return {
      transcription: data.transcription || "",
      translation: "",
      subtitles: [
        { id: 1, start: "00:00:01,000", end: "00:00:05,000", text: "Transcrição concluída" }
      ]
    };
  } catch (error) {
    console.error("Transcription Error:", error);
    return {
      transcription: "",
      translation: "",
      subtitles: [
        { id: 1, start: "00:00:01,000", end: "00:00:05,000", text: "Erro na transcrição" }
      ]
    };
  }
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

export function generateSRT(subtitles: any[]) {
  return subtitles
    .map((s, i) => `${i + 1}\n${s.start} --> ${s.end}\n${s.text}\n`)
    .join("\n");
}
