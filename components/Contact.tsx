
import React, { useState, useEffect } from 'react';
import { ThemeMode, ContactData } from '../types';
import { THEME_CONFIGS } from '../constants';
import { trackEvent } from '../analyticsService';
import DeleteConfirmModal from './DeleteConfirmModal';

const ICONS = {
  LinkedIn: (
    <svg viewBox="0 0 24 24" fill="#0077B5" className="w-8 h-8">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
  ),
  GitHub: (
    <svg viewBox="0 0 24 24" fill="#181717" className="w-8 h-8">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  LeetCode: (
    <svg viewBox="0 0 24 24" fill="#FFA116" className="w-8 h-8">
      <path d="M16.102 17.93l-2.697 2.607c-.466.467-1.111.662-1.823.662s-1.357-.195-1.824-.662l-4.332-4.363c-.467-.467-.702-1.15-.702-1.863s.235-1.357.702-1.824l4.332-4.363c.467-.467 1.112-.662 1.824-.662s1.356.195 1.823.662l2.697 2.606c.514.515 1.335.515 1.849 0 0 0 .513-.513.513-1.849 0-1.335-.513-1.848-.513-1.848l-2.697-2.606c-1.494-1.494-3.628-2.437-5.973-2.437s-4.479.943-5.973 2.437l-4.332 4.363c-1.494 1.494-2.438 3.628-2.438 5.973s.944 4.479 2.438 5.973l4.332 4.363c1.494 1.494 3.628 2.438 5.973 2.438s4.479-.944 5.973-2.438l2.697-2.606c.514-.515.514-1.335 0-1.849 0 0-.513-.513-1.849-.513s-1.848.513-1.848.513z"/>
      <path d="M22.103 11.562l-2.697-2.606c-.514-.515-1.335-.515-1.849 0-.514.514-.514 1.334 0 1.848l2.697 2.607c.514.514 1.334.514 1.848 0 .515-.514.515-1.335 0-1.849z"/>
    </svg>
  ),
  Instagram: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  ),
  Mail: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
      <polyline points="22,6 12,13 2,6"></polyline>
    </svg>
  ),
  External: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  ),
  Codeforces: (
    <svg viewBox="0 0 24 24" fill="#1f8acb" className="w-8 h-8">
       <path d="M4.5 7.5c-.828 0-1.5.672-1.5 1.5v10.5c0 .828.672 1.5 1.5 1.5h3c.828 0 1.5-.672 1.5-1.5v-10.5c0-.828-.672-1.5-1.5-1.5h-3zm9-4.5c-.828 0-1.5.672-1.5 1.5v15c0 .828.672 1.5 1.5 1.5h3c.828 0 1.5-.672 1.5-1.5v-15c0-.828-.672-1.5-1.5-1.5h-3zm9 7.5c-.828 0-1.5.672-1.5 1.5v7.5c0 .828.672 1.5 1.5 1.5h3c.828 0 1.5-.672 1.5-1.5v-7.5c0-.828-.672-1.5-1.5-1.5h-3z"/>
    </svg>
  ),
  CodeChef: (
    <svg viewBox="0 0 24 24" fill="#5b4638" className="w-8 h-8">
      <path d="M21 12l-3-3v2h-3.17c-.41-1.16-1.52-2-2.83-2s-2.42.84-2.83 2h-3.17v-2l-3 3 3 3v-2h3.17c.41 1.16 1.52 2 2.83 2s2.42-.84 2.83-2h3.17v2l3-3z"/>
    </svg>
  ),
  HackerRank: (
    <svg viewBox="0 0 24 24" fill="#2ec866" className="w-8 h-8">
       <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-4 17h-1v-10h1v10zm9 0h-1v-3.5c0-1.381-1.119-2.5-2.5-2.5s-2.5 1.119-2.5 2.5v3.5h-1v-10h1v3.5c0 .276.224.5.5.5s.5-.224.5-.5v-3.5h1v3.5c0 1.381 1.119 2.5 2.5 2.5s2.5-1.119 2.5-2.5v-3.5h1v10z"/>
    </svg>
  ),
  Portfolio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  )
};

interface Message {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  read: boolean;
  createdAt: any;
}

