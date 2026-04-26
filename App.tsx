/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gem, 
  History, 
  ArrowLeft, 
  Send, 
  Trash2, 
  Clock, 
  Sparkles, 
  Pen,
  Moon
} from 'lucide-react';

// --- Constants & Data ---
const charValues: Record<string, number> = { 
  'あ': 18, 'い': 5, 'う': 19, 'え': 43, 'お': 40, 
  'か': 25, 'き': 29, 'く': 11, 'け': 35, 'こ': 16, 
  'さ': 28, 'し': 23, 'す': 21, 'せ': 36, 'そ': 30, 
  'た': 26, 'ち': 27, 'つ': 44, 'て': 9, 'と': 17, 
  'な': 14, 'に': 32, 'ぬ': 39, 'ね': 46, 'の': 20, 
  'は': 42, 'ひ': 1, 'ふ': 2, 'へ': 22, 'ほ': 47, 
  'ま': 6, 'み': 3, 'む': 13, 'め': 10, 'も': 33, 
  'や': 15, 'ゆ': 37, 'よ': 4, 'ら': 31, 'り': 8, 
  'る': 12, 'れ': 24, 'ろ': 34, 'わ': 7, 'ん': 48, 
};

const dakutenMap: Record<string, string> = {
  'が': 'か', 'ぎ': 'き', 'ぐ': 'く', 'げ': 'け', 'ご': 'こ',
  'ざ': 'さ', 'じ': 'し', 'ず': 'す', 'ぜ': 'せ', 'ぞ': 'そ',
  'だ': 'た', 'ぢ': 'ち', 'づ': 'つ', 'で': 'て', 'ど': 'と',
  'ば': 'は', 'び': 'ひ', 'ぶ': 'ふ', 'べ': 'へ', 'ぼ': 'ほ',
};

const handakutenMap: Record<string, string> = {
  'ぱ': 'は', 'ぴ': 'ひ', 'ぷ': 'ふ', 'ぺ': 'へ', 'ぽ': 'ほ',
};

const keywordsData: Record<number, { m: string; e: string }> = {
  1: { m: "本質・本物・根源", e: "迷走・保留・依頼心" },
  2: { m: "整理・要約・適格", e: "雑・散漫・慢心" },
  3: { m: "具現・学習・技術", e: "無気力・憔悴・逃避" },
  4: { m: "語彙力・経験・体験", e: "長話・孤独・停止" },
  5: { m: "音・文・響・芸", e: "噂・悪口・疑心" },
  6: { m: "察知・提供・準備", e: "強欲・見返り・損得" },
  7: { m: "同調・保護・育成", e: "差別・批判・強気" },
  8: { m: "哲学・追求・美学", e: "利己・理屈・虚栄" },
  9: { m: "意外・芸術・言葉", e: "怠惰・批判・執着" }
};

interface Message {
  role: 'app' | 'user';
  text: string;
}

interface Session {
  id: string;
  name: string;
  num: number;
  keywords: { m: string; e: string };
  messages: Message[];
  date: string;
}

const STORAGE_KEY = 'shimei_history';

