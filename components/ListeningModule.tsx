import React, { useState, useEffect, useRef } from 'react';
import { Headphones, Play, Pause, RotateCcw, BookmarkPlus, Loader2, Volume2, Eye, EyeOff, BrainCircuit, GraduationCap, ArrowRight, Clock, CheckCircle2, Rewind, FastForward, RefreshCw } from 'lucide-react';
import { generateLingifyContent, generateSpeech } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { CEFRLevel, ModuleType, ListeningResponse, VocabItem } from '../types';

const LISTENING_STYLES = [
  "University Lecture",
  "Casual Conversation",
  "News Report",
  "Podcast Interview",
  "Instructional Guide"
];

const VOICES = [
    { name: 'Aoede', label: 'Female (US 1)', style: 'Professional' },
    { name: 'Puck', label: 'Male (UK 1)', style: 'Deep' },
    { name: 'Charon', label: 'Male (US 2)', style: 'Authoritative' },
    { name: 'Kore', label: 'Female (US 2)', style: 'Calm' },
    { name: 'Fenrir', label: 'Male (US 3)', style: 'Energetic' }
];

// Helper to decode raw PCM (24kHz, 16-bit, Mono) from Gemini
const decodePCMAudio = (base64Data: string, ctx: AudioContext): AudioBuffer => {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const pcm16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, pcm16.length, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32768.0;
    }
    return buffer;
};

interface ListeningModuleProps {
    initialData?: ListeningResponse;
}

