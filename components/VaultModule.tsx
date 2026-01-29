import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { VocabItem, ModuleType, QuizResponse, Question } from '../types';
import { Trash2, BrainCircuit, RefreshCw, BookmarkPlus, ChevronDown, ChevronUp, Sparkles, Book, Search, Filter } from 'lucide-react';
import { generateLingifyContent, enrichWord } from '../services/geminiService';

export const VaultModule: React.FC = () => {
    const [vaultWords, setVaultWords] = useState<VocabItem[]>([]);
    const [filteredWords, setFilteredWords] = useState<VocabItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

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
        setVaultWords(words);
        setFilteredWords(words);
    }, []);

    useEffect(() => {
        setFilteredWords(vaultWords.filter(w => 
            w.word.toLowerCase().includes(searchTerm.toLowerCase()) || 
            w.meaning.toLowerCase().includes(searchTerm.toLowerCase())
        ));
    }, [searchTerm, vaultWords]);

    const removeWord = (word: string) => {
        if(confirm(`Are you sure you want to delete "${word}" from your vault?`)) {
            storageService.removeWord(word);
            setVaultWords(storageService.getWords());
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
        try {
            // Pick up to 10 random words
            const selected = vaultWords.sort(() => 0.5 - Math.random()).slice(0, 10);
            const res = await generateLingifyContent<QuizResponse>(ModuleType.VOCABULARY, {
                wordList: selected.map(w => w.word),
                task: "create_quiz"
            });
            setQuiz(res.questions);
            // Save this "Activity" implicitly by the generator logging mechanism (if we added it there), 
            // or we could explicitly save quiz results here.
        } catch (e) {
            alert("Quiz generation failed.");
        } finally {
            setQuizLoading(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12">
            {/* Header Area */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 font-serif mb-2">My Vault</h2>
                    <p className="text-slate-500">Your personal collection of {vaultWords.length} words.</p>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                     <div className="relative flex-1 md:w-64">
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
                        onClick={generateQuiz}
                        disabled={quizLoading || vaultWords.length < 3}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-200"
                    >
                        {quizLoading ? <RefreshCw className="animate-spin w-5 h-5" /> : <BrainCircuit className="w-5 h-5" />}
                        <span className="hidden md:inline">Generate Quiz</span>
                    </button>
                </div>
            </div>

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
                                onClick={() => setShowQuizResults(true)}
                                className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg"
                            >
                                Check Answers
                            </button>
                            <button onClick={() => setQuiz(null)} className="px-8 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-xl">Cancel</button>
                        </div>
                    ) : (
                        <button onClick={() => setQuiz(null)} className="mt-8 py-4 bg-slate-100 text-slate-600 w-full rounded-xl font-bold hover:bg-slate-200">Close Quiz</button>
                    )}
                </div>
            )}

            {/* Word Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredWords.map((w, i) => {
                    const isExpanded = expandedWord === w.word;
                    return (
                        <div key={i} className={`bg-white p-6 rounded-2xl border transition-all duration-300 ${isExpanded ? 'border-indigo-300 shadow-xl scale-[1.02] z-10' : 'border-slate-100 hover:shadow-lg hover:border-indigo-100'} flex flex-col`}>
                            <div className="flex justify-between items-start mb-3">
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
                                <div className="mt-auto">
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
                                            {w.collocations && (
                                                <div>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Collocations</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {w.collocations.map(c => <span key={c} className="text-[10px] border border-slate-200 px-2 py-0.5 rounded text-slate-600 bg-white">{c}</span>)}
                                                    </div>
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