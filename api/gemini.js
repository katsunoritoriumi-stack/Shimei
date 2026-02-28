export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POSTメソッドのみ許可されています' });
  }

  const { userText, currentNumber } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'サーバー側にAPIキーが設定されていません。VercelのSettingsから設定してください。' });
  }

  const numerologyData = {
    "1": { mission: "求める根源：本質・本物・根源・懸け橋・要点・決断", ego: "答えを探す：迷走・保留・依頼心・複雑・諦め" },
    "2": { mission: "助け合う心：整理・要約・適格・順序・共感・親切・指導", ego: "興奮と反感：雑・散漫・反発・慢心・優越感・逆行" },
    "3": { mission: "工夫と結果：具現・学習・技術・結果・客観力・地道・形", ego: "衰退と下落：無気力・憔悴・逃避・疲労・他人軸・口先" },
    "4": { mission: "特別な価値：語彙力・経験・体験・旅・世・自然・質問・希望", ego: "停滞と無視：長話・孤独・停止・静観・落胆" },
    "5": { mission: "受伝と送伝：音・文・響・芸・話・表情・情報・発信・広域", ego: "愚行と惰性：噂・悪口・疑心・秘密・否定・隠蔽" },
    "6": { mission: "安心と展開：察知・提供・準備・先見・優しさ・安心", ego: "執着と強欲：強欲・見返り・損得・慢心・傲慢・我" },
    "7": { mission: "調和と循環：同調・保護・育成・沈着・丁寧・平和", ego: "対峙と利用：差別・批判・正義・強気・緊張・焦り・適当・搾取" },
    "8": { mission: "自分と理想：哲学・追求・美学・誇り・直感・自立・行動", ego: "虚勢と仮面：利己・理屈・狡猾・虚栄・誇張" },
    "9": { mission: "未来と表現：意外・芸術・言葉・数字・気力・爆発", ego: "在り来りな：怠惰・批判・我慢・静止・怒り・放置・執着" }
  };

  const data = numerologyData[String(currentNumber)];
  if (!data) {
    return res.status(400).json({ error: '有効な数秘（1〜9）が指定されていません。' });
  }

  const prompt = `あなたは数秘術とカタカムナ音霊鑑定の奥義を極めた、慈愛に満ちた熟練カウンセラーです。
ユーザーは「${currentNumber}の音」の持ち主です。

【使命（本来の光）】: ${data.mission}
【エゴ（闇の状態）】: ${data.ego}

相談内容: 「${userText}」

以下の指針で、ユーザーの魂を震わせるような深いアドバイスを300〜500文字で作成してください。
1. 「〜というお悩みですね」「深呼吸をして〜」などの定型文は排除し、親友に語りかけるような温かい言葉で始めてください。
2. 悩みの中で、どの「エゴ」の要素が影響しているか、優しく分析してください。
3. 本来の「使命」の力を取り戻し、どう乗り越えるべきか具体的に導いてください。`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', result);
      return res.status(response.status).json({ error: result.error?.message || 'Gemini APIとの通信に失敗しました' });
    }

    const aiResponseText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponseText) {
      return res.status(500).json({ error: 'AIからの応答が空でした。' });
    }

    return res.status(200).json({ text: aiResponseText });

  } catch (error) {
    console.error('Fetch Error:', error);
    return res.status(500).json({ error: 'サーバー内部でエラーが発生しました。' });
  }
}
