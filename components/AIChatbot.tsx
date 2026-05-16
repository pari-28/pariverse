
import React, { useState, useRef, useEffect } from 'react';
import { ThemeMode } from '../types';
import { THEME_CONFIGS } from '../constants';
import { getGeminiChat } from '../geminiService';
import { useScrollLock } from '../hooks/useScrollLock';

const AIChatbot: React.FC<{ theme: ThemeMode }> = ({ theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  useScrollLock(isOpen && window.innerWidth < 1024);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: "Hi! Ask me anything about Pari's skills or experience!" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const config = THEME_CONFIGS[theme];

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      if (isOpen && isMobile) {
        document.body.classList.add('chatbot-active');
      } else {
        document.body.classList.remove('chatbot-active');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.body.classList.remove('chatbot-active');
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (isOpen && windowRef.current && !windowRef.current.contains(target) && buttonRef.current && !buttonRef.current.contains(target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) { 
      document.addEventListener('mousedown', handleClickOutside); 
      document.addEventListener('touchstart', handleClickOutside); 
    }
    return () => { 
      document.removeEventListener('mousedown', handleClickOutside); 
      document.removeEventListener('touchstart', handleClickOutside); 
    };
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!chatRef.current) chatRef.current = getGeminiChat();
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);
    try {
      const chat = chatRef.current || getGeminiChat();
      chatRef.current = chat;
      const response = await chat.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'bot', text: response.text || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: "Error connecting to Gemini." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        ref={buttonRef} 
        onClick={toggleChat} 
        className={`fixed bottom-8 right-6 lg:bottom-6 lg:right-6 w-16 h-16 lg:w-12 lg:h-12 rounded-full flex items-center justify-center text-3xl lg:text-xl shadow-2xl z-[150] transition-all duration-500 hover:scale-110 active:scale-95 group ai-chatbot-ui ${config.button} translate-x-0 opacity-100`}
      >
        {isOpen ? '✕' : '🤖'}
        {!isOpen && (
          /* Tooltip Label positioned to the LEFT of the button */
          <div 
            className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap opacity-0 md:group-hover:opacity-100 md:group-hover:-translate-x-2 transition-all duration-300 pointer-events-none backdrop-blur-md border border-white/10 shadow-2xl bg-slate-900/90 text-white flex items-center hidden md:flex"
          >
            Ask the AI Assistant
            {/* Small arrow pointing to the button */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[6px] border-l-slate-900/90" />
          </div>
        )}
      </button>

      {isOpen && (
        <div 
          ref={windowRef} 
          className={`fixed bottom-24 sm:bottom-28 lg:bottom-20 right-4 sm:right-6 lg:right-6 w-[calc(100vw-32px)] sm:w-[400px] lg:w-[395px] h-[70vh] lg:h-[48vh] max-h-[600px] lg:max-h-[520px] min-h-[400px] lg:min-h-[300px] rounded-[2rem] sm:rounded-3xl lg:rounded-2xl overflow-hidden shadow-2xl z-[150] flex flex-col border border-white/10 animate-in slide-in-from-bottom-10 fade-in duration-300 ${config.card} backdrop-blur-2xl ai-chatbot-ui`}
        >
          <div className={`p-4 lg:py-2 lg:px-4 border-b ${config.border} flex items-center justify-between bg-white/5 shrink-0 relative`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-8 lg:h-8 rounded-full flex items-center justify-center text-xl lg:text-lg shadow-inner" style={{ backgroundColor: config.primaryColor }}>🤖</div>
              <div>
                <h3 className="font-bold text-sm lg:text-[13px] leading-none">Pari's Assistant</h3>
                <p className="text-[10px] sm:text-xs lg:text-[10px] opacity-60 flex items-center gap-1 mt-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Online
                </p>
              </div>
            </div>
            <button onClick={toggleChat} className="lg:absolute lg:top-2 lg:right-2 p-2 lg:p-1.5 hover:bg-white/10 rounded-full transition-colors opacity-60 hover:opacity-100 text-base lg:text-lg leading-none flex items-center justify-center">&times;</button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 lg:px-4 lg:py-2.5 space-y-4 scrollbar-hide overscroll-contain">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[80%] lg:max-w-[85%] p-3 sm:p-4 lg:p-3 rounded-2xl text-[13px] sm:text-sm lg:text-[13px] leading-relaxed shadow-sm ${m.role === 'user' ? `${config.button.split(' ')[0]} rounded-tr-none` : 'bg-white/5 border border-white/10 rounded-tl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 p-3 rounded-2xl rounded-tl-none flex gap-1">
                  <span className="w-1.5 h-1.5 bg-current opacity-40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-current opacity-40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-current opacity-40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>
          <div className={`p-4 sm:p-5 lg:p-3 border-t ${config.border} flex gap-2 bg-white/5 shrink-0`}>
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
              placeholder="Ask anything..." 
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 sm:py-3 lg:py-2.5 text-[13px] sm:text-sm lg:text-[13px] outline-none transition-all focus:ring-2 focus:bg-white/10" 
              style={{ '--tw-ring-color': config.primaryColor } as any} 
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className={`p-2 lg:p-2 sm:p-3 rounded-xl aspect-square flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:grayscale ${config.button}`}
            >
              <span className="rotate-45 block text-lg">🚀</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
