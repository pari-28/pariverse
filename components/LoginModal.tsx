
import React, { useState } from 'react';
import { ThemeMode } from '../types';
import { THEME_CONFIGS } from '../constants';
import { useScrollLock } from '../hooks/useScrollLock';

interface LoginModalProps {
  theme: ThemeMode;
  onClose: () => void;
  onLogin: (success: boolean) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ theme, onClose, onLogin }) => {
  useScrollLock(true);
  const config = THEME_CONFIGS[theme];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await (window as any).handleEmailLogin(email, password);
      onLogin(true);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await (window as any).handleGoogleLogin();
      onLogin(true);
    } catch (err: any) {
      setError(err.message || 'Google Login failed.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md detail-view-container" onClick={onClose} />
      <div className={`relative w-full max-w-md p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border shadow-2xl animate-in zoom-in-95 fade-in duration-300 ${config.card} text-white max-h-[95vh] overflow-y-auto custom-scrollbar`}>
        <div className="text-center mb-6 md:mb-8">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-2xl md:text-3xl mx-auto mb-4 shadow-xl shadow-indigo-500/20">🔐</div>
          <h3 className="text-xl md:text-2xl font-extrabold tracking-tight">Admin Portal</h3>
          <p className="text-sm opacity-50 mt-1">Manage your portfolio</p>
        </div>
        <div className="space-y-4">
          <button type="button" onClick={handleGoogleLogin} disabled={isLoading} className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 bg-white text-black hover:bg-gray-100 transition-all active:scale-95 disabled:opacity-50"><svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>Google Sign In</button>
          <div className="flex items-center gap-4 py-2"><div className="h-[1px] flex-1 bg-white/10" /><span className="text-[10px] font-black uppercase tracking-widest opacity-20">OR</span><div className="h-[1px] flex-1 bg-white/10" /></div>
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div><label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-2 mb-1 block">Email</label><input type="email" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><label className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 ml-2 mb-1 block">Password</label><input type="password" className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 outline-none focus:ring-2 focus:ring-indigo-500 text-white" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold p-3 rounded-xl">⚠️ {error}</div>}
            <div className="pt-4 flex gap-3"><button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold border border-white/10 bg-white/5 text-white">Cancel</button><button type="submit" disabled={isLoading} className={`flex-1 py-4 rounded-2xl font-bold shadow-xl transition-all ${config.button}`}>{isLoading ? '...' : 'Login'}</button></div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
