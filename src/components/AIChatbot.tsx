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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // SEARCH SUPABASE DIRECT - NO MORE /api/ localhost!
      const { data: legislations, error } = await supabase
        .from('legislations')
        .select('*')
        .or(`title.ilike.%${userMessage}%,number.ilike.%${userMessage}%,description.ilike.%${userMessage}%,content.ilike.%${userMessage}%`)
        .limit(5);

      if (error) throw error;

      let aiResponse = '';

      if (legislations && legislations.length > 0) {
        aiResponse = `I found ${legislations.length} result(s) for "${userMessage}":\n\n`;
        legislations.forEach((l: any, i: number) => {
          aiResponse += `${i + 1}. **${l.number || l.ordinance_no} - ${l.title}**\n`;
          aiResponse += `Type: ${l.legislation_type || l.type || 'Ordinance'} | Status: ${l.status}\n`;
          aiResponse += `${(l.description || l.content || '').substring(0, 180)}...\n\n`;
        });
        aiResponse += `View full details on Legislation page.`;
      } else {
        // INTELLIGENT FALLBACK
        const lower = userMessage.toLowerCase();
        if (lower.includes('franchise')) {
          aiResponse = `**About Franchise Resolution in Ubay:**\n\nFranchise resolutions grant authority to operate tricycles, e-trikes, or business operations within Ubay.\n\nI searched the database for "${userMessage}" but no exact match was found. This might be:\n- Ordinance 05-2026 (example)\n- Or a resolution under Sangguniang Bayan sessions\n\n**What to do:**\n- Check Legislation page: /ordinances\n- Search keyword: "tricycle" or "business"\n- Contact SB Secretariat: sanggunianbayanubay@gmail.com / (038) 417-5000\n\nDo you want me to search for "tricycle" instead?`;
        } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('kumusta')) {
          aiResponse = `Hello! 👋 I can help you find:\n\n- Ordinances (franchise, traffic, tax, health)\n- Resolutions\n- Session schedules\n- SB Members\n\nJust type keywords like "franchise", "tricycle", "tax", or an ordinance number!`;
        } else {
          aiResponse = `I searched for "${userMessage}" but found no matches in our ${legislations?.length || 0} ordinances.\n\n**Try:**\n- Simpler keywords (e.g. "franchise", "traffic", "zoning")\n- Ordinance number (e.g. "05-2026")\n- Visit Legislation page: /ordinances\n\nIf you need official info, contact: sanggunianbayanubay@gmail.com`;
        }
      }

      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error: any) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { role: 'ai', content: `Sorry, I encountered an error: ${error.message}. Please try again or contact our office at (038) 417-5000.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w- sm:w- h- flex flex-col mb-4 overflow-hidden"
          >
            <div className="bg-lgu-blue-900 text-white p-4 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="bg-lgu-gold-500 p-1.5 rounded-lg">
                  <Bot className="w-5 h-5 text-lgu-blue-900" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Toybits</h3>
                  <div className="flex items-center text- text-lgu-gold-500">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                    AI Powered - Supabase Live
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50">
              {messages.map((msg, idx) => (
                <div key={idx} className={clsx("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={clsx("max-w-[85%] p-3 rounded-2xl text-sm shadow-sm", msg.role === 'user' ? "bg-lgu-blue-900 text-white rounded-tr-none" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none")}>
                    {msg.role === 'ai' && <div className="flex items-center text- font-bold text-lgu-blue-900 uppercase tracking-wider mb-1"><Sparkles className="w-3 h-3 mr-1" /> AI Response</div>}
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

            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center space-x-2">
                <input type="text" placeholder="Ask about an ordinance..." className="flex-grow bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-lgu-blue-900 outline-none" value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} />
                <button type="submit" disabled={!input.trim() || isLoading} className="bg-lgu-blue-900 text-white p-2 rounded-xl hover:bg-lgu-blue-800 transition-colors disabled:opacity-50"><Send className="w-4 h-4" /></button>
              </form>
              <p className="text- text-slate-400 text-center mt-2">AI can make mistakes. Verify important info with the Secretariat.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => setIsOpen(!isOpen)} className={clsx("p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center group", isOpen ? "bg-white text-lgu-blue-900 rotate-90" : "bg-lgu-blue-900 text-white hover:scale-110")}>
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && <span className="absolute right-full mr-4 bg-white text-lgu-blue-900 px-3 py-1.5 rounded-lg text-sm font-bold shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-slate-100">Ask Toybits</span>}
      </button>
    </div>
  );
}