export default async function handler(req, res) {
  // POST通信以外は弾く
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POSTメソッドのみ許可されています' });
  }

  const { userText, currentNumber } = req.body;
  // Vercelに登録するAPIキーをここで読み込みます
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'サーバー側にAPIキーが設定されていません。' });
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

  const data = numerologyData[currentNumber];
  if (!data) return res.status(400).json({ error: '無効な数秘です' });

  const prompt = `
    あなたは数秘術とカタカムナ音霊鑑定の奥義を極めた、慈愛に満ちた熟練カウンセラーです。
    ユーザーは「${currentNumber}の音」の持ち主です。
    
    【使命（本来の光）】: ${data.mission}
    【エゴ（闇の状態）】: ${data.ego}
    
    相談内容: 「${userText}」
    
    以下の指針で、ユーザーの魂を震わせるような深いアドバイスを300〜500文字で作成してください。
    1. 「〜というお悩みですね」「深呼吸をして〜」「〜に傾いているのかもしれません」などの機械的な定型文は絶対に禁止。
    2. まるで目の前で悩んでいる親友に語りかけるように、温かく人間味のある言葉で紡いでください。
    3. その悩みの中で、どの「エゴ」の要素が強く出てしまっているか、優しく論理的に分析する。
    4. 本来持っている「使命」の力を取り戻し、この悩みをどう乗り越えて「真実の自分」として輝くべきか、具体的に導く。
    5. 専門用語を並べるだけでなく、心に寄り添う温かい言葉で語りかける。
  `;

  try {
    // 安定して動作する最新モデルを直接指定
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    const result = await response.json();
    
    if (result.error) {
      return res.status(500).json({ error: result.error.message });
    }
    
    // 生成されたテキストだけをフロントに返す
    return res.status(200).json({ text: result.candidates[0].content.parts[0].text });

  } catch (error) {
    return res.status(500).json({ error: 'サーバー通信に失敗しました' });
  }
}