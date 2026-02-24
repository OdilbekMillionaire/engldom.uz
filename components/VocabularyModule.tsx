import React, { useState, useEffect, useCallback } from 'react';
import { storageService } from '../services/storageService';
import { VocabItem, ModuleType, CEFRLevel, VocabGenerationResponse } from '../types';
import {
    BookmarkPlus, Sparkles, List, Library, GraduationCap, CheckCircle2,
    CheckSquare, Layers, FileDown, RefreshCw, ChevronDown, ChevronUp,
    Info, Copy, Check, BookOpen, GitBranch
} from 'lucide-react';
import { generateLingifyContent } from '../services/geminiService';

const IELTS_TOPICS = [
    "The Ethics of AI", "Globalization", "Climate Change", "Remote Work",
    "Urbanization", "Mental Health", "Space Exploration", "Social Media Impact"
];

const WORD_TYPES = [
    { id: 'academic', label: 'Formal Academic', icon: GraduationCap },
    { id: 'idioms', label: 'Idioms', icon: Sparkles },
    { id: 'phrasal', label: 'Phrasal Verbs', icon: Layers },
    { id: 'colloquial', label: 'Colloquial', icon: MessageSquareIcon },
    { id: 'slang', label: 'Slang', icon: ZapIcon }
];

const INCLUSIONS = [
    { id: 'synonyms', label: 'Synonyms / Antonyms' },
    { id: 'collocations', label: 'High-Frequency Collocations' },
    { id: 'formation', label: 'Word Formation / Roots' }
];

// Icons helpers
function MessageSquareIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function ZapIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>; }

// Register badge with semantic colour coding
const REGISTER_STYLES: Record<string, string> = {
    formal:    'bg-violet-50 text-violet-700 border-violet-200',
    academic:  'bg-indigo-50 text-indigo-700 border-indigo-200',
    informal:  'bg-amber-50  text-amber-700  border-amber-200',
    technical: 'bg-teal-50   text-teal-700   border-teal-200',
    neutral:   'bg-slate-100 text-slate-600  border-slate-200',
    colloquial:'bg-orange-50 text-orange-700 border-orange-200',
};

