import React, { useState, useEffect } from 'react';
import {
    Scale, CheckCircle2, AlertTriangle, RefreshCw,
    Book, Zap, Layout, Lightbulb, HelpCircle,
    ArrowRight, MessageSquare, Layers, FileWarning,
    GraduationCap, Sparkles, Brain, Save, Trash2, X
} from 'lucide-react';
import { generateLingifyContent } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { ModuleType, CEFRLevel, GrammarResponse, SavedGrammarRule } from '../types';
import { ChatTutor } from './ChatTutor';
import { CompletionScreen } from './ui/CompletionScreen';
import { useXPToast } from './ui/XPToastProvider';
import { gamificationService } from '../services/gamificationService';

const COMMON_TOPICS = [
    { id: 'tenses_overview', label: '12 Tenses Overview', icon: ClockIcon, color: 'bg-blue-50 text-blue-600' },
    { id: 'conditionals', label: 'Conditionals (0-3)', icon: SplitIcon, color: 'bg-purple-50 text-purple-600' },
    { id: 'passive_voice', label: 'Passive Voice', icon: Layers, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'reported_speech', label: 'Reported Speech', icon: MessageSquare, color: 'bg-orange-50 text-orange-600' },
    { id: 'articles', label: 'Articles (A/An/The)', icon: Book, color: 'bg-pink-50 text-pink-600' },
    { id: 'prepositions', label: 'Prepositions', icon: MapIcon, color: 'bg-cyan-50 text-cyan-600' },
    { id: 'relative_clauses', label: 'Relative Clauses', icon: LinkIcon, color: 'bg-indigo-50 text-indigo-600' },
    { id: 'modals', label: 'Modal Verbs', icon: StarIcon, color: 'bg-yellow-50 text-yellow-600' }
];

// Helper Icons
function ClockIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>; }
function SplitIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.87l-4.15-4.15"/><path d="m20 9-4.15 4.15A4 4 0 0 0 14.67 16v6"/></svg>; }
function MapIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><line x1="9" x2="9" y1="3" y2="18"/><line x1="15" x2="15" y1="6" y2="21"/></svg>; }
function LinkIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>; }
function StarIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>; }

interface ExerciseState {
    status: 'idle' | 'correct' | 'incorrect';
    userAnswer: string;
    showHint: boolean;
    revealed: boolean;
}

interface GrammarModuleProps {
    initialData?: GrammarResponse;
}

