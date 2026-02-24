import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, RefreshCw, BookmarkPlus, Clock, GraduationCap, ArrowRight, CheckCircle2, BrainCircuit, Zap, Info, GitBranch, Minus, Plus } from 'lucide-react';
import { generateLingifyContent } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { CEFRLevel, ModuleType, ReadingResponse, VocabItem } from '../types';
import { TimerRing } from './ui/TimerRing';
import { QuizProgressBar } from './ui/QuizProgressBar';
import { CompletionScreen } from './ui/CompletionScreen';
import { useXPToast } from './ui/XPToastProvider';
import { gamificationService } from '../services/gamificationService';

const STYLE_OPTIONS = [
  "IELTS Academic (Descriptive)",
  "IELTS Academic (Argumentative)",
  "Scientific/Technical Report",
  "Historical/Biographical Narrative",
  "Social/Cultural Analysis",
  "General Interest/Magazine Style",
  "Storytelling/Fictional Narrative", 
  "Personal Diary/Journal Entry"       
];

const QUESTION_TYPES = [
    { value: 'mcq', label: 'Multiple Choice' },
    { value: 'tfng', label: 'True/False/Not Given' },
    { value: 'gap_fill', label: 'Gap Filling / Sentence Completion' },
    { value: 'matching', label: 'Matching Headings/Information' }
];

interface ReadingModuleProps {
    initialData?: ReadingResponse;
}

