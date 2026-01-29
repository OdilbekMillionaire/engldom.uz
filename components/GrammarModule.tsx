import React, { useState } from 'react';
import { 
    Scale, CheckCircle2, AlertTriangle, RefreshCw, 
    Book, Zap, Search, Layout, Lightbulb, HelpCircle,
    ArrowRight, MessageSquare, Layers, FileWarning, Shuffle
} from 'lucide-react';
import { generateLingifyContent } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { ModuleType, CEFRLevel, GrammarResponse } from '../types';
import { ChatTutor } from './ChatTutor';

const COMMON_TOPICS = [
    { id: 'tenses_overview', label: '12 Tenses Overview' },
    { id: 'conditionals', label: 'Conditionals (0, 1, 2, 3)' },
    { id: 'passive_voice', label: 'Passive Voice' },
    { id: 'reported_speech', label: 'Reported Speech' },
    { id: 'articles', label: 'Articles (A/An/The)' },
    { id: 'prepositions', label: 'Prepositions of Place/Time' },
    { id: 'relative_clauses', label: 'Relative Clauses' },
    { id: 'modals', label: 'Modal Verbs' }
];

interface ExerciseState {
    status: 'idle' | 'correct' | 'incorrect';
    userAnswer: string;
    showHint: boolean;
    revealed: boolean;
}