export const GrammarModule: React.FC<GrammarModuleProps> = ({ initialData }) => {
    // Selection State
    const [selectedTopic, setSelectedTopic] = useState('');
    const [customTopic, setCustomTopic] = useState('');
    const [level, setLevel] = useState<CEFRLevel>(CEFRLevel.B2);
    
    // Application State
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<GrammarResponse | null>(null);
    const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>({});
    
    // Cheat Sheet State
    const [showCheatSheet, setShowCheatSheet] = useState(false);
    const [savedRules, setSavedRules] = useState<SavedGrammarRule[]>([]);

    // Chat State
    const [showChat, setShowChat] = useState(false);
    const [chatContext, setChatContext] = useState('');

    // Gamification
    const [showCompletion, setShowCompletion] = useState(false);
    const [completionData, setCompletionData] = useState({ score: 0, maxScore: 0, xpEarned: 0, bonusXP: 0, leveledUp: false, newLevel: 0, newBadges: [] as any[] });
    const { showXP, showBadge } = useXPToast();

    useEffect(() => {
        if (initialData) {
            setData(initialData);
            // Re-init states
            const initialStates: Record<string, ExerciseState> = {};
            initialData.exercises.forEach(ex => {
                initialStates[ex.id] = { status: 'idle', userAnswer: '', showHint: false, revealed: false };
            });
            setExerciseStates(initialStates);
            setShowChat(false);
        }
        setSavedRules(storageService.getGrammarRules());
    }, [initialData]);

    const handleGenerate = async (topicOverride?: string) => {
        const topicToUse = topicOverride || customTopic || selectedTopic;
        if (!topicToUse) {
            alert("Please select or enter a topic.");
            return;
        }

        setLoading(true);
        setData(null);
        setExerciseStates({});
        setShowChat(false);

        try {
            const res = await generateLingifyContent<GrammarResponse>(ModuleType.GRAMMAR, {
                topic: topicToUse,
                level: level
            });
            setData(res);
            
            // Initialize states
            const initialStates: Record<string, ExerciseState> = {};
            res.exercises.forEach(ex => {
                initialStates[ex.id] = { status: 'idle', userAnswer: '', showHint: false, revealed: false };
            });
            setExerciseStates(initialStates);

            storageService.saveActivity(ModuleType.GRAMMAR, res);
        } catch (e) {
            alert("Failed to generate grammar lesson.");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckAnswer = (id: string, correctAnswer: string) => {
        const state = exerciseStates[id];
        // Normalize for comparison
        const user = state.userAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
        const correct = correctAnswer.trim().toLowerCase().replace(/\s+/g, ' ');

        const isCorrect = user === correct;

        setExerciseStates(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                status: isCorrect ? 'correct' : 'incorrect',
                revealed: true
            }
        }));
    };

    const handleCompleteLesson = () => {
        if (!data) return;
        const states = Object.values(exerciseStates);
        const score = states.filter(s => s.status === 'correct').length;
        const maxScore = data.exercises.length;
        storageService.saveProgress({
            module: ModuleType.GRAMMAR,
            score,
            maxScore,
            label: data.topic
        });
        const isPerfect = score === maxScore;
        const bonuses: string[] = [];
        if (isPerfect) bonuses.push('grammar_perfect');
        const result = gamificationService.earnXP('grammar_complete', bonuses as any);
        result.newBadges.forEach(b => showBadge(b));
        showXP(result.earned + result.bonus, 'Grammar');
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
    };

    const toggleHint = (id: string) => {
        setExerciseStates(prev => ({
            ...prev,
            [id]: { ...prev[id], showHint: !prev[id].showHint }
        }));
    };

    const openChatWithContext = (extraContext: string = "") => {
        if (!data) return;
        const ctx = `Current Grammar Topic: ${data.topic}\nRule: ${data.lessonContent.coreRule}\n\n${extraContext}`;
        setChatContext(ctx);
        setShowChat(true);
    };

    // --- Cheat Sheet Functions ---
    const saveCurrentRule = () => {
        if (!data) return;
        storageService.saveGrammarRule({
            topic: data.topic,
            rule: data.lessonContent.coreRule,
            example: data.lessonContent.examples[0]?.text || ''
        });
        setSavedRules(storageService.getGrammarRules());
        alert("Rule saved to your Cheat Sheet!");
    };

    const removeRule = (id: string) => {
        storageService.removeGrammarRule(id);
        setSavedRules(storageService.getGrammarRules());
    };

    // --- Reorder Logic ---
    const handleReorderClick = (exId: string, word: string) => {
        const current = exerciseStates[exId]?.userAnswer || "";
        const newAnswer = current ? `${current} ${word}` : word;
        setExerciseStates(prev => ({
            ...prev,
            [exId]: { ...prev[exId], userAnswer: newAnswer, status: 'idle' }
        }));
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {!data ? (
                <div className="space-y-12 max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="text-center space-y-4 py-12 bg-surface rounded-3xl shadow-sm border border-sub-border relative">
                        {savedRules.length > 0 && (
                            <button 
                                onClick={() => setShowCheatSheet(true)}
                                className="absolute top-6 right-6 text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-full transition-all flex items-center gap-2"
                            >
                                <Book className="w-4 h-4" /> My Cheat Sheet ({savedRules.length})
                            </button>
                        )}
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Scale className="w-10 h-10 text-indigo-600" />
                        </div>
                        <h2 className="text-4xl font-bold text-t-1 font-serif">Grammar Laboratory</h2>
                        <p className="text-t-3 max-w-xl mx-auto text-lg">
                            Master complex rules through AI-generated explanations and adaptive drills. Select a core topic or define your own.
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-12 gap-8">
                        {/* LEFT: Quick Start Grid */}
                        <div className="lg:col-span-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-t-1 text-xl flex items-center gap-2">
                                    <Layout className="w-5 h-5 text-indigo-500" /> Core Topics
                                </h3>
                                <div className="flex bg-surface-2 p-1 rounded-lg">
                                    {Object.values(CEFRLevel).slice(2).map(l => (
                                        <button
                                            key={l}
                                            onClick={() => setLevel(l)}
                                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${level === l ? 'bg-surface shadow text-indigo-700' : 'text-t-3'}`}
                                        >
                                            {l}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                {COMMON_TOPICS.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleGenerate(t.label)}
                                        disabled={loading}
                                        className="group relative bg-surface p-6 rounded-2xl border border-sub-border shadow-sm hover:shadow-md hover:border-indigo-100 transition-all text-left overflow-hidden"
                                    >
                                        <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${t.color}`}>
                                            <t.icon className="w-16 h-16" />
                                        </div>
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${t.color}`}>
                                            <t.icon className="w-5 h-5" />
                                        </div>
                                        <h4 className="font-bold text-t-1 text-lg group-hover:text-indigo-700 transition-colors">{t.label}</h4>
                                        <div className="flex items-center gap-2 mt-2 text-xs font-bold text-t-4 group-hover:text-indigo-400">
                                            Start Session <ArrowRight className="w-3 h-3" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: Custom & AI */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <Brain className="w-32 h-32" />
                                </div>
                                <h3 className="font-bold text-xl mb-2 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-yellow-400" /> Custom Focus
                                </h3>
                                <p className="text-indigo-200 text-sm mb-6 leading-relaxed">
                                    Struggling with a specific rule? Describe it, and the AI will build a lesson just for you.
                                </p>
                                
                                <div className="space-y-4 relative z-10">
                                    <div>
                                        <label className="text-xs font-bold text-indigo-300 uppercase mb-2 block">Topic Description</label>
                                        <input 
                                            type="text"
                                            value={customTopic}
                                            onChange={(e) => setCustomTopic(e.target.value)}
                                            placeholder="e.g. 'Difference between used to and get used to'"
                                            className="w-full p-4 rounded-xl bg-surface/10 border border-white/20 text-white placeholder:text-indigo-300/50 focus:bg-surface/20 outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleGenerate()}
                                        disabled={loading || !customTopic}
                                        className="w-full py-4 bg-surface text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                    >
                                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-indigo-600" />}
                                        {loading ? 'Analyzing...' : 'Generate Lesson'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid lg:grid-cols-12 gap-8 h-[calc(100vh-100px)] relative">
                    {/* Completion overlay */}
                    {showCompletion && (
                        <div className="absolute inset-0 z-50 bg-surface/95 backdrop-blur-sm rounded-3xl overflow-auto">
                            <CompletionScreen
                                score={completionData.score}
                                maxScore={completionData.maxScore}
                                xpEarned={completionData.xpEarned}
                                bonusXP={completionData.bonusXP}
                                leveledUp={completionData.leveledUp}
                                newLevel={completionData.newLevel}
                                newBadges={completionData.newBadges}
                                moduleLabel="Grammar Lesson"
                                onRetry={() => { setData(null); setShowCompletion(false); setExerciseStates({}); }}
                                onHome={() => { setData(null); setShowCompletion(false); setExerciseStates({}); }}
                            />
                        </div>
                    )}
                    
                    {/* LEFT: THE BLACKBOARD (Lesson) */}
                    <div className="lg:col-span-5 flex flex-col h-full bg-[#2c3e50] rounded-3xl shadow-2xl overflow-hidden text-slate-200 border-4 border-slate-800 relative">
                        {/* Chalk dust effect */}
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/black-felt.png')] pointer-events-none"></div>
                        
                        <div className="p-6 md:p-8 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-slate-600">
                            <div className="flex justify-between items-start mb-6 opacity-80">
                                <div className="flex items-center gap-3">
                                    <Book className="w-5 h-5" />
                                    <span className="text-xs font-bold tracking-widest uppercase">The Blackboard</span>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={saveCurrentRule}
                                        className="text-xs bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors border border-emerald-500/30"
                                    >
                                        <Save className="w-3 h-3" /> Save Rule
                                    </button>
                                    <button 
                                        onClick={() => openChatWithContext("Can you explain this rule further?")}
                                        className="text-xs bg-surface/10 hover:bg-surface/20 px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors"
                                    >
                                        <HelpCircle className="w-3 h-3" /> Ask Tutor
                                    </button>
                                </div>
                            </div>
                            
                            <h2 className="text-3xl font-serif font-bold text-white mb-6 border-b border-white/20 pb-4">
                                {data.topic}
                            </h2>
                            
                            <div className="space-y-8 font-serif">
                                
                                {/* Core Rule */}
                                <div>
                                    <h3 className="font-sans font-bold text-emerald-400 mb-2 uppercase text-xs tracking-wider">The Rule</h3>
                                    <p className="text-xl leading-relaxed text-slate-100 font-bold">
                                        {data.lessonContent.coreRule}
                                    </p>
                                </div>

                                {/* Deep Dive */}
                                <div>
                                    <h3 className="font-sans font-bold text-indigo-300 mb-2 uppercase text-xs tracking-wider flex items-center gap-2">
                                        <Layers className="w-4 h-4" /> Deep Dive
                                    </h3>
                                    <p className="text-slate-300 leading-relaxed text-sm whitespace-pre-line">
                                        {data.lessonContent.detailedExplanation}
                                    </p>
                                </div>

                                {/* Examples */}
                                <div className="bg-surface/5 rounded-xl p-6 border border-white/10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10"><Zap className="w-12 h-12" /></div>
                                    <h3 className="font-sans font-bold text-indigo-300 mb-4 uppercase text-xs tracking-wider">Examples</h3>
                                    <div className="space-y-6">
                                        {data.lessonContent.examples.map((ex, i) => (
                                            <div key={i} className="relative pl-4 border-l-2 border-indigo-400/30">
                                                <p className="text-white text-lg mb-1 italic">"{ex.text}"</p>
                                                <p className="text-sm text-t-4 font-sans">{ex.context}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Common Mistakes (Pitfall Prevention) */}
                                <div>
                                    <h3 className="font-sans font-bold text-red-400 mb-3 uppercase text-xs tracking-wider flex items-center gap-2">
                                        <FileWarning className="w-4 h-4" /> Pitfall Prevention
                                    </h3>
                                    <div className="space-y-4">
                                        {data.lessonContent.commonMistakes.map((m, i) => (
                                            <div key={i} className="bg-red-500/10 p-4 rounded-lg border border-red-500/20">
                                                <div className="flex gap-2 text-slate-300 mb-2">
                                                    <span className="text-red-500 font-bold">×</span>
                                                    <span className="line-through decoration-red-500/50">{m.error}</span>
                                                </div>
                                                <div className="flex gap-2 text-emerald-400 mb-2">
                                                    <span className="font-bold">✓</span>
                                                    <span>{m.correction}</span>
                                                </div>
                                                <p className="text-xs text-t-4 font-sans mt-2 border-t border-white/10 pt-2">
                                                    <span className="font-bold text-red-400 uppercase text-[10px]">Why?</span> {m.explanation}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: THE GYM (Exercises) */}
                    <div className="lg:col-span-7 flex flex-col h-full bg-surface rounded-3xl border border-base-border shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-sub-border flex justify-between items-center bg-background">
                            <div>
                                <h3 className="font-bold text-t-1 text-lg flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-indigo-600" /> Practice Arena
                                </h3>
                                <p className="text-t-3 text-sm">Apply the rules immediately.</p>
                            </div>
                            <button onClick={() => setData(null)} className="text-xs font-bold text-t-4 hover:text-indigo-600">
                                Change Topic
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 scroll-smooth">
                            {(() => {
                                const allRevealed = data.exercises.length > 0 && data.exercises.every(ex => exerciseStates[ex.id]?.revealed);
                                return allRevealed ? (
                                    <div className="sticky top-0 z-10 bg-surface/90 backdrop-blur-sm pb-4 -mx-2 px-2 animate-fade-in">
                                        <button
                                            onClick={handleCompleteLesson}
                                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all"
                                        >
                                            <GraduationCap className="w-5 h-5" /> Complete Lesson & Earn XP
                                        </button>
                                    </div>
                                ) : null;
                            })()}
                            {data.exercises.map((ex, i) => {
                                const state = exerciseStates[ex.id] || { status: 'idle', userAnswer: '', showHint: false, revealed: false };
                                const isCorrect = state.status === 'correct';
                                const isIncorrect = state.status === 'incorrect';

                                return (
                                    <div key={ex.id} className={`transition-all duration-500 ${isCorrect ? 'opacity-60' : 'opacity-100'}`}>
                                        <div className="flex gap-4 mb-4">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-none shadow-sm transition-colors ${isCorrect ? 'bg-emerald-100 text-emerald-600' : isIncorrect ? 'bg-red-100 text-red-600' : 'bg-surface-2 text-t-2'}`}>
                                                {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[10px] font-bold text-t-4 uppercase tracking-wider mb-1 block">
                                                        {ex.type.replace('_', ' ')}
                                                    </span>
                                                    {ex.hint && !isCorrect && (
                                                        <button 
                                                            onClick={() => toggleHint(ex.id)}
                                                            className={`text-xs flex items-center gap-1 font-bold transition-colors ${state.showHint ? 'text-yellow-600' : 'text-t-4 hover:text-yellow-500'}`}
                                                        >
                                                            <Lightbulb className="w-3 h-3" /> {state.showHint ? 'Hide Hint' : 'Hint'}
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="font-medium text-t-1 text-xl leading-relaxed">{ex.question}</p>
                                                
                                                {state.showHint && (
                                                    <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded-lg border border-yellow-100 animate-fade-in inline-block">
                                                        💡 {ex.hint}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pl-12">
                                            {/* --- MCQ & GAP FILL (Dropdown) --- */}
                                            {(ex.type === 'mcq' || (ex.type === 'gap_fill' && ex.options)) && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                                    {ex.options?.map((opt) => (
                                                        <button
                                                            key={opt}
                                                            onClick={() => setExerciseStates(prev => ({...prev, [ex.id]: {...prev[ex.id], userAnswer: opt, status: 'idle'}}))}
                                                            disabled={state.revealed}
                                                            className={`p-4 rounded-xl border text-sm font-medium text-left transition-all ${
                                                                state.revealed
                                                                    ? opt === ex.answer
                                                                        ? 'bg-emerald-100 border-emerald-500 text-emerald-800'
                                                                        : state.userAnswer === opt
                                                                            ? 'bg-red-50 border-red-300 text-red-800'
                                                                            : 'opacity-50 border-base-border'
                                                                    : state.userAnswer === opt
                                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                                                        : 'bg-surface hover:bg-background border-base-border text-t-2'
                                                            }`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* --- SENTENCE REORDER --- */}
                                            {ex.type === 'reorder' && ex.scrambled && (
                                                <div className="mb-4">
                                                    {/* User Constructed Sentence Area */}
                                                    <div className={`min-h-[60px] p-4 rounded-xl border-2 border-dashed mb-4 flex flex-wrap gap-2 items-center transition-all ${state.revealed ? (isCorrect ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50') : 'border-slate-300 bg-background'}`}>
                                                        {state.userAnswer ? (
                                                            state.userAnswer.split(' ').map((word, wIdx) => (
                                                                <span key={wIdx} className="px-3 py-1.5 bg-surface border border-base-border rounded-lg shadow-sm font-bold text-t-2">
                                                                    {word}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-t-4 text-sm">Click words below to build sentence...</span>
                                                        )}
                                                        {state.userAnswer && !state.revealed && (
                                                            <button 
                                                                onClick={() => setExerciseStates(prev => ({...prev, [ex.id]: {...prev[ex.id], userAnswer: ''}}))}
                                                                className="ml-auto text-xs text-red-500 hover:underline"
                                                            >
                                                                Clear
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Scrambled Word Bank */}
                                                    <div className="flex flex-wrap gap-2">
                                                        {ex.scrambled.map((word, wIdx) => {
                                                            // Simple check if word used (not robust for duplicate words but acceptable for MVP)
                                                            // Better to use index tracking but keeping simple for now
                                                            const isUsed = state.userAnswer.includes(word); // Limitation: duplicate words
                                                            return (
                                                                <button
                                                                    key={wIdx}
                                                                    onClick={() => handleReorderClick(ex.id, word)}
                                                                    disabled={state.revealed}
                                                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all transform active:scale-95 ${
                                                                        state.revealed 
                                                                        ? 'opacity-50 cursor-not-allowed bg-surface-2 text-t-4'
                                                                        : 'bg-surface border border-base-border shadow-sm hover:border-indigo-300 hover:text-indigo-600 text-t-2'
                                                                    }`}
                                                                >
                                                                    {word}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* --- STANDARD TEXT INPUT (Fallback or pure gap_fill) --- */}
                                            {ex.type === 'fix_error' || (ex.type === 'gap_fill' && !ex.options) ? (
                                                <div className="mb-4">
                                                    <input
                                                        type="text"
                                                        value={state.userAnswer}
                                                        onChange={(e) => setExerciseStates(prev => ({...prev, [ex.id]: {...prev[ex.id], userAnswer: e.target.value, status: 'idle'}}))}
                                                        onKeyDown={(e) => e.key === 'Enter' && !state.revealed && handleCheckAnswer(ex.id, ex.answer)}
                                                        disabled={state.revealed}
                                                        placeholder="Type your answer..."
                                                        className={`w-full p-4 rounded-xl border outline-none transition-all text-lg ${
                                                            state.revealed
                                                                ? isCorrect
                                                                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-bold'
                                                                    : 'bg-red-50 border-red-300 text-red-800 line-through'
                                                                : 'bg-surface border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                                                        }`}
                                                    />
                                                </div>
                                            ) : null}

                                            {/* Action Bar */}
                                            {!state.revealed ? (
                                                <div className="flex gap-3">
                                                    <button 
                                                        onClick={() => handleCheckAnswer(ex.id, ex.answer)}
                                                        disabled={!state.userAnswer}
                                                        className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        Check
                                                    </button>
                                                    {isIncorrect && (
                                                        <span className="text-red-500 text-sm font-bold flex items-center animate-shake">
                                                            Try again!
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="animate-fade-in">
                                                    <div className={`p-4 rounded-xl border text-sm mb-2 ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                                        <div className="flex items-center gap-2 font-bold mb-1">
                                                            {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} 
                                                            {isCorrect ? 'Excellent!' : `Correct Answer: ${ex.answer}`}
                                                        </div>
                                                        <p className="opacity-90">{ex.explanation}</p>
                                                    </div>
                                                    
                                                    <div className="flex gap-3 mt-2">
                                                        <button 
                                                            onClick={() => openChatWithContext(`I didn't understand why the answer to "${ex.question}" is "${ex.answer}". The explanation was "${ex.explanation}". Can you clarify?`)}
                                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                                        >
                                                            <MessageSquare className="w-3 h-3" /> Discuss with Tutor
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Cheat Sheet Modal */}
            {showCheatSheet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-surface w-full max-w-2xl h-[600px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                        <div className="bg-indigo-600 text-white p-6 flex justify-between items-center">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                <Book className="w-5 h-5" /> My Cheat Sheet
                            </h3>
                            <button onClick={() => setShowCheatSheet(false)} className="hover:bg-indigo-700 p-2 rounded-full">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background">
                            {savedRules.length === 0 ? (
                                <div className="text-center text-t-4 py-12">
                                    <Save className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No saved rules yet. Use the "Save Rule" button during lessons.</p>
                                </div>
                            ) : (
                                savedRules.map(rule => (
                                    <div key={rule.id} className="bg-surface p-6 rounded-xl border border-base-border shadow-sm relative group">
                                        <button 
                                            onClick={() => removeRule(rule.id)}
                                            className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                        <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-2 bg-indigo-50 inline-block px-2 py-1 rounded">
                                            {rule.topic}
                                        </div>
                                        <h4 className="font-bold text-t-1 text-lg mb-2">{rule.rule}</h4>
                                        <div className="pl-3 border-l-4 border-emerald-300 bg-emerald-50/50 p-2 rounded-r-lg">
                                            <p className="text-sm text-emerald-800 italic">"{rule.example}"</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showChat && data && (
                <ChatTutor 
                    isOpen={showChat} 
                    onClose={() => setShowChat(false)} 
                    context={chatContext}
                />
            )}
        </div>
    );
};