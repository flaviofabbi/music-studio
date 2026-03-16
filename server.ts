import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Replicate from "replicate";

dotenv.config();
dotenv.config();
console.log("REPLICATE_API_TOKEN:", process.env.REPLICATE_API_TOKEN ? "OK" : "MISSING");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/generate-music", async (req, res) => {
    try {
      const { prompt, duration = 30 } = req.body;
      
      if (!process.env.REPLICATE_API_TOKEN) {
        return res.status(500).json({ error: "REPLICATE_API_TOKEN is not configured" });
      }

      // Using facebook/musicgen-medium
      const output = await replicate.run(
        "facebook/musicgen-medium:7a76a8258b299b66db0d9a2484501c77f760d0d266c3c2f60ffb144888d1810e",
        {
          input: {
            prompt: prompt,
            duration: duration,
            model_version: "medium",
            output_format: "mp3"
          }
        }
      );

      res.json({ audioUrl: output });
    } catch (error: any) {
      console.error("Replicate Error:", error);
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
   


