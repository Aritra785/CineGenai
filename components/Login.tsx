
import React, { useState } from 'react';
import { Shield, Key, Sparkles, Play } from 'lucide-react';

interface LoginProps {
  onLogin: (mode: 'dev' | 'key' | 'random') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'dev' | 'key' | 'random'>('key');
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab !== 'dev' && inputValue.trim().length < 5) {
      setError('Invalid entry. Please check your credentials.');
      return;
    }
    onLogin(activeTab);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-black via-zinc-900 to-orange-950/20 px-4 overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-orange-600/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-orange-900/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative w-full max-w-xl">
        <div className="flex flex-col items-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-gradient-to-tr from-orange-500 to-orange-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/30 mb-8 transform hover:rotate-12 transition-transform cursor-pointer">
            <Play className="text-white fill-white ml-1" size={36} />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-white mb-3">CINEGEN <span className="text-orange-500">PRO</span></h1>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-[0.2em]">Next-Gen AI Storyboard Engine</p>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-2 shadow-3xl">
          <div className="grid grid-cols-3 gap-2 mb-8 p-1">
            <button
              onClick={() => setActiveTab('key')}
              className={`flex flex-col items-center justify-center py-4 px-2 rounded-3xl transition-all duration-300 ${activeTab === 'key' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Key size={20} className="mb-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-center">Gemini API</span>
            </button>
            <button
              onClick={() => setActiveTab('random')}
              className={`flex flex-col items-center justify-center py-4 px-2 rounded-3xl transition-all duration-300 ${activeTab === 'random' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Sparkles size={20} className="mb-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-center">Random Key</span>
            </button>
            <button
              onClick={() => setActiveTab('dev')}
              className={`flex flex-col items-center justify-center py-4 px-2 rounded-3xl transition-all duration-300 ${activeTab === 'dev' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Shield size={20} className="mb-2" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-center">Developer</span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="px-8 pb-8 space-y-6">
            {activeTab !== 'dev' ? (
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">
                  {activeTab === 'key' ? 'Google Gemini API Key' : 'Random Access Token'}
                </label>
                <div className="relative group">
                  <input
                    type="password"
                    placeholder={activeTab === 'key' ? "AIzaSy..." : "RAND_..."}
                    className="w-full px-6 py-5 bg-black/40 border border-white/10 rounded-[1.5rem] text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all group-hover:border-white/20"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      setError('');
                    }}
                  />
                  {activeTab === 'key' && <Key className="absolute right-6 top-5 text-zinc-700 group-hover:text-orange-500/50 transition-colors" size={20} />}
                  {activeTab === 'random' && <Sparkles className="absolute right-6 top-5 text-zinc-700 group-hover:text-orange-500/50 transition-colors" size={20} />}
                </div>
                {error && <p className="text-red-500 text-[10px] font-bold uppercase tracking-wider mt-1 ml-2">{error}</p>}
              </div>
            ) : (
              <div className="py-10 text-center space-y-4">
                <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-orange-500" size={32} />
                </div>
                <h3 className="text-xl font-bold">Infinite Credits Enabled</h3>
                <p className="text-zinc-500 text-xs">Developer mode grants unrestricted access to all image and script generation features.</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-[1.5rem] shadow-2xl shadow-orange-600/30 transform hover:-translate-y-1 active:scale-[0.98] transition-all flex items-center justify-center space-x-3 text-sm uppercase tracking-widest"
            >
              <span>{activeTab === 'dev' ? 'Activate Dev Portal' : 'Authorize & Enter'}</span>
            </button>
          </form>
        </div>

        <div className="mt-12 text-center animate-in fade-in duration-1000 delay-500">
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
            End-to-end encrypted session
            <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
