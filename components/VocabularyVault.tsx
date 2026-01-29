import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { VocabItem, ModuleType, QuizResponse, Question } from '../types';
import { Trash2, BrainCircuit, RefreshCw, BookmarkPlus, ChevronDown, ChevronUp, Sparkles, Book, Search, Filter, Clock, Calendar, Check, AlertCircle } from 'lucide-react';
import { generateLingifyContent, enrichWord } from '../services/geminiService';

const SRS_INTERVALS = [1, 3, 7, 14, 30]; // Days

export const VocabularyVault: React.FC = () => {
    const [vaultWords, setVaultWords] = useState<VocabItem[]>([]);
    const [filteredWords, setFilteredWords] = useState<VocabItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDue, setFilterDue] = useState(false);

    // Quiz Config
    const [quizSize, setQuizSize] = useState(5);
    const [quizPosFilter, setQuizPosFilter] = useState<string>('all');
    const [isConfiguring, setIsConfiguring] = useState(false);

    // Quiz State
    const [quiz, setQuiz] = useState<Question[] | null>(null);
    const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
    const [showQuizResults, setShowQuizResults] = useState(false);
    const [quizLoading, setQuizLoading] = useState(false);

    // Item State
    const [expandedWord, setExpandedWord] = useState<string | null>(null);
    const [enriching, setEnriching] = useState(false);

    useEffect(() => {
        const words = storageService.getWords();
        // Initialize SRS if new
        const initialized = words.map(w => ({
            ...w,
            srsLevel: w.srsLevel ?? 0,
            nextReview: w.nextReview ?? Date.now()
        }));
        setVaultWords(initialized);
    }, []);

    useEffect(() => {
        let result = vaultWords;
        
        if (searchTerm) {
            result = result.filter(w => 
                w.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
                w.meaning.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (filterDue) {
            const now = Date.now();
            result = result.filter(w => (w.nextReview || 0) <= now);
        }

        setFilteredWords(result);
    }, [searchTerm, vaultWords, filterDue]);

    const removeWord = (word: string) => {
        if(confirm(`Are you sure you want to delete "${word}" from your vault?`)) {
            storageService.removeWord(word);
            setVaultWords(prev => prev.filter(w => w.word !== word));
        }
    };

    const toggleExpandVaultWord = async (wordItem: VocabItem) => {
        if (expandedWord === wordItem.word) {
            setExpandedWord(null);
            return;
        }
        setExpandedWord(wordItem.word);
        if (!wordItem.etymology || !wordItem.detailedDefinition) {
            setEnriching(true);
            try {
                const enrichedData = await enrichWord(wordItem.word);
                const updatedItem = { ...wordItem, ...enrichedData };
                storageService.updateWord(updatedItem);
                setVaultWords(storageService.getWords());
            } catch (e) {
                console.error("Enrichment failed", e);
            } finally {
                setEnriching(false);
            }
        }
    };

    const generateQuiz = async () => {
        if (vaultWords.length < 3) {
            alert("Save at least 3 words to generate a quiz.");
            return;
        }
        setQuizLoading(true);
        setQuiz(null);
        setQuizAnswers({});
        setShowQuizResults(false);
        setIsConfiguring(false);

        try {
            // Select words based on criteria
            let candidates = vaultWords;
            
            // 1. Filter by POS
            if (quizPosFilter !== 'all') {
                candidates = candidates.filter(w => w.pos.toLowerCase().includes(quizPosFilter.toLowerCase()));
            }

            // 2. Prioritize Due Words (SRS Filter)
            const dueWords = candidates.filter(w => (w.nextReview || 0) <= Date.now());
            const notDueWords = candidates.filter(w => (w.nextReview || 0) > Date.now());
            
            // Combine: Due words first, then fill with random
            let selected = [...dueWords.sort(() => 0.5 - Math.random())];
            if (selected.length < quizSize) {
                const needed = quizSize - selected.length;
                selected = [...selected, ...notDueWords.sort(() => 0.5 - Math.random()).slice(0, needed)];
            } else {
                selected = selected.slice(0, quizSize);
            }

            if (selected.length === 0) {
                alert("No words match your criteria. Try adjusting filters.");
                setQuizLoading(false);
                return;
            }

            const res = await generateLingifyContent<QuizResponse>(ModuleType.VOCABULARY, {
                wordList: selected.map(w => w.word),
                task: "create_quiz"
            });
            setQuiz(res.questions);
        } catch (e) {
            alert("Quiz generation failed.");
        } finally {
            setQuizLoading(false);
        }
    };

    const handleQuizSubmit = () => {
        setShowQuizResults(true);
        
        // SRS Logic Update
        const updatedVault = [...vaultWords];
        const now = Date.now();

        quiz?.forEach(q => {
            const isCorrect = quizAnswers[q.id] === q.answer;
            // Find word associated with question
            const targetWord = updatedVault.find(w => q.prompt.includes(w.word) || q.options?.some(o => o.includes(w.word)) || q.answer.includes(w.word));
            
            if (targetWord) {
                if (isCorrect) {
                    // Level Up
                    const currentLevel = targetWord.srsLevel || 0;
                    const nextLevel = Math.min(currentLevel + 1, SRS_INTERVALS.length - 1);
                    const days = SRS_INTERVALS[nextLevel];
                    targetWord.srsLevel = nextLevel;
                    targetWord.nextReview = now + (days * 24 * 60 * 60 * 1000);
                } else {
                    // Reset on Failure
                    targetWord.srsLevel = 0;
                    targetWord.nextReview = now + (24 * 60 * 60 * 1000); // Review tomorrow
                }
                storageService.updateWord(targetWord);
            }
        });
        setVaultWords(storageService.getWords()); // Refresh state
    };

    const getUniquePOS = () => {
        const s = new Set(vaultWords.map(w => w.pos));
        return Array.from(s);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header Area */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 font-serif mb-2">My Vault</h2>
                    <p className="text-slate-500">Your personal collection of {vaultWords.length} words.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                     <div className="relative flex-1 sm:w-64">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                         <input 
                            type="text" 
                            placeholder="Search words..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                         />
                     </div>
                     <button
                        onClick={() => setIsConfiguring(!isConfiguring)}
                        disabled={quizLoading || vaultWords.length < 3}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                    >
                        {quizLoading ? <RefreshCw className="animate-spin w-5 h-5" /> : <BrainCircuit className="w-5 h-5" />}
                        <span className="hidden md:inline">Quiz Me</span>
                    </button>
                </div>
            </div>

            {/* Config Panel */}
            {isConfiguring && !quiz && (
                <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-lg animate-fade-in max-w-2xl mx-auto">
                    <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-500" />
                        Smart Quiz Configuration
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Number of Questions</label>
                            <input 
                                type="range" min="3" max="20" 
                                value={quizSize} 
                                onChange={(e) => setQuizSize(Number(e.target.value))}
                                className="w-full accent-indigo-600" 
                            />
                            <div className="text-center font-bold text-indigo-600 mt-1">{quizSize} Questions</div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Word Type (POS)</label>
                            <select 
                                value={quizPosFilter} 
                                onChange={(e) => setQuizPosFilter(e.target.value)}
                                className="w-full p-2 border rounded-lg text-sm bg-slate-50 outline-none"
                            >
                                <option value="all">All Types</option>
                                {getUniquePOS().map(pos => <option key={pos} value={pos}>{pos}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* SRS Info */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 mb-6 flex items-start gap-3">
                        <Clock className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-orange-800 mb-1">Spaced Repetition System (SRS) Active</h4>
                            <p className="text-xs text-orange-700">Questions are prioritized based on your review schedule. Correct answers increase the interval; incorrect answers reset it.</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={generateQuiz} 
                            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700"
                        >
                            Start Quiz
                        </button>
                        <button 
                            onClick={() => setIsConfiguring(false)} 
                            className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Quiz Overlay */}
            {quiz && (
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-indigo-100 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                             <h3 className="text-xl font-bold text-indigo-900">Pop Quiz</h3>
                             <p className="text-sm text-slate-500">Testing your knowledge of saved words.</p>
                        </div>
                        {showQuizResults && (
                            <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-lg font-bold">
                                Score: {quiz.filter(q => quizAnswers[q.id] === q.answer).length} / {quiz.length}
                            </span>
                        )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        {quiz.map((q, i) => (
                            <div key={q.id} className="pb-6 border-b border-slate-100 last:border-0">
                                <p className="font-bold text-slate-800 mb-4 text-base flex gap-2">
                                    <span className="text-slate-400">{i+1}.</span>
                                    {q.prompt}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    {q.options?.map((opt) => {
                                        let cls = "text-left px-4 py-3 rounded-xl border text-sm transition-all font-medium ";
                                        if (showQuizResults) {
                                            if (opt === q.answer) cls += "bg-green-100 border-green-500 text-green-900";
                                            else if (quizAnswers[q.id] === opt) cls += "bg-red-50 border-red-300 text-red-900";
                                            else cls += "opacity-50 border-slate-100";
                                        } else {
                                            cls += quizAnswers[q.id] === opt ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600";
                                        }
                                        return (
                                            <button 
                                                key={opt} 
                                                disabled={showQuizResults}
                                                onClick={() => setQuizAnswers({...quizAnswers, [q.id]: opt})}
                                                className={cls}
                                            >
                                                {opt}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    {!showQuizResults ? (
                        <div className="mt-8 flex gap-4">
                            <button 
                                onClick={handleQuizSubmit}
                                className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg"
                            >
                                Check Answers
                            </button>
                            <button onClick={() => setQuiz(null)} className="px-8 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancel</button>
                        </div>
                    ) : (
                        <div className="mt-8">
                            <p className="text-center text-sm text-slate-500 mb-4">Your spaced repetition schedule has been updated based on these results.</p>
                            <button onClick={() => setQuiz(null)} className="py-4 bg-slate-100 text-slate-600 w-full rounded-xl font-bold hover:bg-slate-200">Close Quiz</button>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button 
                    onClick={() => setFilterDue(!filterDue)} 
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${filterDue ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                    <Clock className="w-4 h-4" />
                    Review Due Only
                </button>
            </div>

            {/* Word Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredWords.map((w, i) => {
                    const isExpanded = expandedWord === w.word;
                    const isDue = (w.nextReview || 0) <= Date.now();
                    const srsLevel = w.srsLevel || 0;
                    
                    return (
                        <div key={i} className={`bg-white p-6 rounded-2xl border transition-all duration-300 ${isExpanded ? 'border-indigo-300 shadow-xl scale-[1.02] z-10' : 'border-slate-100 hover:shadow-lg hover:border-indigo-100'} flex flex-col relative overflow-hidden`}>
                            {/* SRS Indicator Badge */}
                            <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold tracking-wider ${isDue ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                                {isDue ? 'DUE' : `LVL ${srsLevel}`}
                            </div>
                            
                            <div className="flex justify-between items-start mb-3 pt-4">
                                <div>
                                    <h3 className="font-serif font-bold text-xl text-slate-900">{w.word}</h3>
                                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider mt-1 inline-block">{w.pos}</span>
                                </div>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => toggleExpandVaultWord(w)}
                                        className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                    >
                                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </button>
                                    <button 
                                        onClick={() => removeWord(w.word)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            <p className="text-sm text-slate-600 mb-4 font-medium leading-relaxed">{w.meaning}</p>
                            
                            {!isExpanded && (
                                <div className="mt-auto flex justify-between items-center">
                                    <div className="flex flex-wrap gap-2">
                                        {w.synonyms && w.synonyms.slice(0,2).map(s => <span key={s} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-1 rounded border border-slate-100">{s}</span>)}
                                    </div>
                                </div>
                            )}

                            {isExpanded && (
                                <div className="pt-4 border-t border-slate-100 animate-fade-in space-y-4">
                                    <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-600 italic border border-slate-100">"{w.example}"</div>
                                    
                                    {enriching && !w.etymology ? (
                                        <div className="flex items-center gap-2 text-indigo-500 text-xs font-medium py-2">
                                            <Sparkles className="w-4 h-4 animate-spin" />
                                            Enriching word data...
                                        </div>
                                    ) : (
                                        <>
                                            {w.detailedDefinition && (
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Academic Definition</span>
                                                    <p className="text-sm text-slate-700 leading-relaxed">{w.detailedDefinition}</p>
                                                </div>
                                            )}
                                            {w.etymology && (
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Origin</span>
                                                    <div className="flex items-start gap-2">
                                                        <Book className="w-3 h-3 text-slate-400 mt-1" />
                                                        <p className="text-xs text-slate-600 italic">{w.etymology}</p>
                                                    </div>
                                                </div>
                                            )}
                                            {w.nextReview && (
                                                 <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                                    <span className="text-[10px] text-slate-400">Next Review:</span>
                                                    <span className={`text-xs font-bold ${isDue ? 'text-orange-600' : 'text-slate-600'}`}>
                                                        {new Date(w.nextReview).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                {filteredWords.length === 0 && (
                    <div className="col-span-full py-24 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        <BookmarkPlus className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <h4 className="font-bold text-slate-600 text-lg">No words found</h4>
                        <p className="text-sm">Try changing your search or generate new words.</p>
                    </div>
                )}
            </div>
        </div>
    );
};