const RegisterBadge: React.FC<{ register: string }> = ({ register }) => {
    const key = register.toLowerCase();
    const cls = REGISTER_STYLES[key] || REGISTER_STYLES.neutral;
    return (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${cls}`}>
            {register}
        </span>
    );
};

// Highlight the target word inside a collocation phrase
const CollocationPhrase: React.FC<{ phrase: string; word: string }> = ({ phrase, word }) => {
    const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = phrase.split(regex);
    return (
        <span className="text-xs text-slate-700 italic">
            {parts.map((part, i) =>
                regex.test(part)
                    ? <strong key={i} className="font-bold not-italic text-indigo-700">{part}</strong>
                    : <span key={i}>{part}</span>
            )}
        </span>
    );
};

interface VocabularyModuleProps {
    initialData?: VocabGenerationResponse;
}

export const VocabularyModule: React.FC<VocabularyModuleProps> = ({ initialData }) => {
    // Generator State
    const [topic, setTopic] = useState('');
    const [level, setLevel] = useState<CEFRLevel>(CEFRLevel.C1);
    const [count, setCount] = useState(10);
    const [selectedTypes, setSelectedTypes] = useState<string[]>(['academic']);
    const [selectedInclusions, setSelectedInclusions] = useState<string[]>(['synonyms', 'collocations']);
    const [generatedData, setGeneratedData] = useState<VocabGenerationResponse | null>(null);
    const [genLoading, setGenLoading] = useState(false);
    const [savedAll, setSavedAll] = useState(false);

    // Card expansion & copy state
    const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
    const [copiedWord, setCopiedWord] = useState<string | null>(null);
    const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

    // Restore State Effect
    useEffect(() => {
        if (initialData) {
            setGeneratedData(initialData);
        }
    }, [initialData]);

    // --- Generator Logic ---
    const toggleType = (id: string) => {
        setSelectedTypes(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleInclusion = (id: string) => {
        setSelectedInclusions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const toggleCard = useCallback((word: string) => {
        setExpandedCards(prev => {
            const next = new Set(prev);
            if (next.has(word)) next.delete(word);
            else next.add(word);
            return next;
        });
    }, []);

    const copyToClipboard = useCallback((word: string, meaning: string) => {
        navigator.clipboard.writeText(`${word}: ${meaning}`).then(() => {
            setCopiedWord(word);
            setTimeout(() => setCopiedWord(null), 2000);
        });
    }, []);

    const handleGenerate = async () => {
        if (!topic) { alert("Please enter or select a topic."); return; }
        setGenLoading(true);
        setGeneratedData(null);
        setSavedAll(false);
        setExpandedCards(new Set());
        setSavedWords(new Set());
        try {
            const res = await generateLingifyContent<VocabGenerationResponse>(ModuleType.VOCABULARY, {
                task: 'generate_list',
                topic,
                level,
                count,
                types: selectedTypes,
                inclusions: selectedInclusions
            });
            setGeneratedData(res);
            storageService.saveActivity(ModuleType.VOCABULARY, res);
        } catch (e) {
            alert("Generation failed. Please try again.");
        } finally {
            setGenLoading(false);
        }
    };

    const saveGeneratedWord = (w: VocabItem) => {
        storageService.saveWord(w);
        setSavedWords(prev => new Set(prev).add(w.word));
    };

    const handleSaveAll = () => {
        if (!generatedData) return;
        storageService.saveWords(generatedData.words);
        setSavedAll(true);
        setSavedWords(new Set(generatedData.words.map(w => w.word)));
    };

    return (
        <div className="space-y-6 pb-12">

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
                <h2 className="text-3xl font-bold text-slate-800 font-serif mb-2">Vocabulary Generator</h2>
                <p className="text-slate-500">Create custom word lists tailored to your IELTS topic and proficiency level.</p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Left: Configuration Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 sticky top-24">
                        <h3 className="font-bold text-indigo-900 mb-6 flex items-center gap-2">
                            <Sparkles className="w-5 h-5" /> Settings
                        </h3>

                        {/* Topic */}
                        <div className="space-y-4 mb-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Select Topic</label>
                                <select
                                    onChange={(e) => setTopic(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                                    value={IELTS_TOPICS.includes(topic) ? topic : ''}
                                >
                                    <option value="" disabled>-- Common IELTS Topics --</option>
                                    {IELTS_TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Or, Specific Topic</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="e.g., The Ethics of AI"
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                                />
                            </div>
                        </div>

                        {/* Level & Count */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">CEFR Level</label>
                                <select
                                    value={level}
                                    onChange={(e) => setLevel(e.target.value as CEFRLevel)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                >
                                    {Object.values(CEFRLevel).map(l => <option key={l} value={l}>{l} ({l === 'C2' ? 'Mastery' : l === 'C1' ? 'Advanced' : 'Intermediate'})</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase">Count (2–20)</label>
                                <input
                                    type="number"
                                    min="2" max="20"
                                    value={count}
                                    onChange={(e) => setCount(Number(e.target.value))}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                                />
                            </div>
                        </div>

                        {/* Word Types */}
                        <div className="mb-6">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Word Types to Include</label>
                            <div className="grid grid-cols-2 gap-2">
                                {WORD_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => toggleType(type.id)}
                                        className={`p-3 rounded-xl border text-left text-xs font-bold transition-all flex items-center gap-2 ${selectedTypes.includes(type.id) ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedTypes.includes(type.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                            {selectedTypes.includes(type.id) && <CheckSquare className="w-3 h-3 text-white" />}
                                        </div>
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Detailed Inclusions */}
                        <div className="mb-8">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-3 block">Detailed Inclusions</label>
                            <div className="space-y-2">
                                {INCLUSIONS.map(inc => (
                                    <button
                                        key={inc.id}
                                        onClick={() => toggleInclusion(inc.id)}
                                        className="flex items-center gap-3 w-full"
                                    >
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedInclusions.includes(inc.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                                            {selectedInclusions.includes(inc.id) && <CheckSquare className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className={`text-sm ${selectedInclusions.includes(inc.id) ? 'font-bold text-indigo-900' : 'text-slate-600'}`}>{inc.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={genLoading || !topic}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {genLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <List className="w-5 h-5" />}
                            {genLoading ? 'Generating...' : 'Generate Glossary'}
                        </button>
                    </div>
                </div>

                {/* Right: Output */}
                <div className="lg:col-span-8">
                    {generatedData ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* Results header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Results: {generatedData.topic}</h3>
                                    <div className="flex gap-2 mt-1">
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{generatedData.words.length} Terms</span>
                                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">Saved to History</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSaveAll}
                                    disabled={savedAll}
                                    className={`px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${savedAll ? 'bg-green-100 text-green-700' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'}`}
                                >
                                    {savedAll ? <CheckCircle2 className="w-4 h-4" /> : <FileDown className="w-4 h-4" />}
                                    {savedAll ? 'All Saved' : 'Save All to Vault'}
                                </button>
                            </div>

                            {/* Word cards */}
                            <div className="grid md:grid-cols-2 gap-4">
                                {generatedData.words.map((w, i) => {
                                    const isExpanded = expandedCards.has(w.word);
                                    const isSaved = savedWords.has(w.word);
                                    const isCopied = copiedWord === w.word;

                                    return (
                                        <div
                                            key={i}
                                            className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-indigo-300 shadow-xl' : 'border-slate-200 hover:border-indigo-200 hover:shadow-md'}`}
                                        >
                                            {/* Card top strip — register colour accent */}
                                            {w.register && (
                                                <div className={`h-1 w-full ${
                                                    w.register === 'academic' ? 'bg-indigo-400' :
                                                    w.register === 'formal'   ? 'bg-violet-400' :
                                                    w.register === 'technical'? 'bg-teal-400'   :
                                                    w.register === 'informal' ? 'bg-amber-400'  :
                                                    'bg-slate-200'
                                                }`} />
                                            )}

                                            {/* Header row */}
                                            <div className="p-5 pb-3 flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xl font-serif font-bold text-slate-900 leading-tight">{w.word}</h4>
                                                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-wide bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{w.pos}</span>
                                                        {w.register && <RegisterBadge register={w.register} />}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 ml-2 flex-none">
                                                    {/* Copy — 44px touch target */}
                                                    <button
                                                        onClick={() => copyToClipboard(w.word, w.meaning)}
                                                        title="Copy word & definition"
                                                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                    >
                                                        {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                    {/* Expand — 44px touch target */}
                                                    <button
                                                        onClick={() => toggleCard(w.word)}
                                                        title={isExpanded ? 'Collapse' : 'Expand details'}
                                                        className="min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    >
                                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    </button>
                                                    {/* Save — 44px touch target */}
                                                    <button
                                                        onClick={() => saveGeneratedWord(w)}
                                                        title="Save to Vault"
                                                        className={`min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${isSaved ? 'text-green-600 bg-green-50' : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                                    >
                                                        {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Meaning + Example (always visible) */}
                                            <div className="px-5 pb-3 space-y-2">
                                                <p className="text-sm text-slate-700 leading-relaxed">{w.meaning}</p>
                                                <div className="pl-3 border-l-2 border-indigo-200 py-1">
                                                    <p className="text-xs text-slate-500 italic">"{w.example}"</p>
                                                </div>
                                            </div>

                                            {/* Collocations preview — collapsed */}
                                            {!isExpanded && w.collocations && w.collocations.length > 0 && (
                                                <div className="px-5 pb-4">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Collocations</p>
                                                    <div className="space-y-1">
                                                        {w.collocations.slice(0, 2).map((c, ci) => (
                                                            <div key={ci} className="flex items-center gap-1.5">
                                                                <span className="w-1 h-1 bg-indigo-300 rounded-full flex-none" />
                                                                <CollocationPhrase phrase={c} word={w.word} />
                                                            </div>
                                                        ))}
                                                        {w.collocations.length > 2 && (
                                                            <button
                                                                onClick={() => toggleCard(w.word)}
                                                                className="text-[10px] text-indigo-400 hover:text-indigo-600 font-medium mt-0.5"
                                                            >
                                                                +{w.collocations.length - 2} more →
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Synonyms/antonyms preview — collapsed */}
                                            {!isExpanded && ((w.synonyms && w.synonyms.length > 0) || (w.antonyms && w.antonyms.length > 0)) && (
                                                <div className="px-5 pb-4 flex flex-wrap gap-1.5">
                                                    {w.synonyms?.slice(0, 2).map(s => (
                                                        <span key={s} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-100">≈ {s}</span>
                                                    ))}
                                                    {w.antonyms?.slice(0, 1).map(a => (
                                                        <span key={a} className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100">≠ {a}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* ——— EXPANDED PANEL ——— */}
                                            {isExpanded && (
                                                <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4 space-y-5 animate-fade-in">

                                                    {/* All collocations */}
                                                    {w.collocations && w.collocations.length > 0 && (
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                                <BookOpen className="w-3 h-3" /> Common Collocations
                                                            </p>
                                                            <div className="space-y-1.5">
                                                                {w.collocations.map((c, ci) => (
                                                                    <div key={ci} className="flex items-start gap-2 bg-white rounded-lg px-3 py-2 border border-slate-100">
                                                                        <span className="w-1 h-1 bg-indigo-400 rounded-full flex-none mt-1.5" />
                                                                        <CollocationPhrase phrase={c} word={w.word} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Synonyms + Antonyms */}
                                                    {((w.synonyms && w.synonyms.length > 0) || (w.antonyms && w.antonyms.length > 0)) && (
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Synonyms & Antonyms</p>
                                                            <div className="flex flex-wrap gap-1.5">
                                                                {w.synonyms?.map(s => (
                                                                    <span key={s} className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100 font-medium">≈ {s}</span>
                                                                ))}
                                                                {w.antonyms?.map(a => (
                                                                    <span key={a} className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-full border border-red-100 font-medium">≠ {a}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Grammar Note */}
                                                    {w.grammarNote && (
                                                        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2.5">
                                                            <Info className="w-4 h-4 text-amber-500 flex-none mt-0.5" />
                                                            <div>
                                                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">Grammar Note</p>
                                                                <p className="text-xs text-amber-800 leading-relaxed">{w.grammarNote}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Word Formation */}
                                                    {w.wordFormation && (
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                                <GitBranch className="w-3 h-3" /> Word Family
                                                            </p>
                                                            <div className="bg-white rounded-lg px-3 py-2.5 border border-slate-100">
                                                                <p className="text-xs text-slate-600 leading-relaxed">{w.wordFormation}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Etymology */}
                                                    {w.etymology && (
                                                        <div>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Origin</p>
                                                            <p className="text-xs text-slate-500 italic leading-relaxed">{w.etymology}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 p-8 text-center">
                            <Library className="w-16 h-16 mb-4 opacity-20" />
                            <h4 className="text-lg font-bold text-slate-600 mb-2">Ready to Generate</h4>
                            <p className="max-w-md">Select your criteria on the left and click "Generate Glossary" to receive a highly customized, advanced vocabulary list.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
