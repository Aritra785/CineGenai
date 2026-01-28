
import React, { useState, useEffect } from 'react';
import { Scene, CreditState } from '../types';
import { generateSceneImage, generateStoryline } from '../services/geminiService';
import JSZip from 'jszip';
import { 
  Download, RefreshCw, Layers, Sparkles, AlertCircle, Play, 
  ChevronDown, CheckCircle2, Loader2, Monitor, Smartphone, 
  Type as TypeIcon, Edit3, Wand2, ClipboardList, Zap, Infinity as InfinityIcon
} from 'lucide-react';

interface DashboardProps {
  credits: CreditState;
  updateCredits: (amount: number) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ credits, updateCredits }) => {
  const [sceneCount, setSceneCount] = useState<number>(10);
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [genMode, setGenMode] = useState<"manual" | "auto">("manual");
  const [storySummary, setStorySummary] = useState<string>("");
  const [globalStyle, setGlobalStyle] = useState<string>('Cinematic lighting, 8k resolution, photorealistic character, dramatic shadows, vibrant colors');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [currentGenIndex, setCurrentGenIndex] = useState<number | null>(null);
  
  const [smartPasteText, setSmartPasteText] = useState("");
  const [showSmartPaste, setShowSmartPaste] = useState(false);

  useEffect(() => {
    const initialScenes: Scene[] = Array.from({ length: sceneCount }, (_, i) => ({
      id: i + 1,
      prompt: '',
      status: 'idle'
    }));
    setScenes(initialScenes);
  }, [sceneCount]);

  const handlePromptChange = (id: number, val: string) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, prompt: val } : s));
  };

  const handleBulkPromptPaste = (val: string) => {
    const lines = val.split('\n').filter(l => l.trim().length > 0);
    setScenes(prev => prev.map((s, idx) => ({
      ...s,
      prompt: lines[idx] || s.prompt
    })));
  };

  const handleSmartPaste = () => {
    if (!credits.isInfinite && credits.remaining < 50) return;
    if (!smartPasteText.trim()) return;

    const regex = /(?:scene|Scene)\s*(\d+)\s*[-:.]?\s*(.*?)(?=(?:scene|Scene)\s*\d+|$)/gs;
    const matches = [...smartPasteText.matchAll(regex)];
    
    if (matches.length > 0) {
      setScenes(prev => {
        const newScenes = [...prev];
        matches.forEach(match => {
          const index = parseInt(match[1], 10) - 1;
          const text = match[2].trim();
          if (index >= 0 && index < newScenes.length) {
            newScenes[index] = { ...newScenes[index], prompt: text };
          }
        });
        return newScenes;
      });
      updateCredits(-50);
      setSmartPasteText("");
      setShowSmartPaste(false);
    }
  };

  const generateScript = async () => {
    const cost = sceneCount * 5;
    if (!credits.isInfinite && credits.remaining < cost) return;
    if (!storySummary.trim()) return;

    setIsGeneratingStory(true);
    try {
      const prompts = await generateStoryline(storySummary, sceneCount, globalStyle);
      setScenes(prev => prev.map((s, idx) => ({
        ...s,
        prompt: prompts[idx] || s.prompt,
        status: 'idle',
        imageUrl: undefined
      })));
      updateCredits(-cost);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingStory(false);
    }
  };

  const startImageGeneration = async () => {
    const uncompletedCount = scenes.filter(s => s.status !== 'completed').length;
    const imageCost = uncompletedCount * 10;
    if (!credits.isInfinite && credits.remaining < imageCost) return;
    
    setIsGeneratingImages(true);

    for (let i = 0; i < scenes.length; i++) {
      if (scenes[i].status === 'completed') continue;
      
      setCurrentGenIndex(i);
      setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'generating' } : s));

      try {
        const imageUrl = await generateSceneImage(scenes[i].prompt || `Scene ${i+1}`, globalStyle, aspectRatio);
        setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, imageUrl, status: 'completed' } : s));
        updateCredits(-10);
      } catch (err) {
        setScenes(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'failed', error: 'Failed' } : s));
      }
    }

    setIsGeneratingImages(false);
    setCurrentGenIndex(null);
  };

  const regenerateScene = async (id: number) => {
    if (!credits.isInfinite && credits.remaining < 10) return;
    
    setScenes(prev => prev.map(s => s.id === id ? { ...s, status: 'generating' } : s));

    try {
      const scene = scenes.find(s => s.id === id);
      const imageUrl = await generateSceneImage(scene?.prompt || `Scene ${id}`, globalStyle, aspectRatio);
      setScenes(prev => prev.map(s => s.id === id ? { ...s, imageUrl, status: 'completed' } : s));
      updateCredits(-10);
    } catch (err) {
      setScenes(prev => prev.map(s => s.id === id ? { ...s, status: 'failed', error: 'Failed' } : s));
    }
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    const completed = scenes.filter(s => s.imageUrl && s.status === 'completed');
    if (completed.length === 0) return;

    for (const scene of completed) {
      if (!scene.imageUrl) continue;
      const base64Data = scene.imageUrl.split(',')[1];
      zip.file(`Scene_${scene.id.toString().padStart(2, '0')}.png`, base64Data, { base64: true });
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cinegen_storyboard_${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadSingle = (scene: Scene) => {
    if (!scene.imageUrl) return;
    const link = document.createElement('a');
    link.href = scene.imageUrl;
    link.download = `Scene_${scene.id}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
            <Play className="text-white fill-white" size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight">CineGen</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`px-4 py-2 bg-zinc-900 border ${credits.isInfinite ? 'border-orange-500/50' : 'border-white/10'} rounded-full flex items-center space-x-2`}>
            <div className={`w-2 h-2 ${credits.isInfinite ? 'bg-orange-400' : 'bg-orange-500'} rounded-full animate-pulse`}></div>
            <span className="text-sm font-medium text-zinc-300">Credits: 
              <span className="text-white font-bold ml-1 flex items-center inline-flex">
                {credits.isInfinite ? <InfinityIcon size={18} className="text-orange-400" /> : credits.remaining}
              </span>
            </span>
          </div>
          <button 
            onClick={downloadAll}
            disabled={!scenes.some(s => s.status === 'completed')}
            className="px-4 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Download All</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-10 space-y-10">
        
        <section className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 space-y-6">
              <div className="flex items-center space-x-2 text-orange-500 mb-2">
                <Layers size={20} />
                <h2 className="font-bold text-lg">Project Setup</h2>
              </div>
              
              <div className="space-y-4">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Generation Mode</label>
                <div className="flex p-1 bg-black rounded-2xl border border-white/5">
                  <button 
                    onClick={() => setGenMode('auto')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${genMode === 'auto' ? 'bg-orange-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <Wand2 size={14} /> <span>AI Script</span>
                  </button>
                  <button 
                    onClick={() => setGenMode('manual')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${genMode === 'manual' ? 'bg-orange-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    <Edit3 size={14} /> <span>Manual</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Video Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setAspectRatio("16:9")}
                    className={`py-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center space-y-2 border ${aspectRatio === "16:9" ? "bg-orange-600/10 border-orange-500 text-orange-500" : "bg-zinc-800/50 border-transparent text-zinc-500 hover:bg-zinc-800"}`}
                  >
                    <Monitor size={18} />
                    <span>Landscape (16:9)</span>
                  </button>
                  <button 
                    onClick={() => setAspectRatio("9:16")}
                    className={`py-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center space-y-2 border ${aspectRatio === "9:16" ? "bg-orange-600/10 border-orange-500 text-orange-500" : "bg-zinc-800/50 border-transparent text-zinc-500 hover:bg-zinc-800"}`}
                  >
                    <Smartphone size={18} />
                    <span>Vertical (9:16)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Scene Count</label>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 30, 50].map(n => (
                    <button
                      key={n}
                      onClick={() => setSceneCount(n)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all ${
                        sceneCount === n ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-zinc-500">
                  <span>Image Credits</span>
                  <span className="text-white font-bold">{credits.isInfinite ? '0' : sceneCount * 10}</span>
                </div>
                {genMode === 'auto' && (
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-zinc-500">
                    <span>AI Script Credits</span>
                    <span className="text-white font-bold">{credits.isInfinite ? '0' : sceneCount * 5}</span>
                  </div>
                )}
                
                <button
                  onClick={startImageGeneration}
                  disabled={isGeneratingImages || isGeneratingStory || !scenes.some(s => s.prompt)}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl disabled:opacity-50 flex items-center justify-center space-x-3 transition-all shadow-lg shadow-orange-600/20"
                >
                  {isGeneratingImages ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                  <span>Generate All Images</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 h-full space-y-6">
              {genMode === 'auto' && (
                <div className="space-y-3 animate-in fade-in duration-500">
                  <div className="flex items-center space-x-2 text-orange-500">
                    <TypeIcon size={18} />
                    <h2 className="font-bold text-md">Story Description</h2>
                  </div>
                  <div className="relative">
                    <textarea
                      className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-orange-500/50 resize-none min-h-[140px]"
                      placeholder="Write your story theme, plot, or summary here. AI will turn this into detailed scene-by-scene prompts..."
                      value={storySummary}
                      onChange={(e) => setStorySummary(e.target.value)}
                    />
                    <button
                      onClick={generateScript}
                      disabled={isGeneratingStory || !storySummary.trim()}
                      className="absolute bottom-4 right-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 disabled:opacity-50 transition-all border border-white/5"
                    >
                      {isGeneratingStory ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                      <span>Generate Script</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-orange-500">
                  <Sparkles size={18} />
                  <h2 className="font-bold text-md">Global Consistency & Style</h2>
                </div>
                <textarea
                  className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-orange-500/50 resize-none min-h-[100px]"
                  placeholder="Describe character looks, art style, mood, and camera angles for consistency..."
                  value={globalStyle}
                  onChange={(e) => setGlobalStyle(e.target.value)}
                />
              </div>

              {genMode === 'manual' && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-orange-400">
                      <ClipboardList size={18} />
                      <h2 className="font-bold text-md">Smart AI Paste</h2>
                    </div>
                    <button 
                      onClick={() => setShowSmartPaste(!showSmartPaste)}
                      className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 hover:text-white transition-colors"
                    >
                      {showSmartPaste ? 'Hide Tool' : 'Show Tool'}
                    </button>
                  </div>
                  
                  {showSmartPaste && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
                      <p className="text-[10px] text-zinc-500 italic">
                        Paste text like "Scene 1 - A hero enters... Scene 2 - He sees the dragon..." and we'll automatically map them to boxes.
                      </p>
                      <div className="relative">
                        <textarea
                          className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-orange-500/50 resize-none min-h-[100px]"
                          placeholder="Scene 1: descriptive text. Scene 2: more text..."
                          value={smartPasteText}
                          onChange={(e) => setSmartPasteText(e.target.value)}
                        />
                        <button
                          onClick={handleSmartPaste}
                          disabled={(!credits.isInfinite && credits.remaining < 50) || !smartPasteText.trim()}
                          className="absolute bottom-4 right-4 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 disabled:opacity-50 transition-all shadow-lg"
                        >
                          <Zap size={14} />
                          <span>Parse & Paste ({credits.isInfinite ? '0' : '50'} Credits)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Storyboard Scenes</h2>
              <p className="text-zinc-500 text-sm">Define each scene's specific action or content.</p>
            </div>
            {genMode === 'manual' && (
              <div className="flex items-center">
                 <div className="relative group">
                    <textarea 
                      className="w-full md:w-80 h-11 px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50 transition-all"
                      placeholder="Paste bulk prompts (one per line)..."
                      onChange={(e) => {
                        handleBulkPromptPaste(e.target.value);
                        e.target.value = '';
                      }}
                    />
                    <div className="absolute right-3 top-3.5 pointer-events-none text-zinc-600 group-hover:text-zinc-400 transition-colors">
                      <ChevronDown size={14} />
                    </div>
                 </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {scenes.map((scene, idx) => (
              <div 
                key={scene.id} 
                className={`group relative bg-zinc-900 rounded-3xl border transition-all duration-300 overflow-hidden ${
                  currentGenIndex === idx ? 'ring-2 ring-orange-500 border-transparent scale-[1.02]' : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div className={`${aspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16]"} bg-black relative flex items-center justify-center overflow-hidden transition-all duration-500`}>
                  {scene.imageUrl ? (
                    <img src={scene.imageUrl} alt={`Scene ${scene.id}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="flex flex-col items-center space-y-2 text-zinc-700">
                      {scene.status === 'generating' ? (
                        <Loader2 className="animate-spin text-orange-500" size={32} />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center">
                          <Play size={24} className="opacity-20" />
                        </div>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Scene {scene.id}</span>
                    </div>
                  )}

                  {scene.status === 'completed' && (
                    <div className="absolute top-3 right-3 p-1.5 bg-green-500 text-white rounded-full shadow-lg scale-in">
                      <CheckCircle2 size={16} />
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md tracking-widest uppercase">SCENE {scene.id}</span>
                    <div className="flex space-x-1">
                      {scene.status === 'completed' && (
                        <>
                          <button 
                            onClick={() => downloadSingle(scene)}
                            className="p-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                            title="Download Image"
                          >
                            <Download size={14} />
                          </button>
                          <button 
                            onClick={() => regenerateScene(scene.id)}
                            className="p-2 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
                            title="Regenerate (10 Credits)"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <textarea
                    placeholder="Scene description..."
                    className="w-full p-3 bg-black/40 border border-white/5 rounded-xl text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-orange-500/30 min-h-[70px] resize-none"
                    value={scene.prompt}
                    onChange={(e) => handlePromptChange(scene.id, e.target.value)}
                  />
                </div>

                {scene.status === 'generating' && (
                  <div className="absolute bottom-0 left-0 h-1 bg-orange-500 w-full animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-auto py-10 px-6 border-t border-white/5 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <Play className="text-orange-500 fill-orange-500" size={20} />
            <span className="font-bold text-lg tracking-tighter">CineGen</span>
          </div>
          <p className="text-zinc-600 text-xs">© 2024 CineGen AI. Professional Scene Storyboarding for Creator Workflows.</p>
          <div className="flex space-x-6">
            <a href="#" className="text-zinc-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">Pricing</a>
            <a href="#" className="text-zinc-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">Tutorials</a>
            <a href="#" className="text-zinc-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest">Community</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
