import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import clsx from 'clsx';
import { supabase } from '../lib/supabase';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hello! I am Toybits, your UBAY Legislative Assistant. How can I help you understand our local ordinances and resolutions today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResults, setLastResults] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const searchSupabase = async (query: string) => {
    try {
      const { data, error } = await supabase.from('legislations').select('*').limit(100);
      if (error) throw error;
      if (!data) return [];
      const lowerQ = query.toLowerCase();
      const hasPronoun = [' ani', ' ana', ' kana', ' maong', ' this', ' that', ' it', ' niya', ' niini'].some(p => lowerQ.includes(p));
      if (hasPronoun && lastResults.length > 0) return lastResults;
      const numMatch = lowerQ.match(/(?:no\.?|number|ordinance|resolution)\s*0*(\d+)/);
      if (numMatch) {
        const num = numMatch[1];
        const exact = data.filter((l: any) => {
          const ono = String(l.ordinance_no || l.number || l.ordinance_number || '').toLowerCase();
          return ono === num || ono.startsWith(num + '-') || ono.startsWith(num + ' ') || ono.includes(` ${num} `) || ono === `no. ${num}` || ono === `${num}` || String(l.id) === num;
        });
        if (exact.length > 0) return exact.slice(0, 3);
      }
      const stopWords = ['unsa', 'ang', 'sa', 'og', 'ug', 'nga', 'ni', 'na', 'no', 'kanus', 'kinsay', 'what', 'is', 'the', 'about', 'tell', 'me', 'when', 'who', 'approved', 'kani', 'ana', 'ani', 'kinsa', 'nag', 'gama'];
      const words = lowerQ.split(' ').filter((w: string) => w.length > 2 && !stopWords.includes(w));
      if (words.length === 0 && lastResults.length > 0) return lastResults;
      return data.filter((l: any) => {
        const hay = `${l.title || ''} ${l.ordinance_no || ''} ${l.description || ''} ${l.legislation_type || ''} ${l.author || ''} ${l.sponsor || ''} ${l.enacted_by || ''} ${l.proposed_by || ''}`.toLowerCase();
        return words.some((w: string) => hay.includes(w));
      }).slice(0, 5);
    } catch (e) {
      console.log('Supabase search failed', e);
      return lastResults.length > 0 ? lastResults : [];
    }
  };

  const askGroq = async (userMessage: string, context: string) => {
    const apiKey = (import.meta.env.VITE_GROQ_API_KEY || '').trim();
    if (!apiKey) return null;
    const models = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3-32b', 'moonshotai/kimi-k2-instruct'];
    for (const model of models) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: 'system', content: `You are Toybits, UBAY Legislative Assistant. Answer in SAME language as user. NEVER output any URL, link, or https:// address. NEVER mention PDF link. If user asks for PDF, just say "Tan-awa sa Legislation page". Check author, sponsor, proposed_by, enacted_by fields. If author empty, say "Wala pa nalista ang author niini sa database". NEVER invent names. Keep 3-5 sentences, no ** markdown.` },
              { role: 'user', content: `Database context (use this ONLY, NO URLs included):\n\n${context}\n\nUser question: ${userMessage}` }
            ],
            temperature: 0.1,
            max_tokens: 1000
          })
        });
        const json = await res.json();
        const text = json?.choices?.[0]?.message?.content;
        if (text) return text;
        continue;
      } catch (e) { continue; }
    }
    return null;
  };

  const askGemini = async (userMessage: string, context: string) => {
    const apiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
    if (!apiKey) return null;
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3.8-flash:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({ contents: [{ parts: [{ text: `You are Toybits. NEVER output URLs. Use ONLY: ${context} Question: ${userMessage}` }] }] })
      });
      const json = await res.json();
      return json?.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch (e) { return null; }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    try {
      const lower = userMessage.toLowerCase();
      if (['hi', 'hello', 'hai', 'hey', 'kumusta', 'hello!', 'hi!'].includes(lower)) {
        setMessages(prev => [...prev, { role: 'ai', content: `Hello! Welcome to Ubay Legislative Portal.\n\nI can help you find:\n\n- Ordinances (franchise, traffic, tax, health)\n- Resolutions\n- Session schedules\n- SB Members\n\nJust type keywords like "franchise", "tricycle", "tax", or an ordinance number!` }]);
        setIsLoading(false);
        return;
      }
      const found = await searchSupabase(userMessage);
      if (found.length > 0) setLastResults(found);
      // HIDDEN FIELDS - dili ihatag kang Groq ang URL!
      const HIDE = ['id', 'created_at', 'updated_at', 'pdf_url', 'file_url', 'file_path', 'storage_path', 'pdf_path', 'document_url', 'url', 'link', 'r2_key', 'r2_url', 'public_url'];
      const buildContext = (arr: any[]) => arr.map((l: any, i: number) => {
        const clean: any = {};
        Object.keys(l).forEach(k => {
          const lk = k.toLowerCase();
          if (HIDE.includes(lk)) return;
          if (lk.includes('url') || lk.includes('link') || lk.includes('path') || lk.includes('key')) return;
          if (l[k] !== null && l[k] !== '') clean[k] = String(l[k]).substring(0, 800);
        });
        return `Result ${i + 1}:\n${JSON.stringify(clean, null, 2)}`;
      }).join('\n\n');
      let context = 'No exact match in database.';
      if (found.length > 0) context = buildContext(found);
      else if (lastResults.length > 0) context = buildContext(lastResults);
      let aiReply = await askGroq(userMessage, context);
      if (!aiReply) aiReply = await askGemini(userMessage, context);
      // SAFETY: tangtanga ang bisan unsang link nga na-generate pa
      if (aiReply) aiReply = aiReply.replace(/https?:\/\/[^\s]+/g, '').replace(/pub-[a-z0-9]+\.r2\.dev[^\s]*/gi, '').trim();
      if (aiReply) {
        setMessages(prev => [...prev, { role: 'ai', content: aiReply }]);
      } else if (found.length > 0) {
        const first = found[0];
        const author = first.author || first.sponsor || first.proposed_by || first.enacted_by || 'Wala nalista sa database';
        setMessages(prev => [...prev, { role: 'ai', content: `${first.ordinance_no || ''} - ${first.title}\n\nAuthor: ${author}\n\n${first.description || ''}` }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: `I searched for "${userMessage}" but found no matches.\n\nTry:\n- Simpler keywords (e.g. "franchise", "traffic", "zoning")\n- Ordinance number (e.g. "05-2026")\n- Visit Legislation page: /ordinances` }]);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'ai', content: `Sorry, I encountered an error. Please try again.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{ width: 320, height: 420, maxHeight: '70vh', background: 'white', borderRadius: 16, boxShadow: '0 25px 50px rgba(0,0,0,0.3)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            <div className="bg-lgu-blue-900 text-white p-3 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <div className="bg-lgu-gold-500 p-1.5 rounded-lg">
                  <Bot className="w-5 h-5 text-lgu-blue-900" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Toybits</h3>
                  <div className="flex items-center text-xs text-lgu-gold-500">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                    AI Powered - Supabase Live
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-3 space-y-3 bg-slate-50">
              {messages.map((msg, idx) => (
                <div key={idx} className={clsx("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div style={{ maxWidth: '85%' }} className={clsx("p-3 rounded-2xl text-sm shadow-sm", msg.role === 'user' ? "bg-lgu-blue-900 text-white rounded-tr-none" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none")}>
                    {msg.role === 'ai' && <div className="flex items-center text-xs font-bold text-lgu-blue-900 uppercase tracking-wider mb-1"><Sparkles className="w-3 h-3 mr-1" /> AI Response</div>}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-slate-400 p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-xs">Searching ordinances...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-3 bg-white border-t border-slate-100 shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center space-x-2">
                <input type="text" placeholder="Ask about an ordinance..." className="flex-grow bg-slate-100 border-none rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-lgu-blue-900 outline-none" value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} />
                <button type="submit" disabled={!input.trim() || isLoading} className="bg-lgu-blue-900 text-white p-2 rounded-xl hover:bg-lgu-blue-800 transition-colors disabled:opacity-50"><Send className="w-4 h-4" /></button>
              </form>
              <p className="text-xs text-slate-400 text-center mt-2">AI can make mistakes. Verify important info with the Secretariat.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setIsOpen(!isOpen)} className={clsx("relative p-3 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center group shrink-0", isOpen ? "bg-white text-lgu-blue-900 rotate-90" : "bg-lgu-blue-900 text-white hover:scale-110")}>
        {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
        {!isOpen && <span className="absolute right-full mr-3 bg-white text-lgu-blue-900 px-3 py-1.5 rounded-lg text-sm font-bold shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-100">Ask Toybits</span>}
      </button>
    </div>
  );
}