const Contact: React.FC<{ 
  theme: ThemeMode; 
  isAdmin: boolean; 
  data: ContactData; 
  onUpdate: (d: ContactData) => void;
  title: string;
  subtext: string;
  onTitleUpdate: () => void;
  onNavigate: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}> = ({ theme, isAdmin, data, onUpdate, title, subtext, onTitleUpdate, onNavigate, showToast }) => {
  const config = THEME_CONFIGS[theme];
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<ContactData>(data);
  const [showInbox, setShowInbox] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);

  // 1. Initialize EmailJS with Public Key
  useEffect(() => {
    const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";
    if ((window as any).emailjs) {
      if (PUBLIC_KEY) (window as any).emailjs.init(PUBLIC_KEY);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && showInbox) {
      const { firebase } = window as any;
      if (!firebase) return;

      const q = firebase.query(
        firebase.collection(firebase.db, 'messages'),
        firebase.orderBy('createdAt', 'desc')
      );

      const unsubscribe = firebase.onSnapshot(q, (snapshot: any) => {
        const msgList: Message[] = [];
        snapshot.forEach((doc: any) => {
          msgList.push({ id: doc.id, ...doc.data() });
        });
        setMessages(msgList);
      });

      return () => unsubscribe();
    }
  }, [isAdmin, showInbox]);

  const socialLinks = [
    { name: 'LinkedIn', icon: ICONS.LinkedIn, url: data.linkedin },
    { name: 'GitHub', icon: ICONS.GitHub, url: data.github },
    { name: 'LeetCode', icon: ICONS.LeetCode, url: data.leetcode },
    ...(data.codeforces ? [{ name: 'Codeforces', icon: ICONS.Codeforces, url: data.codeforces }] : []),
    { name: 'Instagram', icon: ICONS.Instagram, url: data.instagram },
    ...(data.additionalLinks || []).map(link => ({
      name: link.name,
      icon: (ICONS as any)[link.icon || 'External'] || ICONS.External,
      url: link.url
    }))
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { firebase } = window as any;
    const emailjs = (window as any).emailjs;
    if (!firebase || !emailjs) return;

    setStatus('sending');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;
    const subject = formData.get('subject') as string;

    if (!name || !email || !message) {
      showToast("Please fill in all required fields.", "error");
      setStatus('idle');
      return;
    }

    try {
      const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "";
      const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "";

      if (!SERVICE_ID || !TEMPLATE_ID) {
        throw new Error("EmailJS Service ID or Template ID is missing.");
      }

      // Logic fix: Keys strictly matching EmailJS template: name, email, subject, message, time
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          name: name,
          email: email, 
          subject: subject, 
          message: message,
          time: new Date().toLocaleString()
        }
      );
      console.log("EmailJS success");

    const msgData = {
        name,
        email,
        subject,
        message,
        read: false,
        replied: false,
        metadata: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenRes: `${window.screen.width}x${window.screen.height}`,
          referrer: document.referrer || 'direct'
        },
        createdAt: firebase.serverTimestamp()
      };
      
      const docRef = await firebase.addDoc(firebase.collection(firebase.db, 'messages'), msgData);
      console.log("Firebase sync success: Message ID " + docRef.id);

      // Google Apps Script integration
      try {
        const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || "";
        if (SCRIPT_URL) {
          await fetch(SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            subject,
            message,
            timestamp: new Date().toLocaleString(),
            id: docRef.id
          }),
        });
        console.log("Google Sheets sync success");
        }
      } catch (sheetError) {
        console.log("Google Sheets sync failed", sheetError);
      }

      setStatus('success');
      showToast("Message sent successfully!", "success");
      form.reset();
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error("Pipeline Failure:", error);
      setStatus('error');
      showToast("Failed to send message.", "error");
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    const { firebase } = window as any;
    if (!firebase) return;
    try {
      const docRef = firebase.doc(firebase.db, 'messages', id);
      await firebase.updateDoc(docRef, { read: true });
    } catch (error) {
      console.error("Failed to update message status:", error);
    }
  };

  /**
   * REFINED DELETE LOGIC (Sandbox-safe)
   */
  const handleDeleteMessage = (id: string) => {
    setDeletingMessageId(id);
  };

  const confirmDeleteMessage = async () => {
    if (!deletingMessageId) return;
    const id = deletingMessageId;
    setDeletingMessageId(null);

    const { firebase, auth } = window as any;
    
    if (!auth || !firebase) {
      console.error("Firebase instances missing.");
      return;
    }

    const currentUser = auth.currentUser;
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || "";

    // 1. Admin Session Restriction (Double check before actual delete)
    if (!currentUser || (adminEmail && currentUser.email !== adminEmail)) {
      console.error("Deletion blocked: Unauthorized user account.");
      showToast("Permission denied: Admin only.", "error");
      return;
    }

    // 2. Logging & Logic
    console.log("Attempting delete for document ID: " + id);
    
    // UI Instant Filter for "Zero Latency" feel
    setMessages(prev => prev.filter(m => m.id !== id));
    
    try {
      const { db, doc, deleteDoc } = firebase;
      const docRef = doc(db, 'messages', id);
      await deleteDoc(docRef);
      
      console.log("Firestore document " + id + " permanently removed.");
      showToast("Message deleted.", "info");
    } catch (error) {
      console.error("Firestore Delete Request Failed:", error);
      showToast("Delete failed. Check console.", "error");
    }
  };

  const handleReply = async (msg: Message) => {
    const { firebase } = window as any;
    if (firebase) {
      try {
        const docRef = firebase.doc(firebase.db, 'messages', msg.id);
        await firebase.updateDoc(docRef, { replied: true });
      } catch (error) {
        console.error("Failed to update reply status:", error);
      }
    }
    const subjectLine = encodeURIComponent(`Re: Portfolio Message - ${msg.subject || 'Inquiry'}`);
    const bodyContent = encodeURIComponent(
      `--- Original Message ---\n` +
      `From: ${msg.name}\n` +
      `${msg.message}`
    );
    window.location.href = `mailto:${msg.email}?subject=${subjectLine}&body=${bodyContent}`;
  };

  const handleSave = () => {
    onUpdate(editForm);
    setIsEditing(false);
  };

  const dividerBg = config.accent.includes('gradient') 
    ? config.accent.replace('text-transparent', '').replace('bg-clip-text', '')
    : config.accent.replace('text-', 'bg-');

  const inputClasses = `
    w-full border outline-none transition-all focus:ring-2 px-5 py-4 rounded-2xl
    ${theme === 'light' 
      ? 'bg-white/60 border-black/10 text-slate-600 placeholder:text-slate-400 backdrop-blur-sm' 
      : 'bg-black/30 border-white/10 text-white placeholder:text-white/40 backdrop-blur-sm'
    }
  `;

  const glassContainerClasses = `
    p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border shadow-xl backdrop-blur-xl transition-all
    ${theme === 'light'
      ? 'bg-white/40 border-white/60 shadow-gray-200/50'
      : 'bg-white/[0.03] border-white/10 shadow-black/40'
    }
  `;

  return (
    <section id="contact" className="min-h-screen w-full py-20 flex flex-col justify-center">
      <div className="mb-10 reveal flex flex-col md:flex-row justify-between items-start md:items-end max-w-5xl mx-auto w-full px-6 md:px-0 gap-6 md:gap-0">
        <div>
          <div className="flex items-center gap-3 relative">
            <h2 
              onClick={onNavigate}
              className={`text-3xl font-extrabold tracking-tight cursor-pointer hover:opacity-80 transition-all ${config.accent}`}
            >
              {title}
            </h2>
            {isAdmin && (
              <button 
                onClick={onTitleUpdate}
                className="p-1 rounded bg-indigo-500/20 text-indigo-500 hover:bg-indigo-500/40 transition-colors text-[14px]"
              >
                ✎
              </button>
            )}
          </div>
          <div className={`w-24 h-[1px] my-4 opacity-30 ${dividerBg}`} />
          <p className={`text-sm opacity-60 font-medium ${theme === 'light' ? 'text-slate-500' : ''}`}>{subtext}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-4">
            <button 
              onClick={() => setShowInbox(true)} 
              className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-bold shadow-lg flex items-center gap-2"
            >
              📫 INBOX {messages.filter(m => !m.read).length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 rounded-full">{messages.filter(m => !m.read).length}</span>}
            </button>
            <button 
              onClick={() => { setEditForm(data); setIsEditing(true); }} 
              className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-bold shadow-lg"
            >
              EDIT CONTENT
            </button>
          </div>
        )}
      </div>

      <div className={`reveal p-4 sm:p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border shadow-2xl transition-all ${config.card} max-w-5xl mx-auto w-full`}>
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="flex flex-col h-full w-full overflow-hidden">
            <h2 className={`text-2xl md:text-3xl lg:text-4xl font-extrabold mb-4 tracking-tight ${config.accent}`}>
              {data.title}
            </h2>
            <p className={`text-base md:text-lg opacity-80 leading-relaxed mb-6 ${theme === 'light' ? 'text-slate-600' : ''}`}>
              {data.description}
            </p>
            
            <div className="space-y-4 w-full">
              <a 
                href={`mailto:${data.email}`} 
                className={`group flex items-center gap-3 md:gap-4 p-3 md:p-2 rounded-2xl md:rounded-[2rem] border transition-all hover:bg-white/5 ${config.border} w-full overflow-hidden`}
                style={{ color: config.primaryColor }}
              >
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center ${theme === 'light' ? 'bg-black/10' : 'bg-white/5'} border border-white/10 group-hover:scale-110 transition-transform shrink-0`}>
                  {ICONS.Mail}
                </div>
                <div className="flex flex-col min-w-0 overflow-hidden">
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] opacity-40 mb-1 ${theme === 'light' ? 'text-slate-400' : ''}`}>Send an Email</span>
                  <span className={`text-xs sm:text-sm md:text-lg font-bold break-all md:truncate ${theme === 'light' ? 'text-black' : ''}`}>{data.email}</span>
                </div>
              </a>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {socialLinks.map(social => (
                  <a 
                    key={social.name} 
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2.5 rounded-[1.25rem] md:rounded-[1.5rem] border flex items-center gap-3 ${config.border} hover:bg-white/5 transition-all group active:scale-[0.98] shadow-sm w-full overflow-hidden`}
                    style={{ color: config.primaryColor }}
                    onClick={() => trackEvent(`${social.name.toLowerCase()}_click`, { type: 'social', id: social.name })}
                  >
                    <div className="group-hover:scale-110 transition-transform shrink-0 scale-90 md:scale-100">
                      {social.icon}
                    </div>
                    <span className={`text-sm md:text-base font-extrabold tracking-tight truncate ${theme === 'light' ? 'text-black' : ''}`}>{social.name}</span>
                  </a>
                ))}
              </div>
            </div>

            <div 
              className="mt-auto pt-6 border-t" 
              style={{ 
                borderTopColor: theme === 'light' ? 'rgba(0,0,0,0.1)' : 
                  theme === 'yellow' ? 'rgba(253, 230, 138, 0.4)' : 
                  theme === 'gradient' ? 'rgba(216, 180, 254, 0.4)' : 
                  theme === 'navy' ? 'rgba(100, 255, 218, 0.4)' : 
                  'rgba(196, 181, 253, 0.4)'
              }}
            >
              <p className={`text-sm italic opacity-50 leading-relaxed max-w-sm ${theme === 'light' ? 'text-slate-500' : ''}`}>
                “{data.quoteText}”
              </p>
              <p className={`mt-1.5 text-[9px] font-black uppercase tracking-[0.3em] opacity-30 ${theme === 'light' ? 'text-slate-400' : ''}`}>
                — {data.quoteAuthor}
              </p>
            </div>
          </div>

          <div className="mt-8 lg:mt-0">
            <h3 className={`text-xl font-bold mb-5 opacity-90 px-2 ${theme === 'light' ? 'text-black' : ''}`}>Send a Message</h3>
            <div 
              className={glassContainerClasses}
              style={{ borderTopWidth: '6px', borderTopColor: `${config.primaryColor}bb` }}
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input name="name" type="text" className={inputClasses.replace('py-4', 'py-3.5')} placeholder="Name" required />
                  <input name="email" type="email" className={inputClasses.replace('py-4', 'py-3.5')} placeholder="Email" required />
                </div>
                <input name="subject" type="text" className={inputClasses.replace('py-4', 'py-3.5')} placeholder="Subject" />
                <textarea name="message" rows={4} className={inputClasses.replace('py-4', 'py-3.5')} placeholder="Message" required />
                <button type="submit" disabled={status === 'sending'} className={`w-full py-4 rounded-2xl md:rounded-[1.5rem] font-bold text-base shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${status === 'success' ? 'bg-emerald-500 text-white' : status === 'error' ? 'bg-red-500 text-white' : config.button}`}>
                  {status === 'idle' && <>Send 🚀</>}
                  {status === 'sending' && <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> ...</>}
                  {status === 'success' && <>Success ✅</>}
                  {status === 'error' && <>Error</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Inbox Modal */}
      {isAdmin && showInbox && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md detail-view-container" onClick={() => setShowInbox(false)} />
          <div className={`relative w-full max-w-3xl max-h-[95vh] lg:max-h-[90vh] p-6 lg:p-8 rounded-[2.5rem] lg:rounded-[3rem] border shadow-2xl flex flex-col overflow-hidden ${config.card} text-white`}>
            <div className="flex justify-between items-center mb-6 lg:mb-8">
              <h3 className="text-2xl lg:text-3xl font-extrabold tracking-tight">Message Inbox</h3>
              <button 
                onClick={() => setShowInbox(false)} 
                className="p-3 lg:p-2 rounded-full hover:bg-white/10 opacity-70 hover:opacity-100 transition-all active:scale-90"
                aria-label="Close inbox"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide no-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
              {messages.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center opacity-30 italic">
                  <span className="text-4xl mb-4">📭</span>
                  No messages yet.
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    data-id={msg.id}
                    className={`p-6 rounded-2xl border transition-all ${
                      msg.read ? 'bg-white/5 border-white/5 opacity-70' : 'bg-indigo-500/10 border-indigo-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-lg flex items-center gap-2">
                          {msg.name} {!msg.read && <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />}
                        </p>
                        <p className="text-xs opacity-50 font-medium">{msg.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] opacity-40 uppercase font-black">
                          {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                        </span>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => handleReply(msg)}
                             className={`text-[10px] font-black uppercase transition-colors ${msg.replied ? 'text-gray-400 opacity-50' : 'text-emerald-400 hover:text-emerald-300'}`}
                           >
                             {msg.replied ? 'Replied' : 'Reply'}
                           </button>
                           {!msg.read && (
                             <button 
                               onClick={() => handleMarkAsRead(msg.id)}
                               className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-300 transition-colors"
                             >
                               Mark as Read
                             </button>
                           )}
                           <button 
                             onClick={() => handleDeleteMessage(msg.id)}
                             className="text-[10px] font-black uppercase text-red-400 hover:text-red-300 transition-colors"
                           >
                             Delete
                           </button>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm leading-relaxed opacity-90 whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Content Editor Modal */}
      {isAdmin && isEditing && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm detail-view-container" onClick={() => setIsEditing(false)} />
          <div className={`relative w-full max-w-2xl p-6 lg:p-8 rounded-[2rem] border shadow-2xl overflow-hidden max-h-[95vh] lg:max-h-[90vh] ${config.card} text-white flex flex-col`}>
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h3 className="text-2xl font-bold text-white">Edit Contact Section</h3>
              <button onClick={() => setIsEditing(false)} className="p-2 rounded-full hover:bg-white/10 opacity-70 lg:hidden">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 no-scrollbar custom-scrollbar" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white mb-2 block">Hero Title</label>
                  <input 
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" 
                    value={editForm.title} 
                    onChange={e => setEditForm({...editForm, title: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white mb-2 block">Primary Email</label>
                  <input 
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" 
                    value={editForm.email} 
                    onChange={e => setEditForm({...editForm, email: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white mb-2 block">Description Text</label>
                <textarea 
                  className="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" 
                  rows={3} 
                  value={editForm.description} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white mb-2 block">LinkedIn URL</label>
                  <input 
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" 
                    value={editForm.linkedin} 
                    onChange={e => setEditForm({...editForm, linkedin: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white mb-2 block">GitHub URL</label>
                  <input 
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" 
                    value={editForm.github} 
                    onChange={e => setEditForm({...editForm, github: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white mb-2 block">LeetCode URL</label>
                  <input 
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" 
                    value={editForm.leetcode} 
                    onChange={e => setEditForm({...editForm, leetcode: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white mb-2 block">Codeforces URL</label>
                  <input 
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" 
                    value={editForm.codeforces || ''} 
                    onChange={e => setEditForm({...editForm, codeforces: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest opacity-60 text-white mb-2 block">Instagram URL</label>
                  <input 
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" 
                    value={editForm.instagram} 
                    onChange={e => setEditForm({...editForm, instagram: e.target.value})} 
                  />
                </div>
              </div>

              <div className="p-4 rounded-[1.5rem] bg-black/20 border border-white/5 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Career Quote</h4>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-white mb-2 block">Quote Text</label>
                  <textarea 
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" 
                    rows={2} 
                    value={editForm.quoteText} 
                    onChange={e => setEditForm({...editForm, quoteText: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-white mb-2 block">Author</label>
                  <input 
                    className="w-full p-3 rounded-xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" 
                    value={editForm.quoteAuthor} 
                    onChange={e => setEditForm({...editForm, quoteAuthor: e.target.value})} 
                  />
                </div>
              </div>

              <div className="p-4 rounded-[1.5rem] bg-black/20 border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Additional URLs</h4>
                  <button 
                    onClick={() => setEditForm({...editForm, additionalLinks: [...(editForm.additionalLinks || []), { name: '', url: '', icon: 'External' }]})}
                    className="text-[10px] font-bold px-3 py-1 bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    + ADD URL
                  </button>
                </div>
                
                {(editForm.additionalLinks || []).map((link, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex gap-2 items-center">
                      <div className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg shrink-0 scale-75">
                        {(ICONS as any)[link.icon || 'External'] || ICONS.External}
                      </div>
                      <select 
                        className="p-2 rounded-lg bg-black/20 border border-white/10 text-[10px] font-bold text-white outline-none cursor-pointer"
                        value={link.icon || 'External'}
                        onChange={e => {
                          const newList = [...(editForm.additionalLinks || [])];
                          newList[idx].icon = e.target.value;
                          setEditForm({...editForm, additionalLinks: newList});
                        }}
                      >
                        {Object.keys(ICONS).map(iconName => (
                          <option key={iconName} value={iconName} className="bg-slate-800 text-white">{iconName}</option>
                        ))}
                      </select>
                      <input 
                        placeholder="Platform/Name (e.g. Codeforces)"
                        className="flex-1 p-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white" 
                        value={link.name}
                        onChange={e => {
                          const newList = [...(editForm.additionalLinks || [])];
                          newList[idx].name = e.target.value;
                          setEditForm({...editForm, additionalLinks: newList});
                        }}
                      />
                      <button 
                        onClick={() => {
                          const newList = (editForm.additionalLinks || []).filter((_, i) => i !== idx);
                          setEditForm({...editForm, additionalLinks: newList});
                        }}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                    <input 
                      placeholder="https://..."
                      className="w-full p-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white" 
                      value={link.url}
                      onChange={e => {
                        const newList = [...(editForm.additionalLinks || [])];
                        newList[idx].url = e.target.value;
                        setEditForm({...editForm, additionalLinks: newList});
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 mt-6 pt-4 border-t border-white/10 shrink-0">
              <button 
                onClick={handleSave} 
                className={`flex-1 py-3 rounded-xl font-bold ${config.button} text-white transition-all active:scale-95`}
              >
                Save Updates
              </button>
              <button 
                onClick={() => setIsEditing(false)} 
                className="flex-1 py-3 rounded-xl font-bold border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={!!deletingMessageId}
        onConfirm={confirmDeleteMessage}
        onCancel={() => setDeletingMessageId(null)}
        title="Delete Message?"
        description="Are you sure you want to delete this message? This action cannot be undone."
        config={config}
      />
    </section>
  );
};

export default Contact;
