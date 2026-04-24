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
        return res.status(500).json({ error: "現在アクセスが集中しています。しばらくしてからもう一度お試しください。" });
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `あなたは熟練の数秘術鑑定士です。
相談者の「数秘（音の数字）」は「${currentNumber}」です。
この数字の持つ意味（使命や性質）を背景に、相談者の悩みに寄り添い、具体的で温かいアドバイスを日本語で提供してください。

【重要】回答の中に「カタカムナ」に関する内容は一切含めないでください。

【返答スタイルについて】
- 番号付きリストや箇条書き、見出しなどの固定フォーマットは使わず、自然な会話文で返してください。
- 毎回同じ構成・同じ書き出しにならないよう、内容や流れに合わせて表現を変えてください。
- 会話の初期は丁寧に、打ち解けてきたら少し柔らかいトーンにするなど、流れに応じて変化させてください。
- 返答が長くなりすぎないよう、伝えたいことを絞り込んでください。
- 必要に応じて相談者に問いかけを添えるなど、対話のキャッチボールを意識してください。`;

      // 会話履歴をGeminiのcontents形式に変換
      const historyContents = history
        ? history.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.text }],
          }))
        : [];

      const model = ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [
          ...historyContents,
          {
            role: "user",
            parts: [{ text: userText }],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.9,
          topP: 0.95,
          topK: 40,
        }
      });

      const response = await model;
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "現在アクセスが集中しています。しばらくしてからもう一度お試しください。" });
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