export const ReadingModule: React.FC<ReadingModuleProps> = ({ initialData }) => {
  // Customization State
  const [level, setLevel] = useState<CEFRLevel>(CEFRLevel.B1);
  const [wordCount, setWordCount] = useState<number>(400);
  const [newWordCount, setNewWordCount] = useState<number>(5);
  const [timeLimit, setTimeLimit] = useState<number>(12);
  const [topic, setTopic] = useState('Urban design and public spaces');
  const [style, setStyle] = useState(STYLE_OPTIONS[0]);
  const [questionType, setQuestionType] = useState('mcq');

  // App Logic State
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReadingResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  
  // New UI State for "Eye-Appealing" Experience
  const [activeTab, setActiveTab] = useState<'vocab' | 'quiz'>('vocab');
  const [selectedWord, setSelectedWord] = useState<VocabItem | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Gamification & completion state
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionData, setCompletionData] = useState({ score: 0, maxScore: 0, xpEarned: 0, bonusXP: 0, leveledUp: false, newLevel: 0, newBadges: [] as any[] });
  const [focusedQuestion, setFocusedQuestion] = useState(0);
  const { showXP, showBadge } = useXPToast();

  // Difficulty quick-select (maps to CEFR)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const DIFFICULTY_CEFR: Record<string, CEFRLevel> = { easy: CEFRLevel.B1, medium: CEFRLevel.B2, hard: CEFRLevel.C1 };

  // Article font size (UX enhancement: accessibility)
  const [articleFontSize, setArticleFontSize] = useState(17);

  // Register badge helper
  const REGISTER_STYLES: Record<string, string> = {
      formal:    'bg-violet-50 text-violet-700 border-violet-200',
      academic:  'bg-indigo-50 text-indigo-700 border-indigo-200',
      informal:  'bg-amber-50  text-amber-700  border-amber-200',
      technical: 'bg-teal-50   text-teal-700   border-teal-200',
      neutral:   'bg-slate-100 text-slate-600  border-slate-200',
  };

  // Validation
  const isCountValid = newWordCount > 0 && newWordCount <= 10;
  const isWordCountValid = wordCount > 0 && wordCount <= 800;

  // Hydration Effect
  useEffect(() => {
    if (initialData) {
        setData(initialData);
        setAnswers({});
        setShowResults(false);
        setTimerActive(false);
        setTimeLeft(0); // Reset timer on restore
    }
  }, [initialData]);

  useEffect(() => {
      let interval: number;
      if (timerActive && timeLeft > 0) {
          interval = window.setInterval(() => {
              setTimeLeft(prev => prev - 1);
          }, 1000);
      } else if (timeLeft === 0 && timerActive) {
          setTimerActive(false);
      }
      return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const handleGenerate = async () => {
    if (!isCountValid) {
        alert("Please choose between 1 and 10 new words.");
        return;
    }
    if (!isWordCountValid) {
        alert("Word count must be between 1 and 800.");
        return;
    }

    setLoading(true);
    setShowResults(false);
    setAnswers({});
    setData(null);
    setSelectedWord(null);
    setActiveTab('vocab');
    setTimerActive(false);

    try {
      const response = await generateLingifyContent<ReadingResponse>(ModuleType.READING, {
        topic,
        level,
        wordCount,
        newWordCount,
        style,
        questionType,
        timeLimit
      });
      setData(response);
      setTimeLeft(timeLimit * 60);
      setTimerActive(true);
      
      // Save for History
      storageService.saveActivity(ModuleType.READING, response);

    } catch (err) {
      alert("Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (qId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const calculateScore = () => {
    if (!data) return 0;
    let correct = 0;
    data.questions.forEach(q => {
      if (answers[q.id]?.toLowerCase() === q.answer.toLowerCase()) correct++;
    });
    return correct;
  };
  
  // Keyboard shortcuts: 1-4 to pick option for focused question, Enter to submit
  useEffect(() => {
    if (!data || activeTab !== 'quiz' || showResults) return;
    const handleKey = (e: KeyboardEvent) => {
      const q = data.questions[focusedQuestion];
      if (!q || !q.options) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= q.options.length) {
        handleOptionSelect(q.id, q.options[num - 1]);
      }
      if (e.key === 'Enter' && Object.keys(answers).length === data.questions.length) {
        handleCheckAnswers();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [data, activeTab, showResults, focusedQuestion, answers]);

  const handleCheckAnswers = () => {
      setShowResults(true);
      setTimerActive(false);
      if (data) {
          const score = calculateScore();
          const maxScore = data.questions.length;
          storageService.saveProgress({
              module: ModuleType.READING,
              score,
              maxScore,
              label: data.title
          });

          // Gamification
          const isPerfect = score === maxScore;
          const isSpeed = timeLeft > (timeLimit * 60 * 0.5);
          const bonuses: string[] = [];
          if (isPerfect) bonuses.push('reading_perfect');
          if (isSpeed) bonuses.push('reading_speed');
          const result = gamificationService.earnXP('reading_complete', bonuses);
          result.newBadges.forEach(b => showBadge(b));
          showXP(result.earned + result.bonus, 'Reading');
          setCompletionData({
              score,
              maxScore,
              xpEarned: result.earned,
              bonusXP: result.bonus,
              leveledUp: result.leveledUp,
              newLevel: result.newLevel,
              newBadges: result.newBadges
          });
          setShowCompletion(true);
      }
  };

  const saveToVault = (word: VocabItem) => {
      storageService.saveWord(word);
      // Optional: Add a toast notification here
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
      // Smooth scroll to top of sidebar on mobile if needed, but sticky covers desktop
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Highlighting Logic - Enhanced
  const renderHighlightedArticle = () => {
    if (!data) return null;
    
    // Safety cleanup: remove any markdown asterisks or hashes that might have slipped through
    const cleanArticle = data.article.replace(/[*#]/g, '');
    
    // Split by new words regex
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`\\b(${data.newWords.map(w => escapeRegExp(w.word)).join('|')})\\b`, 'gi');
    const parts = cleanArticle.split(pattern);

    return (
        <div className="prose prose-slate max-w-none font-serif text-slate-800 leading-loose" style={{ fontSize: `${articleFontSize}px` }}>
            {parts.map((part, i) => {
                const match = data.newWords.find(w => w.word.toLowerCase() === part.toLowerCase());
                const isSelected = selectedWord?.word.toLowerCase() === match?.word.toLowerCase();

                if (match) {
                    return (
                        <span 
                            key={i} 
                            onClick={() => handleWordClick(match)}
                            className={`
                                cursor-pointer px-1 rounded transition-all duration-200 font-medium
                                ${isSelected 
                                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200' 
                                    : 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-200 hover:bg-indigo-100'
                                }
                            `}
                        >
                            {part}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">

      {/* Completion overlay */}
      {showCompletion && (
        <CompletionScreen
          score={completionData.score}
          maxScore={completionData.maxScore}
          xpEarned={completionData.xpEarned}
          bonusXP={completionData.bonusXP}
          leveledUp={completionData.leveledUp}
          newLevel={completionData.newLevel}
          newBadges={completionData.newBadges}
          moduleLabel="Reading Practice"
          onRetry={() => { setData(null); setShowCompletion(false); setShowResults(false); setAnswers({}); }}
          onHome={() => { setData(null); setShowCompletion(false); setShowResults(false); setAnswers({}); }}
        />
      )}

      {/* Configuration Panel - Only show when no data */}
      {!data && (
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800 mb-2 font-serif">Design Your Reading Practice</h2>
                <p className="text-slate-500">Customize the topic, length, and difficulty for a personalized session.</p>
                {/* Difficulty quick-select */}
                <div className="flex justify-center gap-2 mt-4">
                    {(['easy', 'medium', 'hard'] as const).map(d => (
                        <button
                            key={d}
                            onClick={() => { setDifficulty(d); setLevel(DIFFICULTY_CEFR[d]); }}
                            className={`px-5 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                                difficulty === d
                                    ? d === 'easy' ? 'bg-emerald-500 border-emerald-500 text-white' : d === 'medium' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-red-500 border-red-500 text-white'
                                    : 'border-slate-200 text-slate-500 hover:border-indigo-300'
                            }`}
                        >
                            {d === 'easy' ? '🌱 Easy' : d === 'medium' ? '🔥 Medium' : '⚡ Hard'}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                 {/* Left Col Inputs */}
                 <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 block">Topic of Interest</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="e.g. Sustainable Architecture"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 block">Proficiency Level</label>
                            <select
                                value={level}
                                onChange={(e) => setLevel(e.target.value as CEFRLevel)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none"
                            >
                                {Object.values(CEFRLevel).map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 block">Article Style</label>
                            <select
                                value={style}
                                onChange={(e) => setStyle(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none"
                            >
                                {STYLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.split('(')[0]}</option>)}
                            </select>
                        </div>
                    </div>
                 </div>

                 {/* Right Col Inputs */}
                 <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 block">Length (Words)</label>
                            <input
                                type="number"
                                min="100"
                                max="800"
                                value={wordCount}
                                onChange={(e) => setWordCount(Number(e.target.value))}
                                className={`w-full bg-slate-50 border rounded-lg px-4 py-3 outline-none ${!isWordCountValid ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200'}`}
                            />
                            <p className={`text-[10px] text-right font-medium ${!isWordCountValid ? 'text-red-500' : 'text-slate-400'}`}>
                                Max 800 words
                            </p>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 block">New Vocabulary</label>
                            <input
                                type="number"
                                min="1" max="10"
                                value={newWordCount}
                                onChange={(e) => setNewWordCount(Number(e.target.value))}
                                className={`w-full bg-slate-50 border rounded-lg px-4 py-3 outline-none ${!isCountValid ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200'}`}
                            />
                            {!isCountValid && <p className="text-xs text-red-500 absolute">Max 10 words.</p>}
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 block">Question Type</label>
                            <select
                                value={questionType}
                                onChange={(e) => setQuestionType(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm outline-none"
                            >
                                {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                             <label className="text-sm font-bold text-slate-700 block">Timer (Min)</label>
                             <input
                                type="number"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(Number(e.target.value))}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 outline-none"
                            />
                        </div>
                     </div>
                 </div>
            </div>

            <button
                onClick={handleGenerate}
                disabled={loading || !isCountValid || !isWordCountValid}
                className="w-full mt-8 bg-slate-900 text-white py-4 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-3 font-bold text-lg shadow-lg shadow-slate-900/20"
            >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <BookOpen className="w-5 h-5" />}
                {loading ? 'Crafting Article...' : 'Generate Practice Material'}
            </button>
        </div>
      )}

      {/* READING INTERFACE */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:h-[calc(100vh-100px)]">
            
            {/* LEFT COLUMN: ARTICLE (Scrollable) */}
            <div className="lg:col-span-7 flex flex-col min-h-[50vh] lg:h-full bg-[#faf9f6] rounded-2xl border border-stone-200 shadow-sm overflow-hidden relative">
                {/* Article Header */}
                <div className="p-6 md:p-8 border-b border-stone-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                     <div className="flex justify-between items-start mb-4">
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
                            {style.split(' ')[0]} • Level {level}
                        </span>
                        <div className="flex items-center gap-3">
                            {/* Font size controls */}
                            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                <button
                                    onClick={() => setArticleFontSize(s => Math.max(13, s - 2))}
                                    className="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-white hover:shadow-sm transition-all text-xs font-bold"
                                    title="Decrease font size"
                                >
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-[10px] font-bold text-slate-500 px-1">{articleFontSize}px</span>
                                <button
                                    onClick={() => setArticleFontSize(s => Math.min(26, s + 2))}
                                    className="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-white hover:shadow-sm transition-all text-xs font-bold"
                                    title="Increase font size"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <TimerRing timeLeft={timeLeft} totalTime={timeLimit * 60} size={48} />
                        </div>
                     </div>
                     <h1 className="text-2xl md:text-3xl font-serif font-bold text-slate-900 leading-tight">
                         {data.title}
                     </h1>
                </div>

                {/* Article Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
                    {renderHighlightedArticle()}
                    <div className="h-20"></div> {/* Spacer */}
                </div>
            </div>

            {/* RIGHT COLUMN: LEARNING HUB (Sticky Sidebar) */}
            <div className="lg:col-span-5 flex flex-col h-full gap-4">
                
                {/* Tab Switcher */}
                <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex">
                    <button
                        onClick={() => setActiveTab('vocab')}
                        className={`flex-1 py-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'vocab' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <BrainCircuit className="w-4 h-4" />
                        Vocabulary ({data.newWords.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('quiz')}
                        className={`flex-1 py-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'quiz' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        Quiz ({data.questions.length})
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    
                    {/* VOCABULARY TAB */}
                    {activeTab === 'vocab' && (
                        <div className="h-full flex flex-col">
                            {selectedWord ? (
                                // FLASHCARD VIEW — enhanced
                                <div className="flex-1 p-6 flex flex-col animate-fade-in bg-gradient-to-br from-white to-indigo-50/30 overflow-y-auto">
                                    <button
                                        onClick={() => setSelectedWord(null)}
                                        className="text-slate-400 hover:text-indigo-600 text-sm font-medium mb-4 flex items-center gap-1 self-start"
                                    >
                                        <ArrowRight className="w-4 h-4 rotate-180" /> Back to list
                                    </button>

                                    {/* Word header */}
                                    <div className="mb-4">
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded uppercase tracking-wider">{selectedWord.pos}</span>
                                            {selectedWord.register && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${
                                                    selectedWord.register === 'academic'  ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                                                    selectedWord.register === 'formal'    ? 'bg-violet-50 text-violet-700 border-violet-200' :
                                                    selectedWord.register === 'technical' ? 'bg-teal-50 text-teal-700 border-teal-200'       :
                                                    selectedWord.register === 'informal'  ? 'bg-amber-50 text-amber-700 border-amber-200'     :
                                                    'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                    {selectedWord.register}
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-3xl font-serif font-bold text-indigo-900">{selectedWord.word}</h2>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        {/* Definition */}
                                        <div className="bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                                            <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-1">Definition</h3>
                                            <p className="text-base text-slate-800 leading-relaxed font-medium">{selectedWord.meaning}</p>
                                        </div>

                                        {/* Example */}
                                        <div>
                                            <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Example</h3>
                                            <div className="pl-4 border-l-4 border-indigo-300 italic text-slate-600 text-sm">
                                                "{selectedWord.example}"
                                            </div>
                                        </div>

                                        {/* Collocations */}
                                        {selectedWord.collocations && selectedWord.collocations.length > 0 && (
                                            <div>
                                                <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Common Collocations</h3>
                                                <div className="space-y-1.5">
                                                    {selectedWord.collocations.map((c, i) => {
                                                        const regex = new RegExp(`(${selectedWord.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                                                        const parts = c.split(regex);
                                                        return (
                                                            <div key={i} className="flex items-start gap-2 bg-white rounded-lg px-3 py-2 border border-slate-100">
                                                                <span className="w-1 h-1 bg-indigo-400 rounded-full flex-none mt-1.5" />
                                                                <span className="text-xs text-slate-700 italic">
                                                                    {parts.map((p, pi) => regex.test(p)
                                                                        ? <strong key={pi} className="font-bold not-italic text-indigo-700">{p}</strong>
                                                                        : <span key={pi}>{p}</span>
                                                                    )}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Synonyms + Antonyms */}
                                        {((selectedWord.synonyms && selectedWord.synonyms.length > 0) || (selectedWord.antonyms && selectedWord.antonyms.length > 0)) && (
                                            <div>
                                                <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Synonyms & Antonyms</h3>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {selectedWord.synonyms?.map(s => (
                                                        <span key={s} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-xs font-medium">≈ {s}</span>
                                                    ))}
                                                    {selectedWord.antonyms?.map(a => (
                                                        <span key={a} className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 rounded-full text-xs font-medium">≠ {a}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Grammar Note */}
                                        {selectedWord.grammarNote && (
                                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2.5">
                                                <Info className="w-4 h-4 text-amber-500 flex-none mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">Grammar Note</p>
                                                    <p className="text-xs text-amber-800 leading-relaxed">{selectedWord.grammarNote}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Word Formation */}
                                        {selectedWord.wordFormation && (
                                            <div>
                                                <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                                                    <GitBranch className="w-3 h-3" /> Word Family
                                                </h3>
                                                <div className="bg-white rounded-lg px-3 py-2.5 border border-slate-100">
                                                    <p className="text-xs text-slate-600 leading-relaxed">{selectedWord.wordFormation}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        id={`save-btn-${selectedWord.word}`}
                                        onClick={() => saveToVault(selectedWord)}
                                        className="mt-6 w-full py-3.5 border-2 border-slate-200 rounded-xl text-slate-600 font-bold hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                                    >
                                        <BookmarkPlus className="w-5 h-5" />
                                        Save to Vault
                                    </button>
                                </div>
                            ) : (
                                // LIST VIEW
                                <div className="h-full overflow-y-auto p-4">
                                    <div className="text-center py-8 px-4">
                                        <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <BrainCircuit className="w-8 h-8 text-indigo-500" />
                                        </div>
                                        <h3 className="font-bold text-slate-800 mb-1">Vocabulary Hub</h3>
                                        <p className="text-sm text-slate-500">Click highlighted words in the article to view details, or select from the list below.</p>
                                    </div>
                                    <div className="space-y-2">
                                        {data.newWords.map((w, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleWordClick(w)}
                                                className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:shadow-md hover:bg-white bg-slate-50/50 transition-all group"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-slate-700 group-hover:text-indigo-700 text-lg">{w.word}</span>
                                                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
                                                </div>
                                                <p className="text-xs text-slate-500 truncate mt-1">{w.meaning}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* QUIZ TAB */}
                    {activeTab === 'quiz' && (
                         <div className="h-full flex flex-col p-6 overflow-y-auto bg-slate-50/30">
                            <div className="mb-4">
                                <QuizProgressBar
                                    total={data.questions.length}
                                    current={Object.keys(answers).length}
                                    results={showResults ? data.questions.map(q =>
                                        answers[q.id]?.toLowerCase() === q.answer.toLowerCase() ? 'correct' :
                                        answers[q.id] ? 'wrong' : 'unanswered'
                                    ) : undefined}
                                />
                                {!showResults && <p className="text-xs text-slate-400 mt-1 text-right">Press 1–4 to select · Enter to submit</p>}
                            </div>
                            <div className="flex-1 space-y-6">
                                {data.questions.map((q, idx) => (
                                    <div key={q.id} onClick={() => setFocusedQuestion(idx)} className={`bg-white p-5 rounded-xl border shadow-sm cursor-pointer transition-all ${focusedQuestion === idx && !showResults ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
                                        <div className="flex gap-3 mb-4">
                                            <span className="flex-none w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold">{idx+1}</span>
                                            <p className="font-medium text-slate-800 text-sm leading-relaxed">{q.prompt}</p>
                                        </div>
                                        
                                        <div className="space-y-2 pl-9">
                                            {q.options ? q.options.map((opt, i) => {
                                                const isSelected = answers[q.id] === opt;
                                                const isCorrect = q.answer === opt;
                                                
                                                let stateStyles = "border-slate-200 hover:bg-slate-50 text-slate-600";
                                                if (showResults) {
                                                     if (isCorrect) stateStyles = "bg-green-50 border-green-500 text-green-800 font-medium";
                                                     else if (isSelected) stateStyles = "bg-red-50 border-red-300 text-red-800";
                                                     else stateStyles = "opacity-50";
                                                } else if (isSelected) {
                                                    stateStyles = "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm font-medium";
                                                }

                                                return (
                                                    <button
                                                        key={i}
                                                        onClick={() => !showResults && handleOptionSelect(q.id, opt)}
                                                        disabled={showResults}
                                                        className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-all flex items-center gap-3 ${stateStyles}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected || (showResults && isCorrect) ? 'border-current' : 'border-slate-300'}`}>
                                                            {(isSelected || (showResults && isCorrect)) && <div className="w-2 h-2 rounded-full bg-current"></div>}
                                                        </div>
                                                        {opt}
                                                    </button>
                                                )
                                            }) : (
                                                <input 
                                                    className="w-full border p-2 rounded" 
                                                    placeholder="Type answer..." 
                                                    disabled={showResults}
                                                    onChange={(e) => handleOptionSelect(q.id, e.target.value)}
                                                />
                                            )}
                                        </div>

                                        {showResults && (
                                            <div className="mt-4 ml-9 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100 animate-fade-in">
                                                <span className="font-bold block mb-1">Explanation:</span> {q.explanation}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {!showResults ? (
                                <button
                                    onClick={handleCheckAnswers}
                                    disabled={Object.keys(answers).length === 0}
                                    className="mt-6 w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2 disabled:opacity-40"
                                >
                                    <Zap className="w-5 h-5" /> Check Answers
                                </button>
                            ) : (
                                <div className="mt-6 flex gap-3">
                                    <button
                                        onClick={() => setShowCompletion(true)}
                                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
                                    >
                                        <Zap className="w-4 h-4" /> View Results
                                    </button>
                                    <button onClick={() => { setData(null); setShowResults(false); setAnswers({}); }} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl border border-slate-200">New Session</button>
                                </div>
                            )}
                         </div>
                    )}

                </div>
            </div>
        </div>
      )}
    </div>
  );
};