export default function App() {
  const [name, setName] = useState('');
  const [currentNum, setCurrentNum] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatMode, setIsChatMode] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<Session[]>([]);
  const [view, setView] = useState<'main' | 'history' | 'detail'>('main');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [lastQuestion, setLastQuestion] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  // --- Logic ---
  const saveSession = (updatedMessages: Message[], num: number, sessionName: string, sessionId: string) => {
    const session: Session = {
      id: sessionId,
      name: sessionName,
      num: num,
      keywords: keywordsData[num],
      messages: updatedMessages,
      date: new Date().toISOString()
    };

    setHistory(prev => {
      const idx = prev.findIndex(s => s.id === sessionId);
      let newList;
      if (idx >= 0) {
        newList = [...prev];
        newList[idx] = session;
      } else {
        newList = [session, ...prev];
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    });
  };

  const calculateNumber = (inputName: string): number | null => {
    const cleanName = [...inputName].filter(ch =>
      charValues[ch] !== undefined ||
      dakutenMap[ch] !== undefined ||
      handakutenMap[ch] !== undefined
    );
    if (!cleanName.length) return null;

    let total = 0;
    for (const char of cleanName) {
      if (dakutenMap[char]) total -= charValues[dakutenMap[char]] ?? 0;
      else if (handakutenMap[char]) total += charValues[handakutenMap[char]] ?? 0;
      else total += charValues[char] ?? 0;
    }
    total = Math.abs(total);
    while (total >= 10) {
      total = total.toString().split('').map(Number).reduce((a, b) => a + b, 0);
    }
    return total;
  };

  const handleStartAppraisal = (targetNum?: number) => {
    let num = targetNum;
    let displayName = name;

    if (num === undefined) {
      const calculated = calculateNumber(name);
      if (calculated === null) return;
      num = calculated === 0 ? 9 : calculated;
      if (num === undefined) return;
    } else {
      displayName = `数秘 ${num} の方`;
    }

    const sessionId = Date.now().toString();
    const firstMsg: Message = {
      role: 'app',
      text: `鑑定が完了しました。あなたの「音」に刻まれた数字は「${num}」です。\nこの数字が示す使命をふまえ、あなたのお悩みについて深く読み解いていきましょう。具体的に気になっていることはありますか？`
    };

    setCurrentNum(num);
    setCurrentSessionId(sessionId);
    setName(displayName);
    setMessages([firstMsg]);
    setIsChatMode(false); // Start with appraisal result view
    saveSession([firstMsg], num, displayName, sessionId);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || currentNum === null || !currentSessionId) return;

    const userText = chatInput.trim();
    const newUserMsg: Message = { role: 'user', text: userText };
    const updatedMessages = [...messages, newUserMsg];
    
    setMessages(updatedMessages);
    setChatInput('');
    setIsChatMode(true);
    setLastQuestion(userText);
    saveSession(updatedMessages, currentNum, name, currentSessionId);

    setIsTyping(true);

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userText,
          currentNumber: currentNum,
          history: messages.slice(-5) // Send last few messages for context
        })
      });

      const data = await response.json();
      setIsTyping(false);

      if (data.text) {
        const appMsg: Message = { role: 'app', text: data.text };
        const finalMessages = [...updatedMessages, appMsg];
        setMessages(finalMessages);
        saveSession(finalMessages, currentNum, name, currentSessionId);
      } else {
        addErrorMessage("現在アクセスが集中しています。しばらくしてからもう一度お試しください。");
      }
    } catch (e) {
      setIsTyping(false);
      addErrorMessage("現在アクセスが集中しています。しばらくしてからもう一度お試しください。");
    }
  };

  const addErrorMessage = (text: string) => {
    const errorMsg: Message = { role: 'app', text };
    setMessages(prev => [...prev, errorMsg]);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newList = history.filter(s => s.id !== id);
    setHistory(newList);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
  };

  const openDetail = (session: Session) => {
    setSelectedSession(session);
    setView('detail');
  };

  const resetApp = () => {
    setName('');
    setCurrentNum(null);
    setMessages([]);
    setIsChatMode(false);
    setCurrentSessionId(null);
    setView('main');
  };

  // --- Render Helpers ---
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="flex justify-center items-center h-screen w-screen bg-paper overflow-hidden font-sans">
      <div className="w-full max-w-[500px] h-[98vh] bg-white flex flex-col rounded-3xl shadow-2xl overflow-hidden relative border border-black/5">
        
        {/* --- History List Panel --- */}
        <AnimatePresence>
          {view === 'history' && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-50 bg-paper flex flex-col"
            >
              <div className="bg-gradient-to-br from-navy to-navy-light text-white p-5 flex items-center gap-3">
                <button onClick={() => setView('main')} className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-lg flex items-center gap-2"><Clock size={18} className="text-gold" /> 鑑定履歴</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.length === 0 ? (
                  <div className="text-center text-gray-400 mt-16 space-y-3">
                    <Moon size={48} className="mx-auto opacity-20" />
                    <p className="text-sm leading-relaxed">まだ鑑定履歴がありません。<br />名前を入力して最初の鑑定を始めましょう。</p>
                  </div>
                ) : (
                  history.map(session => (
                    <div 
                      key={session.id} 
                      onClick={() => openDetail(session)}
                      className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-gold flex justify-between items-center cursor-pointer hover:translate-x-1 transition-transform group"
                    >
                      <div className="flex-1">
                        <div className="font-bold text-navy">{session.name}</div>
                        <div className="text-xs text-gray-400 mt-1">{formatDate(session.date)} ・ {session.messages.length}件</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold to-gold-dark text-white flex items-center justify-center font-display text-xl font-bold shadow-md">
                          {session.num}
                        </div>
                        <button 
                          onClick={(e) => deleteSession(session.id, e)}
                          className="text-gray-300 hover:text-red-500 p-2 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- History Detail Panel --- */}
        <AnimatePresence>
          {view === 'detail' && selectedSession && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[60] bg-white flex flex-col"
            >
              <div className="bg-gradient-to-br from-navy to-navy-light text-white p-4 flex items-center gap-3">
                <button onClick={() => setView('history')} className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                  <ArrowLeft size={18} />
                </button>
                <h2 className="flex-1 text-base truncate">{selectedSession.name}</h2>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark text-white flex items-center justify-center font-display text-lg font-bold">
                  {selectedSession.num}
                </div>
              </div>
              <div className="bg-navy text-white/80 px-4 py-2 text-xs flex gap-4">
                <span><span className="text-blue-300 font-bold">【使命】</span> {selectedSession.keywords.m}</span>
                <span><span className="text-yellow-400 font-bold">【エゴ】</span> {selectedSession.keywords.e}</span>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-paper/30">
                {selectedSession.messages.map((msg, i) => (
                  <div key={i} className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'ml-auto bg-gradient-to-br from-navy to-navy-light text-white rounded-br-none' 
                      : 'bg-white border border-gray-100 shadow-sm rounded-bl-none'
                  }`}>
                    {msg.text.split('\n').map((line, j) => <p key={j}>{line}</p>)}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Main Header --- */}
        <header className={`bg-gradient-to-br from-navy to-navy-light text-white transition-all duration-500 relative z-10 ${
          isChatMode ? 'p-3' : 'p-6 pb-8'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h1 
              onClick={resetApp}
              className={`flex items-center gap-2 cursor-pointer transition-all ${isChatMode ? 'text-lg' : 'text-2xl'}`}
            >
              <Gem className="text-gold" size={isChatMode ? 20 : 28} /> 使命鑑定ナビ
            </h1>
            <button 
              onClick={() => setView('history')}
              className="bg-white/10 border border-white/20 px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 hover:bg-white/20 transition-colors"
            >
              <History size={14} /> 履歴
            </button>
          </div>

          {/* Appraisal Result Badge */}
          <AnimatePresence>
            {currentNum !== null && (
              <motion.div 
                initial={{ scale: 0, opacity: 0, x: 50, y: -50 }}
                animate={{ 
                  scale: isChatMode ? 0.6 : 1, 
                  opacity: 1, 
                  x: 0, 
                  y: 0,
                  top: isChatMode ? 12 : 45,
                  right: isChatMode ? 15 : 40
                }}
                className="absolute bg-gradient-to-br from-gold to-gold-dark rounded-full flex flex-col items-center justify-center border-4 border-white shadow-[0_0_30px_rgba(212,175,55,0.6)] z-30"
                style={{ 
                  width: isChatMode ? 80 : 120, 
                  height: isChatMode ? 80 : 120,
                  position: 'absolute'
                }}
              >
                <span className={`font-bold text-white/90 tracking-widest ${isChatMode ? 'text-[8px]' : 'text-[10px]'}`}>あなたの音</span>
                <span className={`font-display font-bold text-white leading-none drop-shadow-md ${isChatMode ? 'text-4xl' : 'text-6xl'}`}>
                  {currentNum}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Area (Initial) */}
          {!currentNum && (
            <div className="mt-6 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="お名前（例:やまだはなこ）"
                  className="w-[90%] px-5 py-3 rounded-full border-2 border-white/20 bg-white/10 text-white placeholder:text-white/40 text-center text-lg font-klee outline-none focus:border-gold transition-colors"
                />
                <button 
                  onClick={() => handleStartAppraisal()}
                  className="bg-gold hover:bg-gold-dark text-navy px-8 py-3 rounded-full font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  <Sparkles size={18} /> 音を導き出す
                </button>
              </div>

              {/* --- NEW: 1-9 Number Buttons --- */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-center text-xs text-white/50 mb-3">自分の数字を知っている方はこちら</p>
                <div className="grid grid-cols-5 gap-2 px-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                    <button
                      key={n}
                      onClick={() => handleStartAppraisal(n)}
                      className="aspect-square rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-display text-lg font-bold hover:bg-gold hover:text-navy transition-all active:scale-90"
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Keyword Info */}
          {currentNum !== null && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white/10 backdrop-blur-sm p-3 rounded-2xl text-sm transition-all ${
                isChatMode ? 'w-[calc(100%-90px)]' : 'w-[85%] mt-4'
              }`}
            >
              <div className="flex flex-col gap-1">
                <span><span className="text-blue-300 font-bold">【使命】</span> {keywordsData[currentNum].m}</span>
                <span><span className="text-yellow-400 font-bold">【エゴ】</span> {keywordsData[currentNum].e}</span>
              </div>
            </motion.div>
          )}

          {/* Question Banner */}
          <AnimatePresence>
            {isChatMode && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 pt-3 border-t border-dashed border-gold/30"
              >
                <div className="text-[10px] text-gold font-bold uppercase tracking-wider flex items-center gap-1 mb-1">
                  <Pen size={10} /> あなたの相談内容
                </div>
                <div className="text-sm font-bold text-white line-clamp-2 leading-relaxed">
                  {lastQuestion}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* --- Chat Container --- */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#FAFCFD]">
          {messages.length === 0 && !currentNum && (
            <div className="bg-white border border-gray-100 p-5 rounded-2xl shadow-sm rounded-bl-none text-sm leading-relaxed text-navy/80">
              こんにちは。<br />あなたの「音」に刻まれた使命を解き明かし、魂が望む未来への道標をお渡しします。<br />まずはお名前（例:やまだはなこ）を入力するか、ご自身の数字を直接選んでください。
            </div>
          )}
          
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`max-w-[90%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'ml-auto bg-gradient-to-br from-navy to-navy-light text-white rounded-br-none' 
                  : 'bg-white border border-gray-100 rounded-bl-none'
              }`}
            >
              {msg.text.split('\n').map((line, j) => <p key={j} className={j > 0 ? 'mt-2' : ''}>{line}</p>)}
            </motion.div>
          ))}

          {isTyping && (
            <div className="flex gap-1.5 p-4 bg-white border border-gray-100 rounded-2xl rounded-bl-none w-16 shadow-sm">
              <motion.span animate={{ scale: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.4, times: [0, 0.4, 1] }} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
              <motion.span animate={{ scale: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.4, times: [0, 0.4, 1], delay: 0.2 }} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
              <motion.span animate={{ scale: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.4, times: [0, 0.4, 1], delay: 0.4 }} className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* --- Input Area --- */}
        <div className="p-4 border-t border-gray-100 bg-white flex gap-3">
          <input 
            type="text" 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={currentNum ? "お悩みをご相談ください..." : "まずは鑑定を始めてください"}
            disabled={!currentNum}
            className="flex-1 px-5 py-3 rounded-full border border-gray-200 outline-none focus:border-gold transition-colors text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!currentNum || !chatInput.trim()}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-dark text-white flex items-center justify-center shadow-lg active:scale-90 transition-all disabled:opacity-50 disabled:grayscale"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