export const GrammarModule: React.FC = () => {
    // Selection State
    const [selectedTopic, setSelectedTopic] = useState('');
    const [customTopic, setCustomTopic] = useState('');
    const [level, setLevel] = useState<CEFRLevel>(CEFRLevel.B2);
    
    // Application State
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<GrammarResponse | null>(null);
    const [exerciseStates, setExerciseStates] = useState<Record<string, ExerciseState>>({});
    
    // Chat State
    const [showChat, setShowChat] = useState(false);
    const [chatContext, setChatContext] = useState('');

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
        const isCorrect = state.userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
        
        setExerciseStates(prev => ({
            ...prev,
            [id]: { 
                ...prev[id], 
                status: isCorrect ? 'correct' : 'incorrect',
                revealed: isCorrect // If correct, we consider it revealed/done
            }
        }));
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

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {!data ? (
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
                        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Scale className="w-8 h-8 text-indigo-600" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 font-serif mb-2">Grammar Lab</h2>
                        <p className="text-slate-500 max-w-lg mx-auto">Select a core topic or ask the AI to explain a specific rule. We'll generate a tailored lesson and interactive drills.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Topic Selection */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Layout className="w-4 h-4" /> Core Topics
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {COMMON_TOPICS.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => { setSelectedTopic(t.label); setCustomTopic(''); }}
                                        className={`p-3 text-sm font-bold rounded-xl border text-left transition-all ${selectedTopic === t.label ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-indigo-200'}`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom & Settings */}
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                <Search className="w-4 h-4" /> Custom Focus
                            </h3>
                            <input 
                                type="text"
                                placeholder="e.g. 'Difference between used to and get used to'"
                                value={customTopic}
                                onChange={(e) => { setCustomTopic(e.target.value); setSelectedTopic(''); }}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
                            />
                            
                            <h3 className="font-bold text-slate-700 mb-2 mt-auto">Difficulty</h3>
                            <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                                {Object.values(CEFRLevel).map(l => (
                                    <button
                                        key={l}
                                        onClick={() => setLevel(l)}
                                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${level === l ? 'bg-white shadow text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {l}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => handleGenerate()}
                                disabled={loading}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                {loading ? 'Designing Lesson...' : 'Start Session'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid lg:grid-cols-12 gap-8 h-[calc(100vh-100px)]">
                    
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
                                <button 
                                    onClick={() => openChatWithContext("Can you explain this rule further?")}
                                    className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-2 transition-colors"
                                >
                                    <HelpCircle className="w-3 h-3" /> Ask Tutor
                                </button>
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
                                <div className="bg-white/5 rounded-xl p-6 border border-white/10 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10"><Zap className="w-12 h-12" /></div>
                                    <h3 className="font-sans font-bold text-indigo-300 mb-4 uppercase text-xs tracking-wider">Examples</h3>
                                    <div className="space-y-6">
                                        {data.lessonContent.examples.map((ex, i) => (
                                            <div key={i} className="relative pl-4 border-l-2 border-indigo-400/30">
                                                <p className="text-white text-lg mb-1 italic">"{ex.text}"</p>
                                                <p className="text-sm text-slate-400 font-sans">{ex.context}</p>
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
                                                <p className="text-xs text-slate-400 font-sans mt-2 border-t border-white/10 pt-2">
                                                    <span className="font-bold text-red-400 uppercase text-[10px]">Why?</span> {m.explanation}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Style Variations */}
                                {data.lessonContent.structureVariations && data.lessonContent.structureVariations.length > 0 && (
                                    <div>
                                        <h3 className="font-sans font-bold text-blue-400 mb-3 uppercase text-xs tracking-wider flex items-center gap-2">
                                            <Shuffle className="w-4 h-4" /> Style Variations
                                        </h3>
                                        <div className="space-y-3">
                                            {data.lessonContent.structureVariations.map((v, i) => (
                                                <div key={i} className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-[10px] font-bold text-blue-300 uppercase bg-blue-900/50 px-2 py-0.5 rounded">{v.context}</span>
                                                    </div>
                                                    <p className="text-slate-200 text-sm mb-1">"{v.text}"</p>
                                                    <p className="text-[10px] text-slate-400 italic font-sans">{v.note}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: THE GYM (Exercises) */}
                    <div className="lg:col-span-7 flex flex-col h-full bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-indigo-600" /> Practice Arena
                                </h3>
                                <p className="text-slate-500 text-sm">Apply the rules immediately.</p>
                            </div>
                            <button onClick={() => setData(null)} className="text-xs font-bold text-slate-400 hover:text-indigo-600">
                                Change Topic
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10 scroll-smooth">
                            {data.exercises.map((ex, i) => {
                                const state = exerciseStates[ex.id] || { status: 'idle', userAnswer: '', showHint: false, revealed: false };
                                const isCorrect = state.status === 'correct';
                                const isIncorrect = state.status === 'incorrect';

                                return (
                                    <div key={ex.id} className={`transition-all duration-500 ${isCorrect ? 'opacity-60' : 'opacity-100'}`}>
                                        <div className="flex gap-4 mb-4">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-none shadow-sm transition-colors ${isCorrect ? 'bg-emerald-100 text-emerald-600' : isIncorrect ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                                                {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                                            </span>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                                                        {ex.type.replace('_', ' ')}
                                                    </span>
                                                    {ex.hint && !isCorrect && (
                                                        <button 
                                                            onClick={() => toggleHint(ex.id)}
                                                            className={`text-xs flex items-center gap-1 font-bold transition-colors ${state.showHint ? 'text-yellow-600' : 'text-slate-400 hover:text-yellow-500'}`}
                                                        >
                                                            <Lightbulb className="w-3 h-3" /> {state.showHint ? 'Hide Hint' : 'Hint'}
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="font-medium text-slate-800 text-xl leading-relaxed">{ex.question}</p>
                                                
                                                {state.showHint && (
                                                    <div className="mt-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded-lg border border-yellow-100 animate-fade-in inline-block">
                                                        💡 {ex.hint}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pl-12">
                                            {ex.type === 'mcq' && ex.options ? (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                                    {ex.options.map((opt) => (
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
                                                                            : 'opacity-50 border-slate-200'
                                                                    : state.userAnswer === opt
                                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                                                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                                                            }`}
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
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
                                                                : 'bg-white border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                                                        }`}
                                                    />
                                                </div>
                                            )}

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