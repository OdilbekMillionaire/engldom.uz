import React, { useState, useEffect } from 'react';
import { 
    PenTool, Image as ImageIcon, MessageSquare, Loader2, CheckCircle2, 
    ArrowRight, Clock, Target, Link2, BookOpen, Scale, 
    AlertTriangle, Sparkles, RefreshCw, Type, Check, Trophy
} from 'lucide-react';
import { generateLingifyContent } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { ModuleType, WritingResponse, VocabItem } from '../types';
import { ChatTutor } from './ChatTutor';

const TASK_TYPES = [
    { value: 'IELTS Task 2 Essay', time: 40, label: 'IELTS Task 2 Essay', desc: '40 mins • 250+ words' },
    { value: 'IELTS Task 1 Report', time: 20, label: 'IELTS Task 1 Academic', desc: '20 mins • 150+ words • Graph/Chart' },
    { value: 'IELTS Task 1 Letter', time: 20, label: 'IELTS Task 1 General', desc: '20 mins • 150+ words' },
    { value: 'CEFR Essay', time: 45, label: 'CEFR Formal Essay', desc: '45 mins • Advanced Composition' }
];

interface WritingModuleProps {
    initialData?: WritingResponse;
}

export const WritingModule: React.FC<WritingModuleProps> = ({ initialData }) => {
  // Settings
  const [taskType, setTaskType] = useState(TASK_TYPES[0]);
  const [standard, setStandard] = useState('British English');
  const [prompt, setPrompt] = useState('');
  const [essay, setEssay] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Active Vocabulary Challenge
  const [targetVocab, setTargetVocab] = useState<VocabItem[]>([]);
  const [vocabUsed, setVocabUsed] = useState<Record<string, boolean>>({});

  // UI State
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WritingResponse | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isSettingsCollapsed, setIsSettingsCollapsed] = useState(false);

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  // Drills
  const [drillAnswers, setDrillAnswers] = useState<Record<number, string>>({});
  const [drillFeedback, setDrillFeedback] = useState<Record<number, boolean>>({});

  // Restore State Effect
  useEffect(() => {
    if (initialData) {
        setResult(initialData);
        setIsSettingsCollapsed(true);
        // Note: We can't fully restore the user's original essay text if it wasn't saved in the activity log.
        // Assuming activity log stores the *result*, but maybe not the essay input unless we updated the type.
        // For now, we just show the analysis.
    }
  }, [initialData]);

  useEffect(() => {
      setPrompt(taskType.value.includes('Task 1') 
        ? "The chart below shows..." 
        : "Some people believe that university education should be free for everyone. Discuss the advantages and disadvantages.");
      
      // Load Target Vocab from Vault
      const allWords = storageService.getWords();
      // Prioritize words with SRS level > 0 (Learning) but < 5 (Mastered), or just random 5
      const learningWords = allWords.filter(w => (w.srsLevel || 0) > 0 && (w.srsLevel || 0) < 5);
      const pool = learningWords.length > 3 ? learningWords : allWords;
      
      const selected = pool.sort(() => 0.5 - Math.random()).slice(0, 5);
      setTargetVocab(selected);
      
      // Init Check state
      const initialUsed: Record<string, boolean> = {};
      selected.forEach(w => initialUsed[w.word] = false);
      setVocabUsed(initialUsed);

  }, [taskType]);

  useEffect(() => {
    let interval: number;
    if (timerRunning && timeRemaining > 0) {
        interval = window.setInterval(() => setTimeRemaining(prev => prev - 1), 1000);
    } else if (timeRemaining === 0) {
        setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeRemaining]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setEssay(text);
      setWordCount(text.trim().split(/\s+/).filter(w => w.length > 0).length);
      
      // Check for target vocab usage
      const lowerText = text.toLowerCase();
      const updatedUsage = { ...vocabUsed };
      let changed = false;

      targetVocab.forEach(w => {
          // Simple inclusion check
          if (lowerText.includes(w.word.toLowerCase()) && !updatedUsage[w.word]) {
              updatedUsage[w.word] = true;
              changed = true;
          } else if (!lowerText.includes(w.word.toLowerCase()) && updatedUsage[w.word]) {
              updatedUsage[w.word] = false;
              changed = true;
          }
      });

      if (changed) setVocabUsed(updatedUsage);

      if (!timerRunning && !result && wordCount === 0 && text.length > 0) {
          setTimeRemaining(taskType.time * 60);
          setTimerRunning(true);
      }
  };
// ... rest of the file remains exactly the same ...
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]); 
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  };

  const handleEvaluate = async () => {
    if (!essay.trim()) return;
    setTimerRunning(false);
    setLoading(true);
    setResult(null);
    setDrillAnswers({});
    setDrillFeedback({});
    setIsSettingsCollapsed(true); // Auto collapse settings to focus on result

    try {
      let mediaPayload = undefined;
      if (imageFile && taskType.value.includes('Report')) {
          const base64 = await fileToBase64(imageFile);
          mediaPayload = { mimeType: imageFile.type, data: base64 };
      }

      const response = await generateLingifyContent<WritingResponse>(
          ModuleType.WRITING, 
          { taskType: taskType.value, prompt, essay, standard },
          mediaPayload
      );
      setResult(response);
      
      storageService.saveActivity(ModuleType.WRITING, response);
      storageService.saveProgress({
        module: ModuleType.WRITING,
        score: Number(response.band_score),
        maxScore: 9,
        label: `${taskType.value}: ${prompt.substring(0, 20)}...`
      });

    } catch (err) {
      alert("Evaluation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const checkDrill = (index: number, correctAnswer: string) => {
      const userAns = drillAnswers[index]?.trim().toLowerCase();
      const correct = correctAnswer.trim().toLowerCase();
      setDrillFeedback(prev => ({...prev, [index]: userAns === correct}));
  };

  const getScoreColor = (score: number) => {
      if (score >= 8) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      if (score >= 6.5) return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      if (score >= 5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-8 pb-12">
        
        {/* TOP: Header & Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div>
                <h1 className="text-3xl font-bold text-slate-800 font-serif flex items-center gap-3">
                    <PenTool className="w-8 h-8 text-indigo-600" />
                    Writing Lab
                </h1>
                <p className="text-slate-500 mt-1">Advanced AI Examiner with criterion-based assessment.</p>
            </div>
            <div className="flex gap-4 items-center">
                 <div className="text-right hidden md:block">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Session Time</p>
                     <p className={`text-2xl font-mono font-bold ${timeRemaining < 300 && timerRunning ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                         {formatTime(timeRemaining)}
                     </p>
                 </div>
                 <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                 <div className="text-right">
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Words</p>
                     <p className="text-2xl font-bold text-slate-700">{wordCount}</p>
                 </div>
            </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT: Configuration (Collapsible) */}
            <div className={`lg:col-span-4 space-y-6 transition-all duration-500 ${isSettingsCollapsed ? 'hidden lg:block lg:opacity-50 lg:pointer-events-none' : ''}`}>
                <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 relative">
                    {isSettingsCollapsed && (
                         <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
                             <button onClick={() => setIsSettingsCollapsed(false)} className="bg-white border border-slate-200 px-4 py-2 rounded-full shadow-lg font-bold text-sm text-indigo-600 flex items-center gap-2 hover:scale-105 transition-transform">
                                 <RefreshCw className="w-4 h-4" /> Change Settings
                             </button>
                         </div>
                    )}
                    
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        Assignment Setup
                    </h2>
                    
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Task Type</label>
                            <div className="grid grid-cols-1 gap-2">
                                {TASK_TYPES.map(t => (
                                    <button
                                        key={t.value}
                                        onClick={() => { setTaskType(t); setTimeRemaining(t.time * 60); }}
                                        className={`text-left p-3 rounded-xl border transition-all ${taskType.value === t.value ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-indigo-300'}`}
                                    >
                                        <div className={`font-bold text-sm ${taskType.value === t.value ? 'text-indigo-900' : 'text-slate-700'}`}>{t.label}</div>
                                        <div className="text-xs text-slate-500 mt-1">{t.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {taskType.value.includes('Report') && (
                            <div className="p-4 border border-dashed border-indigo-300 bg-indigo-50/30 rounded-xl">
                                <label className="text-sm font-bold text-indigo-800 flex items-center gap-2 mb-2 cursor-pointer hover:text-indigo-600 transition-colors">
                                    <ImageIcon className="w-5 h-5" /> Upload Task 1 Chart
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                                </label>
                                {imageFile ? (
                                    <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">
                                        <CheckCircle2 className="w-4 h-4" /> {imageFile.name}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Recommended for accurate "Task Achievement" scoring.
                                    </p>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-bold text-slate-700 block mb-2">Spelling Standard</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                {['British English', 'American English'].map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => setStandard(s)}
                                        className={`flex-1 py-2 rounded-md text-xs font-bold transition-all ${standard === s ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ACTIVE VOCAB INJECTION --- */}
                {targetVocab.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-800 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Target className="w-20 h-20" />
                        </div>
                        <h3 className="font-bold text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-yellow-400" /> Vocabulary Challenge
                        </h3>
                        <p className="text-xs text-indigo-200 mb-4">Try to use these words from your vault in your essay.</p>
                        
                        <div className="space-y-2">
                            {targetVocab.map((w, i) => {
                                const isUsed = vocabUsed[w.word];
                                return (
                                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isUsed ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5 border-white/10'}`}>
                                        <div className="flex flex-col">
                                            <span className={`font-bold text-sm ${isUsed ? 'text-emerald-300 line-through' : 'text-white'}`}>{w.word}</span>
                                            <span className="text-[10px] text-indigo-300">{w.pos}</span>
                                        </div>
                                        {isUsed && (
                                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center animate-bounce">
                                                <Check className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10 text-center">
                            <span className="text-xs font-mono text-indigo-300">
                                {Object.values(vocabUsed).filter(Boolean).length} / {targetVocab.length} Used
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* RIGHT: Workspace & Analysis */}
            <div className={`${isSettingsCollapsed ? 'lg:col-span-12' : 'lg:col-span-8'} transition-all duration-500 space-y-8`}>
                
                {/* 1. WRITING EDITOR */}
                <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden transition-all duration-500 ${result ? 'h-auto ring-2 ring-emerald-500/20' : 'h-[650px]'}`}>
                    
                    {/* Prompt Header */}
                    <div className="bg-slate-50 border-b border-slate-200 p-4">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Task Prompt</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={2}
                            placeholder="Enter your essay question here..."
                            className="w-full bg-transparent border-none p-0 text-slate-800 font-medium placeholder:text-slate-400 focus:ring-0 resize-none text-sm leading-relaxed"
                        />
                    </div>

                    {/* Editor */}
                    <textarea
                        value={essay}
                        onChange={handleTextChange}
                        placeholder="Start typing your response here..."
                        className="flex-1 w-full p-8 resize-none outline-none text-slate-700 text-lg leading-loose font-serif placeholder:font-sans"
                        spellCheck={false}
                    />

                    {/* Toolbar */}
                    <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center sticky bottom-0">
                        <div className="text-xs text-slate-400 font-medium hidden sm:block">
                            {result ? "Assessment Complete" : "Keep writing... Focus on clear paragraphing."}
                        </div>
                        <button
                            onClick={handleEvaluate}
                            disabled={loading || wordCount < 50}
                            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 shadow-lg shadow-slate-900/20 flex items-center gap-3 transition-all transform hover:scale-[1.02] active:scale-95"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-yellow-400" />}
                            {loading ? 'Analyzing with Gemini...' : 'Assess Writing'}
                        </button>
                    </div>
                </div>

                {/* 2. RESULTS DASHBOARD */}
                {result && (
                    <div className="space-y-8 animate-fade-in">
                        
                        {/* HERO SCORE CARD */}
                        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
                            
                            <div className="relative z-10 grid md:grid-cols-12 gap-8 items-center">
                                <div className="md:col-span-4 text-center md:text-left">
                                    <div className="inline-block bg-white/10 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-4 text-indigo-200 border border-white/10">
                                        Overall Band Score
                                    </div>
                                    <div className="text-8xl font-bold tracking-tighter bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
                                        {result.band_score}
                                    </div>
                                    <div className="mt-4 flex items-center justify-center md:justify-start gap-3">
                                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm font-bold border border-emerald-500/30">
                                            CEFR {result.cefr_level}
                                        </span>
                                        <span className="text-slate-400 text-sm font-medium">Verified by AI</span>
                                    </div>
                                </div>
                                <div className="md:col-span-8 bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                                    <h3 className="font-bold text-indigo-200 mb-3 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" /> Examiner's Summary
                                    </h3>
                                    <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                                        {result.overall_feedback}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* DETAILED CRITERIA GRID */}
                        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {[
                                { key: 'task_response', label: 'Task Response', icon: Target, desc: 'Relevance & Development', data: result.detailed_analysis.task_response },
                                { key: 'coherence_cohesion', label: 'Coherence', icon: Link2, desc: 'Flow & Linking Words', data: result.detailed_analysis.coherence_cohesion },
                                { key: 'lexical_resource', label: 'Vocabulary', icon: BookOpen, desc: 'Range & Accuracy', data: result.detailed_analysis.lexical_resource },
                                { key: 'grammatical_range_accuracy', label: 'Grammar', icon: Scale, desc: 'Structures & Errors', data: result.detailed_analysis.grammatical_range_accuracy },
                            ].map((item) => (
                                <div key={item.key} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                                            <item.icon className="w-6 h-6 text-slate-700 group-hover:text-indigo-600" />
                                        </div>
                                        <div className={`px-3 py-1 rounded-lg font-bold text-lg border ${getScoreColor(item.data.score)}`}>
                                            {item.data.score}
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-lg mb-1">{item.label}</h4>
                                    <p className="text-xs text-slate-400 mb-4">{item.desc}</p>
                                    
                                    {/* Mini Score Bar */}
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(item.data.score / 9) * 100}%` }}></div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex gap-2 items-start">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-none"></div>
                                            <p className="text-xs text-slate-600 leading-snug">{item.data.strengths[0] || "Good performance"}</p>
                                        </div>
                                        <div className="flex gap-2 items-start">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-none"></div>
                                            <p className="text-xs text-slate-600 leading-snug">{item.data.weaknesses[0] || "No major issues"}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* MISTAKES & CORRECTIONS (Refined Diff View) */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                    Correction Report
                                </h3>
                                <div className="text-xs font-bold text-slate-400 uppercase bg-white px-3 py-1 rounded-full border border-slate-200">
                                    {standard}
                                </div>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {result.mistakes_and_corrections.map((m, i) => (
                                    <div key={i} className="p-6 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded tracking-wider">{m.type}</span>
                                            <span className="text-xs text-slate-400">•</span>
                                            <span className="text-xs text-slate-500 font-medium italic">{m.rule}</span>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-red-50 border border-red-100 relative group">
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Type className="w-4 h-4 text-red-300" />
                                                </div>
                                                <p className="text-xs font-bold text-red-400 uppercase mb-1">Original</p>
                                                <p className="text-red-900 font-medium line-through decoration-red-400/50">{m.original}</p>
                                            </div>
                                            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 relative group">
                                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                                </div>
                                                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Correction</p>
                                                <p className="text-emerald-900 font-bold">{m.correction}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {result.mistakes_and_corrections.length === 0 && (
                                    <div className="p-12 text-center text-slate-400">
                                        <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-200" />
                                        <p className="font-medium">Clean sweep! No major errors detected.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* INTERACTIVE DRILLS (Gamified) */}
                        {result.grammar_review_tasks.length > 0 && (
                            <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-xl text-white border border-slate-800">
                                <div className="p-8 border-b border-white/10 bg-gradient-to-r from-slate-900 to-indigo-950">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-emerald-500 rounded-lg">
                                            <Sparkles className="w-5 h-5 text-white" />
                                        </div>
                                        <h3 className="font-bold text-xl">Targeted Practice</h3>
                                    </div>
                                    <p className="text-slate-400 text-sm ml-12">AI generated specific drills based on your mistakes in this essay.</p>
                                </div>
                                
                                <div className="grid md:grid-cols-2 gap-px bg-slate-800">
                                    {result.grammar_review_tasks.map((task, i) => (
                                        <div key={i} className="bg-slate-900 p-8 flex flex-col">
                                            <div className="mb-6">
                                                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 block">
                                                    Drill {i + 1}: {task.error_type}
                                                </span>
                                                <p className="text-sm text-slate-300 leading-relaxed min-h-[40px]">
                                                    {task.rule_explanation}
                                                </p>
                                            </div>

                                            <div className="bg-white/5 p-4 rounded-xl border border-white/5 mb-6">
                                                <p className="text-xs text-slate-500 uppercase font-bold mb-2">Example</p>
                                                <p className="font-mono text-sm text-emerald-300">{task.example_sentence}</p>
                                            </div>

                                            <div className="mt-auto space-y-3">
                                                <p className="font-bold text-sm text-white">Task: {task.practice_task}</p>
                                                <div className="relative">
                                                    <input 
                                                        type="text" 
                                                        value={drillAnswers[i] || ''}
                                                        onChange={(e) => setDrillAnswers({...drillAnswers, [i]: e.target.value})}
                                                        disabled={drillFeedback[i] !== undefined}
                                                        className={`w-full bg-slate-800 border rounded-xl px-4 py-3 text-sm outline-none transition-all ${
                                                            drillFeedback[i] === true ? 'border-emerald-500 text-emerald-400' :
                                                            drillFeedback[i] === false ? 'border-red-500 text-red-400' :
                                                            'border-slate-700 focus:border-indigo-500 text-white'
                                                        }`}
                                                        placeholder="Type answer here..."
                                                    />
                                                    {drillFeedback[i] === undefined && (
                                                        <button 
                                                            onClick={() => checkDrill(i, task.practice_answer)}
                                                            className="absolute right-2 top-2 bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                                        >
                                                            Check
                                                        </button>
                                                    )}
                                                </div>
                                                {drillFeedback[i] !== undefined && (
                                                    <div className={`text-xs font-bold flex items-center gap-2 animate-fade-in ${drillFeedback[i] ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {drillFeedback[i] ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                                        {drillFeedback[i] ? 'Correct! Well done.' : `Incorrect. Answer: ${task.practice_answer}`}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Floating Chat Action */}
                        <div className="fixed bottom-6 right-6 z-40">
                             <button 
                                onClick={() => setShowChat(true)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-2xl shadow-indigo-600/40 transition-all hover:scale-110 flex items-center justify-center"
                                title="Ask Tutor"
                            >
                                <MessageSquare className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {showChat && result && (
            <ChatTutor 
                isOpen={showChat} 
                onClose={() => setShowChat(false)} 
                context={`User Essay: ${essay}\n\nFeedback: ${JSON.stringify(result)}`}
            />
        )}
    </div>
  );
};