export const ListeningModule: React.FC<ListeningModuleProps> = ({ initialData }) => {
  // Customization State
  const [topic, setTopic] = useState('Sustainable Urban Development');
  const [level, setLevel] = useState<CEFRLevel>(CEFRLevel.B2);
  const [style, setStyle] = useState(LISTENING_STYLES[0]);
  const [voice, setVoice] = useState(VOICES[0].name);
  const [newWordCount, setNewWordCount] = useState<number>(6);
  
  // App Logic State
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [data, setData] = useState<ListeningResponse | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  
  // UI State (Split View)
  const [activeTab, setActiveTab] = useState<'vocab' | 'quiz'>('vocab');
  const [selectedWord, setSelectedWord] = useState<VocabItem | null>(null);

  // Audio Playback Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const progressIntervalRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Restore Effect
  useEffect(() => {
    if (initialData) {
        // Reset states
        stopAudio();
        // Clear audio buffer when loading from history as we don't persist binary data
        audioBufferRef.current = null;
        setData(initialData);
        setAnswers({});
        setShowResults(false);
    }
  }, [initialData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        stopAudio();
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
        clearInterval(progressIntervalRef.current);
    };
  }, []);

  // Draw Waveform when audio loads
  useEffect(() => {
    if (audioBufferRef.current && canvasRef.current) {
        drawWaveform(audioBufferRef.current);
    }
  }, [audioLoading, data]); // Redraw when data changes (e.g. restoration) or audio loads

  const drawWaveform = (buffer: AudioBuffer) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    
    // Draw center line
    ctx.beginPath();
    
    for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
            const datum = data[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
  };

  // Validation
  const isCountValid = newWordCount > 0 && newWordCount <= 10;

  const handleGenerate = async () => {
    if (!isCountValid) {
        alert("Words must be between 1 and 10.");
        return;
    }

    stopAudio();
    setLoading(true);
    setShowResults(false);
    setShowTranscript(false);
    setAnswers({});
    setData(null);
    setSelectedWord(null);
    setActiveTab('vocab');
    setProgress(0);
    
    try {
      // 1. Generate Text Content First
      const response = await generateLingifyContent<ListeningResponse>(ModuleType.LISTENING, {
        topic, level, style, newWordCount
      });
      setData(response);
      
      // Save log immediately so we have the text/questions
      storageService.saveActivity(ModuleType.LISTENING, response);
      
      setLoading(false); // UI Updates here: User sees text immediately

      // 2. Generate Audio
      await regenerateAudio(response.audio_script);

    } catch (err) {
      console.error(err);
      alert("Failed to generate content. Please try again.");
      setLoading(false);
      setAudioLoading(false);
    }
  };

  const regenerateAudio = async (scriptText: string) => {
      setAudioLoading(true);
      try {
          const base64Audio = await generateSpeech(scriptText, voice);
          
          if (audioContextRef.current) await audioContextRef.current.close();
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          audioContextRef.current = audioContext;
          
          const buffer = decodePCMAudio(base64Audio, audioContext);
          audioBufferRef.current = buffer;
          drawWaveform(buffer); // Ensure visualization updates
      } catch (audioErr) {
          console.error("Audio generation failed", audioErr);
          alert("Audio failed to load.");
      } finally {
          setAudioLoading(false);
      }
  };

  const playAudio = async (startOffset?: number) => {
      if (!audioContextRef.current || !audioBufferRef.current) return;

      if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.playbackRate.value = playbackRate;
      source.connect(audioContextRef.current.destination);
      source.onended = () => {
          // If natural end, reset. If manually stopped/paused, state is handled elsewhere
          if (audioContextRef.current?.currentTime && (audioContextRef.current.currentTime - startTimeRef.current) >= (audioBufferRef.current?.duration || 0) / playbackRate) {
              setIsPlaying(false);
              pauseTimeRef.current = 0;
              setProgress(100);
              clearInterval(progressIntervalRef.current);
          }
      };

      // Determine start time
      let offset = startOffset !== undefined ? startOffset : pauseTimeRef.current;
      // Clamp offset
      const duration = audioBufferRef.current.duration;
      if (offset < 0) offset = 0;
      if (offset >= duration) offset = 0;

      pauseTimeRef.current = offset;
      
      source.start(0, offset); // start(when, offset)
      startTimeRef.current = audioContextRef.current.currentTime - (offset / playbackRate);
      
      sourceNodeRef.current = source;
      setIsPlaying(true);

      // Progress Updater
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = window.setInterval(() => {
          if (audioBufferRef.current && audioContextRef.current) {
              const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * playbackRate;
              const totalDuration = audioBufferRef.current.duration;
              const p = Math.min(100, (elapsed / totalDuration) * 100);
              setProgress(p);
              pauseTimeRef.current = elapsed; // Track current position for pause/seek
          }
      }, 50);
  };

  const pauseAudio = () => {
      if (sourceNodeRef.current && audioContextRef.current) {
          sourceNodeRef.current.stop();
          setIsPlaying(false);
          clearInterval(progressIntervalRef.current);
          // pauseTimeRef.current is updated in the interval loop
      }
  };

  const stopAudio = () => {
      if (sourceNodeRef.current) {
          try { sourceNodeRef.current.stop(); } catch(e) {}
      }
      pauseTimeRef.current = 0;
      setIsPlaying(false);
      setProgress(0);
      clearInterval(progressIntervalRef.current);
  };

  const togglePlay = () => {
    if (isPlaying) pauseAudio();
    else playAudio();
  };

  const seek = (seconds: number) => {
      if (!audioBufferRef.current) return;
      const newTime = pauseTimeRef.current + seconds;
      
      if (isPlaying) {
          // Stop current source and restart at new time
          if (sourceNodeRef.current) sourceNodeRef.current.stop();
          playAudio(newTime);
      } else {
          // Just update position pointer
          pauseTimeRef.current = Math.max(0, Math.min(newTime, audioBufferRef.current.duration));
          setProgress((pauseTimeRef.current / audioBufferRef.current.duration) * 100);
      }
  };

  const changeSpeed = (rate: number) => {
      setPlaybackRate(rate);
      if (isPlaying && sourceNodeRef.current) {
          // Web Audio API supports param change while playing
          sourceNodeRef.current.playbackRate.value = rate;
      }
  };
  
  const calculateScore = () => {
    if (!data) return 0;
    let correct = 0;
    data.questions.forEach(q => {
      if (answers[q.id]?.toLowerCase() === q.answer.toLowerCase()) correct++;
    });
    return correct;
  };

  const handleCheckAnswers = () => {
      setShowResults(true);
      if (data) {
          const score = calculateScore();
          storageService.saveProgress({
              module: ModuleType.LISTENING,
              score,
              maxScore: data.questions.length,
              label: data.title
          });
      }
  };

  const saveToVault = (word: VocabItem) => {
    storageService.saveWord(word);
    const btn = document.getElementById(`save-btn-${word.word}`);
    if(btn) {
        btn.innerHTML = `<span class="flex items-center gap-1"><CheckCircle2 class="w-4 h-4" /> Saved</span>`;
        btn.classList.add('bg-green-100', 'text-green-700', 'border-green-200');
        setTimeout(() => {
           btn.innerHTML = `<span class="flex items-center gap-1"><BookmarkPlus class="w-4 h-4" /> Save to Vault</span>`;
           btn.classList.remove('bg-green-100', 'text-green-700', 'border-green-200');
        }, 2000);
    }
  };

  const handleWordClick = (word: VocabItem) => {
      setSelectedWord(word);
      setActiveTab('vocab');
  };

  const renderTranscript = () => {
      if (!data) return null;
      const cleanScript = data.audio_script.replace(/[*#]/g, '');
      const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`\\b(${data.newWords.map(w => escapeRegExp(w.word)).join('|')})\\b`, 'gi');
      const parts = cleanScript.split(pattern);

      return (
          <div className={`prose prose-lg prose-slate max-w-none font-serif text-t-1 leading-loose transition-all duration-500 ${!showTranscript ? 'blur-md select-none opacity-50' : ''}`}>
              {parts.map((part, i) => {
                  const match = data.newWords.find(w => w.word.toLowerCase() === part.toLowerCase());
                  const isSelected = selectedWord?.word.toLowerCase() === match?.word.toLowerCase();
                  if (match) {
                      return (
                          <span key={i} onClick={() => showTranscript && handleWordClick(match)} className={`rounded px-1 font-medium transition-colors duration-200 ${showTranscript ? 'cursor-pointer' : 'cursor-default'} ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>{part}</span>
                      );
                  }
                  return <span key={i}>{part}</span>;
              })}
          </div>
      );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {!data && (
        <div className="bg-surface p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-sub-border max-w-4xl mx-auto">
             <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-t-1 mb-2 font-serif">Listening Lab</h2>
                <p className="text-t-3">Train your ear with custom AI-generated audio content.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-t-2 block">Topic</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full bg-background border border-base-border rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-t-2 block">Level</label>
                            <select
                                value={level}
                                onChange={(e) => setLevel(e.target.value as CEFRLevel)}
                                className="w-full bg-background border border-base-border rounded-lg px-4 py-3 outline-none"
                            >
                                {Object.values(CEFRLevel).map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-t-2 block">Style</label>
                            <select
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                                className="w-full bg-background border border-base-border rounded-lg px-4 py-3 outline-none text-sm"
                            >
                                {LISTENING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-t-2 block">Voice Preference</label>
                        <select
                            value={voice}
                            onChange={(e) => setVoice(e.target.value)}
                            className="w-full bg-background border border-base-border rounded-lg px-4 py-3 outline-none"
                        >
                            {VOICES.map(v => <option key={v.name} value={v.name}>{v.label} - {v.style}</option>)}
                        </select>
                     </div>
                     <div className="space-y-2">
                        <label className="text-sm font-bold text-t-2 block">New Vocabulary Count</label>
                        <input
                            type="number" min="1" max="10" value={newWordCount} onChange={(e) => setNewWordCount(Number(e.target.value))}
                            className={`w-full bg-background border rounded-lg px-4 py-3 outline-none ${!isCountValid ? 'border-red-300 bg-red-50' : 'border-base-border'}`}
                        />
                     </div>
                </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={loading || audioLoading || !isCountValid}
                className="w-full bg-slate-900 text-white py-4 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3 font-bold text-lg shadow-lg shadow-slate-900/20"
            >
                {loading || audioLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Headphones className="w-5 h-5" />}
                {loading ? 'Creating Content...' : audioLoading ? 'Synthesizing Voice...' : 'Start Listening Session'}
            </button>
        </div>
      )}

      {/* 2. Main Listening Interface */}
      {data && (
          <div className="flex flex-col gap-6">
              {/* Premium Audio Player Bar - NOT Sticky to allow more viewing area when scrolling down */}
              <div className="bg-slate-900 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col items-center gap-6 text-white flex-none z-20 transition-all relative overflow-hidden">
                    {/* Background Waveform Canvas */}
                    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" width={800} height={100} />
                    
                    <div className="flex w-full items-center gap-6 z-10">
                        {/* Play Control Logic for History/Restore */}
                        {!audioBufferRef.current && !audioLoading ? (
                            <button
                                onClick={() => regenerateAudio(data.audio_script)}
                                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2 transition-all"
                            >
                                <RefreshCw className="w-4 h-4" /> Load Audio
                            </button>
                        ) : (
                            <button 
                                onClick={togglePlay}
                                disabled={audioLoading || !audioBufferRef.current}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg flex-none ${audioLoading || !audioBufferRef.current ? 'bg-slate-700 cursor-not-allowed text-t-3' : 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/30'}`}
                            >
                                {audioLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 ml-1 fill-current" />}
                            </button>
                        )}
                        
                        <div className="flex-1 w-full space-y-2">
                            <div className="flex justify-between text-xs font-bold text-t-4 uppercase tracking-wider">
                                <span>{audioLoading ? 'Synthesizing Audio...' : isPlaying ? 'Now Playing' : !audioBufferRef.current ? 'Audio Not Loaded' : 'Ready to Play'}</span>
                                <span>{data.title}</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden relative group cursor-pointer" onClick={(e) => {
                                if(!audioBufferRef.current) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const perc = x / rect.width;
                                seek(perc * audioBufferRef.current.duration - pauseTimeRef.current);
                            }}>
                                {audioLoading && <div className="absolute inset-0 bg-slate-600 animate-pulse"></div>}
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-100" style={{ width: `${progress}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center text-xs text-t-3 font-mono">
                                <span>{audioBufferRef.current ? new Date(pauseTimeRef.current * 1000).toISOString().substr(14, 5) : "00:00"}</span>
                                <span>{audioBufferRef.current ? new Date(audioBufferRef.current.duration * 1000).toISOString().substr(14, 5) : "00:00"}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-none">
                             <button onClick={() => seek(-10)} className="p-2 text-t-4 hover:text-white"><Rewind className="w-5 h-5" /></button>
                             <button onClick={() => seek(10)} className="p-2 text-t-4 hover:text-white"><FastForward className="w-5 h-5" /></button>
                             <div className="w-px h-6 bg-slate-700 mx-2"></div>
                             {[1, 1.25].map(rate => (
                                <button key={rate} onClick={() => changeSpeed(rate)} className={`px-2 py-1 text-xs font-bold rounded ${playbackRate === rate ? 'bg-indigo-500 text-white' : 'text-t-4 hover:text-white'}`}>{rate}x</button>
                             ))}
                        </div>
                    </div>
              </div>

              {/* Split Content Area - Window Scroll Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* LEFT: Transcript - Natural Height */}
                  <div className="lg:col-span-7 flex flex-col bg-[#faf9f6] rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                      <div className="p-6 border-b border-stone-200 bg-stone-100 flex justify-between items-center">
                           <h2 className="font-serif font-bold text-xl text-t-1">Transcript</h2>
                           <button onClick={() => setShowTranscript(!showTranscript)} className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                               {showTranscript ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {showTranscript ? 'Hide Text' : 'Reveal Text'}
                           </button>
                      </div>
                      <div className="p-8 relative">
                          {renderTranscript()}
                          {!showTranscript && (
                              <div className="absolute inset-0 flex items-center justify-center z-0 backdrop-blur-sm bg-surface/30 h-96">
                                  <div className="bg-surface/80 p-6 rounded-xl border border-white/50 shadow-lg text-center max-w-sm backdrop-blur-md">
                                      <Headphones className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
                                      <h3 className="font-bold text-t-1 mb-2">Listen First</h3>
                                      <p className="text-sm text-t-3 mb-6">Try to answer questions by listening only.</p>
                                      <button onClick={() => setShowTranscript(true)} className="bg-surface border border-base-border px-6 py-2 rounded-full text-sm font-bold text-t-2 hover:bg-background transition-all shadow-sm">Reveal Transcript</button>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* RIGHT: Sidebar - Sticky */}
                  <div className="lg:col-span-5 flex flex-col gap-4 lg:sticky lg:top-24 h-fit">
                      {/* Tabs */}
                      <div className="bg-surface p-1 rounded-xl border border-base-border shadow-sm flex flex-none">
                        <button onClick={() => setActiveTab('vocab')} className={`flex-1 py-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'vocab' ? 'bg-indigo-600 text-white shadow-md' : 'text-t-3 hover:bg-background'}`}><BrainCircuit className="w-4 h-4" /> Vocabulary ({data.newWords.length})</button>
                        <button onClick={() => setActiveTab('quiz')} className={`flex-1 py-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'quiz' ? 'bg-indigo-600 text-white shadow-md' : 'text-t-3 hover:bg-background'}`}><GraduationCap className="w-4 h-4" /> Questions ({data.questions.length})</button>
                      </div>
                      
                      {/* Content Box with constrained max-height for scrolling sidebar only if needed */}
                      <div className="flex-1 bg-surface rounded-2xl border border-base-border shadow-sm overflow-hidden flex flex-col relative max-h-[calc(100vh-10rem)] overflow-y-auto">
                           {activeTab === 'vocab' && (
                               <div className="h-full flex flex-col">
                                   {selectedWord ? (
                                       <div className="flex-1 p-6 flex flex-col animate-fade-in bg-gradient-to-br from-white to-indigo-50/30">
                                            <button onClick={() => setSelectedWord(null)} className="text-t-4 hover:text-indigo-600 text-sm font-medium mb-6 flex items-center gap-1 self-start"><ArrowRight className="w-4 h-4 rotate-180" /> Back to list</button>
                                            <div className="flex-1">
                                                <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded uppercase tracking-wider mb-2 inline-block">{selectedWord.pos}</span>
                                                <h2 className="text-3xl font-serif font-bold text-indigo-900 mb-4">{selectedWord.word}</h2>
                                                <p className="text-lg text-t-1 leading-relaxed font-medium mb-6">{selectedWord.meaning}</p>
                                                <div className="pl-4 border-l-4 border-indigo-300 italic text-t-2 mb-6">"{selectedWord.example}"</div>
                                            </div>
                                            <button id={`save-btn-${selectedWord.word}`} onClick={() => saveToVault(selectedWord)} className="w-full py-4 border-2 border-base-border rounded-xl text-t-2 font-bold hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"><BookmarkPlus className="w-5 h-5" /> Save to Vault</button>
                                       </div>
                                   ) : (
                                       <div className="h-full p-4">
                                           <div className="text-center py-6"><p className="text-sm text-t-3">Select a word from the transcript or list below.</p></div>
                                           <div className="space-y-2">
                                                {data.newWords.map((w, i) => (
                                                    <button key={i} onClick={() => handleWordClick(w)} className="w-full text-left p-3 rounded-xl border border-sub-border hover:border-indigo-200 hover:shadow-md hover:bg-surface bg-background/50 transition-all group">
                                                        <div className="flex justify-between items-center"><span className="font-bold text-t-2 group-hover:text-indigo-700">{w.word}</span><ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" /></div>
                                                        <p className="text-xs text-t-3 truncate mt-1">{w.meaning}</p>
                                                    </button>
                                                ))}
                                           </div>
                                       </div>
                                   )}
                               </div>
                           )}
                           {activeTab === 'quiz' && (
                               <div className="h-full flex flex-col bg-background/30">
                                    {/* Questions Container - Natural flow in sidebar */}
                                    <div className="flex-1 p-6 space-y-6">
                                        {data.questions.map((q, idx) => (
                                            <div key={q.id} className="bg-surface p-5 rounded-xl border border-base-border shadow-sm">
                                                <div className="flex gap-3 mb-4"><span className="flex-none w-6 h-6 rounded-full bg-surface-2 text-t-2 flex items-center justify-center text-xs font-bold">{idx+1}</span><p className="font-medium text-t-1 text-sm leading-relaxed">{q.prompt}</p></div>
                                                <div className="pl-9 space-y-2">
                                                    {q.type === 'mcq' && q.options ? q.options.map((opt, i) => {
                                                            const isSelected = answers[q.id] === opt;
                                                            const isCorrect = q.answer === opt;
                                                            let cls = "w-full text-left px-4 py-3 rounded-lg border text-sm transition-all flex items-center gap-3 ";
                                                            if (showResults) { if (isCorrect) cls += "bg-green-50 border-green-500 text-green-800 font-medium"; else if (isSelected) cls += "bg-red-50 border-red-300 text-red-800"; else cls += "opacity-50 border-base-border"; } 
                                                            else { cls += isSelected ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-medium" : "hover:bg-background border-base-border text-t-2"; }
                                                            return <button key={i} onClick={() => !showResults && setAnswers({...answers, [q.id]: opt})} disabled={showResults} className={cls}><div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected || (showResults && isCorrect) ? 'border-current' : 'border-slate-300'}`}>{(isSelected || (showResults && isCorrect)) && <div className="w-2 h-2 rounded-full bg-current"></div>}</div>{opt}</button>
                                                        }) : <input type="text" disabled={showResults} value={answers[q.id] || ''} onChange={(e) => setAnswers({...answers, [q.id]: e.target.value})} className="w-full border border-slate-300 rounded p-2 text-sm focus:border-indigo-500 outline-none" placeholder="Type your answer..." />}
                                                </div>
                                                {showResults && <div className="mt-4 ml-9 p-3 bg-background rounded-lg text-xs text-t-2 border border-sub-border animate-fade-in"><span className="font-bold block mb-1">Explanation:</span> {q.explanation}</div>}
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Sticky Footer for Sidebar */}
                                    <div className="p-4 border-t border-base-border bg-surface/80 backdrop-blur-md shadow-lg flex-none sticky bottom-0 z-10">
                                        {!showResults ? <button onClick={handleCheckAnswers} className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg transition-all">Check Answers</button> : <div className="p-2 text-center"><div className="text-sm font-bold text-t-4 uppercase mb-1">Your Score</div><div className="text-3xl font-bold text-indigo-600 mb-2">{calculateScore()} / {data.questions.length}</div><button onClick={() => { setData(null); }} className="text-sm text-t-3 underline hover:text-t-1">Start New Session</button></div>}
                                    </div>
                               </div>
                           )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};