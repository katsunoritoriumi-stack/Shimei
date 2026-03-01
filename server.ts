import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API endpoint
  app.post("/api/gemini", async (req, res) => {
    try {
      const { userText, currentNumber, history } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "API key is missing" });
      }

      const ai = new GoogleGenAI({ apiKey });
      const model = ai.models.generateContent({
        model: "gemini-2.0-flash-exp", // Using a stable flash model
        contents: [
          {
            role: "user",
            parts: [{ text: `
あなたは熟練の数秘術鑑定士です。
相談者の「数秘（音の数字）」は「${currentNumber}」です。
この数字の持つ意味（使命や性質）を背景に、相談者の悩みに寄り添い、具体的で温かいアドバイスを日本語で提供してください。

【重要】回答の中に「カタカムナ」に関する内容は一切含めないでください。

これまでの会話の流れ:
${history ? history.map((m: any) => `${m.role === 'user' ? '相談者' : '鑑定士'}: ${m.text}`).join('\n') : 'なし'}

相談者のメッセージ:
${userText}
            ` }]
          }
        ],
        config: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
        }
      });

      const response = await model;
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Internal Server Error" });
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
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
