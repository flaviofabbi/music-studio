import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Replicate from "replicate";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

const upload = multer({ dest: "uploads/" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use("/exports", express.static("exports"));

  // Ensure directories exist
  if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
  if (!fs.existsSync("exports")) fs.mkdirSync("exports");

  // API Routes
  app.post("/api/generate-music", async (req, res) => {
    try {
      const { prompt, duration = 30 } = req.body;
      
      if (!process.env.REPLICATE_API_TOKEN) {
        return res.status(500).json({ error: "REPLICATE_API_TOKEN is not configured" });
      }

      const output = await replicate.run(
        "meta/musicgen:b05b39c70a0e333c16606868b0d319a7811f5736058730edc7e19193c137027c",
        {
          input: {
            prompt: prompt,
            duration: duration,
            model_version: "stereo-large",
            output_format: "mp3",
            normalization_strategy: "peak"
          }
        }
      );

      res.json({ audioUrl: output });
    } catch (error: any) {
      console.error("Replicate Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/transcribe", async (req, res) => {
    try {
      const { audioUrl } = req.body;
      
      if (!process.env.REPLICATE_API_TOKEN) {
        return res.status(500).json({ error: "REPLICATE_API_TOKEN is not configured" });
      }

      const output = await replicate.run(
        "openai/whisper:91ee9c0c3df30478387ff8c4e3a58f9d343f62cb0946a3eaa3c4c1d37063ad27",
        {
          input: {
            audio: audioUrl,
            model: "large-v3",
            response_format: "json",
            timestamp_granularities: ["word"]
          }
        }
      );

      res.json({ transcription: output });
    } catch (error: any) {
      console.error("Transcription Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/export", upload.single("video"), async (req, res) => {
    const videoPath = req.file?.path;
    const { audioUrl, subtitles, style } = req.body;
    const outputId = uuidv4();
    const outputPath = path.join("exports", `${outputId}.mp4`);
    const srtPath = path.join("exports", `${outputId}.srt`);
    const audioPath = path.join("uploads", `${outputId}.mp3`);

    if (!videoPath || !audioUrl) {
      return res.status(400).json({ error: "Missing video file or audio URL" });
    }

    try {
      // 1. Download Audio
      const audioResponse = await axios({
        url: audioUrl,
        method: "GET",
        responseType: "stream",
      });
      const audioWriter = fs.createWriteStream(audioPath);
      audioResponse.data.pipe(audioWriter);
      await new Promise((resolve, reject) => {
        audioWriter.on("finish", resolve);
        audioWriter.on("error", reject);
      });

      // 2. Create SRT file
      const subs = JSON.parse(subtitles);
      const srtContent = subs.map((s: any, i: number) => {
        return `${i + 1}\n${s.start.replace(",", ".")} --> ${s.end.replace(",", ".")}\n${s.text}\n`;
      }).join("\n");
      fs.writeFileSync(srtPath, srtContent);

      // 3. Process with FFmpeg
      // Note: Applying subtitles with style is complex in FFmpeg filters.
      // For now, we'll do a basic burn-in.
      ffmpeg(videoPath)
        .input(audioPath)
        .outputOptions([
          "-c:v libx264",
          "-c:a aac",
          "-map 0:v:0",
          "-map 1:a:0",
          "-shortest",
          `-vf subtitles=${srtPath}:force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=1,Shadow=1,Alignment=2'`
        ])
        .on("start", (cmd) => console.log("FFmpeg started:", cmd))
        .on("error", (err) => {
          console.error("FFmpeg Error:", err);
          res.status(500).json({ error: "Video processing failed" });
        })
        .on("end", () => {
          res.json({ videoUrl: `/exports/${outputId}.mp4` });
          // Cleanup
          fs.unlinkSync(videoPath);
          fs.unlinkSync(audioPath);
          // We keep the export for the user to download
        })
        .save(outputPath);

    } catch (error: any) {
      console.error("Export Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
   


