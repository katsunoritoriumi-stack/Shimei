export default async function handler(req, res) {
  // POST以外のアクセスを弾く
  if (req.method !== 'POST') {
    return res.status(405).json({ reply: "エラー：POSTメソッドのみ許可されています。" });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  // もしAPIキーがうまく読み込めていない場合のエラー
  if (!API_KEY) {
    return res.status(500).json({ reply: "エラー：VercelにGEMINI_API_KEYが正しく読み込まれていません。Vercelの設定画面を確認してください。" });
  }

  const { message, number, context } = req.body;

  const prompt = `あなたは「使命鑑定ナビ」の熟練鑑定士です。
相談者の数秘（音）は「${number}」です。
この数字の使命は「${context.m}」、エゴは「${context.e}」です。

相談者からの悩み: "${message}"

【鑑定ルール】
1. 鑑定士らしい落ち着いた、神秘的で温かいトーンで語りかけてください。
2. 数秘「${number}」の特性を深く踏まえ、現在の悩みが「使命」を活かすためのどのようなステップであるかを詳しく伝えてください。
3. エゴ（${context.e}）に陥らないための具体的な心の持ち方をアドバイスしてください。
4. 400文字程度で、相談者が前向きな一歩を踏み出せるように詳しく回答してください。
5. 「AI」や「システム」といった言葉は一切出さないでください。`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    // Gemini側からエラーが返ってきた場合
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ reply: `Gemini通信エラーが発生しました: HTTPステータス ${response.status}` });
    }

    const data = await response.json();
    
    // データ形式の安全チェック
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      return res.status(500).json({ reply: "エラー：Geminiからの返答データの形式が想定と異なります。" });
    }

    const reply = data.candidates[0].content.parts[0].text;
    res.status(200).json({ reply });

  } catch (error) {
    // サーバー内部で予期せぬエラーが起きた場合
    res.status(500).json({ reply: `サーバー内部エラー: ${error.message}` });
  }
}
