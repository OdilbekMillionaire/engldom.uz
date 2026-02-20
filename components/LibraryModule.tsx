
import React, { useState } from 'react';
import { STATIC_READING, STATIC_GRAMMAR, STATIC_VOCAB, STATIC_LISTENING, STATIC_RESOURCE_PACKS, StaticArticle, StaticGrammar, StaticVocabList, StaticListening } from '../src/data/staticContent';
import { BookOpen, Headphones, Scale, BookMarked, ArrowRight, Clock, Play, Pause, FileText, BookmarkPlus, CheckCircle2, Download, File, FileCode, Package, FolderOpen, ExternalLink, Music, Archive } from 'lucide-react';
import { storageService } from '../services/storageService';
import { VocabItem } from '../types';

export const LibraryModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'reading' | 'grammar' | 'vocab' | 'listening' | 'resources'>('reading');
    const [selectedArticle, setSelectedArticle] = useState<StaticArticle | null>(null);
    const [selectedGrammar, setSelectedGrammar] = useState<StaticGrammar | null>(null);
    const [selectedVocab, setSelectedVocab] = useState<StaticVocabList | null>(null);
    
    // Simple Audio State
    const [playingAudio, setPlayingAudio] = useState<string | null>(null); // ID of track
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    const handleSaveWord = (word: VocabItem) => {
        storageService.saveWord(word);
        alert(`Saved "${word.word}" to Vault!`);
    };

    const handlePlay = (track: StaticListening) => {
        if (playingAudio === track.id) {
            audioRef.current?.pause();
            setPlayingAudio(null);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
            }
            // In a real app, this would point to the public folder
            const audio = new Audio(track.audioSrc);
            audio.onerror = () => {
                alert(`Audio file not found at ${track.audioSrc}. For this demo, please add an MP3 file to the public/audio folder with this name.`);
                setPlayingAudio(null);
            };
            audio.play().then(() => setPlayingAudio(track.id)).catch(e => console.log(e));
            audio.onended = () => setPlayingAudio(null);
            audioRef.current = audio;
        }
    };

    return (
        <div className="space-y-6 pb-12 animate-fade-in">
            {/* Header */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 font-serif mb-2">Study Center</h2>
                    <p className="text-slate-500">Access our curated library of high-quality learning materials.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
                    {[
                        { id: 'reading', icon: BookOpen, label: 'Reading' },
                        { id: 'grammar', icon: Scale, label: 'Grammar' },
                        { id: 'vocab', icon: BookMarked, label: 'Vocab' },
                        { id: 'listening', icon: Headphones, label: 'Listening' },
                        { id: 'resources', icon: Download, label: 'Downloads' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as any);
                                setSelectedArticle(null);
                                setSelectedGrammar(null);
                                setSelectedVocab(null);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- READING TAB --- */}
            {activeTab === 'reading' && (
                selectedArticle ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
                            <div>
                                <button onClick={() => setSelectedArticle(null)} className="text-xs font-bold text-slate-500 hover:text-indigo-600 mb-4 flex items-center gap-1">
                                    <ArrowRight className="w-3 h-3 rotate-180" /> Back to Library
                                </button>
                                <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">
                                    {selectedArticle.category} • {selectedArticle.level}
                                </span>
                                <h2 className="text-3xl font-serif font-bold text-slate-900">{selectedArticle.title}</h2>
                            </div>
                        </div>
                        <div className="grid lg:grid-cols-12">
                            <div className="lg:col-span-8 p-8 lg:p-12 lg:border-r border-slate-100">
                                <article className="prose prose-lg prose-slate max-w-none font-serif leading-loose">
                                    {selectedArticle.content.split('\n\n').map((para, i) => (
                                        <p key={i}>{para}</p>
                                    ))}
                                </article>
                            </div>
                            <div className="lg:col-span-4 p-8 bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <BookMarked className="w-5 h-5 text-indigo-600" /> Key Vocabulary
                                </h3>
                                <div className="space-y-4">
                                    {selectedArticle.words.map((w, i) => (
                                        <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-indigo-900">{w.word}</span>
                                                <button onClick={() => handleSaveWord(w)} className="text-slate-300 hover:text-indigo-600">
                                                    <BookmarkPlus className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{w.meaning}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {STATIC_READING.map(art => (
                            <div key={art.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all group cursor-pointer" onClick={() => setSelectedArticle(art)}>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">{art.category}</span>
                                    <span className="text-xs font-bold text-slate-400">{art.level}</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-indigo-700 transition-colors">{art.title}</h3>
                                <p className="text-sm text-slate-500 line-clamp-2 mb-4">{art.summary}</p>
                                <div className="flex items-center text-sm font-bold text-indigo-600 gap-1">
                                    Read Article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* --- GRAMMAR TAB --- */}
            {activeTab === 'grammar' && (
                selectedGrammar ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="bg-slate-900 text-white p-8">
                            <button onClick={() => setSelectedGrammar(null)} className="text-xs font-bold text-slate-400 hover:text-white mb-6 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3 rotate-180" /> Back to Topics
                            </button>
                            <h2 className="text-3xl font-bold mb-2">{selectedGrammar.title}</h2>
                            <p className="text-indigo-200">{selectedGrammar.summary}</p>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                                <h3 className="font-bold text-indigo-900 uppercase text-xs tracking-wider mb-2">The Rule</h3>
                                <p className="text-lg font-medium text-slate-800">{selectedGrammar.content.rule}</p>
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="font-bold text-slate-800">Examples</h3>
                                {selectedGrammar.content.examples.map((ex, i) => (
                                    <div key={i} className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase mb-1">
                                                <CheckCircle2 className="w-3 h-3" /> Correct
                                            </div>
                                            <p className="text-slate-800 font-medium">{ex.correct}</p>
                                        </div>
                                        <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                            <div className="flex items-center gap-2 text-red-700 font-bold text-xs uppercase mb-1">
                                                <span className="w-3 h-3 flex items-center justify-center font-bold">×</span> Incorrect
                                            </div>
                                            <p className="text-slate-800 font-medium line-through decoration-red-300">{ex.incorrect}</p>
                                        </div>
                                        <div className="md:col-span-2 text-sm text-slate-500 italic bg-slate-50 p-3 rounded-lg">
                                            Note: {ex.explanation}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                         {STATIC_GRAMMAR.map(g => (
                             <div key={g.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer group" onClick={() => setSelectedGrammar(g)}>
                                 <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 text-indigo-600">
                                     <Scale className="w-6 h-6" />
                                 </div>
                                 <h3 className="text-xl font-bold text-slate-800 mb-2">{g.title}</h3>
                                 <p className="text-sm text-slate-500">{g.summary}</p>
                             </div>
                         ))}
                    </div>
                )
            )}

            {/* --- VOCAB TAB --- */}
            {activeTab === 'vocab' && (
                selectedVocab ? (
                     <div className="space-y-6">
                        <button onClick={() => setSelectedVocab(null)} className="text-sm font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 rotate-180" /> Back to Lists
                        </button>
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                             <h2 className="text-2xl font-bold text-slate-800 mb-6">{selectedVocab.topic} <span className="text-sm font-normal text-slate-400 ml-2">({selectedVocab.level})</span></h2>
                             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                 {selectedVocab.words.map((w, i) => (
                                     <div key={i} className="p-4 rounded-xl bg-slate-50 hover:bg-white hover:shadow-md transition-all border border-slate-100 group">
                                         <div className="flex justify-between items-start mb-2">
                                             <span className="font-bold text-slate-800 text-lg">{w.word}</span>
                                             <button onClick={() => handleSaveWord(w)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-indigo-600 transition-opacity">
                                                 <BookmarkPlus className="w-4 h-4" />
                                             </button>
                                         </div>
                                         <span className="text-[10px] uppercase font-bold text-indigo-500 mb-2 block">{w.pos}</span>
                                         <p className="text-sm text-slate-600 leading-snug">{w.meaning}</p>
                                     </div>
                                 ))}
                             </div>
                        </div>
                     </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6">
                        {STATIC_VOCAB.map(v => (
                            <div key={v.id} className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all cursor-pointer" onClick={() => setSelectedVocab(v)}>
                                <div className="flex justify-between items-start mb-4">
                                     <BookMarked className="w-8 h-8 text-pink-500" />
                                     <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{v.level}</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">{v.topic}</h3>
                                <p className="text-sm text-slate-500">{v.words.length} Words</p>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* --- LISTENING TAB --- */}
            {activeTab === 'listening' && (
                <div className="space-y-6">
                    {STATIC_LISTENING.map(track => (
                        <div key={track.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                            <button 
                                onClick={() => handlePlay(track)}
                                className={`w-16 h-16 rounded-full flex items-center justify-center flex-none transition-all ${playingAudio === track.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
                            >
                                {playingAudio === track.id ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                            </button>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="font-bold text-lg text-slate-800">{track.title}</h3>
                                <div className="flex items-center justify-center md:justify-start gap-4 mt-1 text-sm text-slate-500">
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {track.duration}</span>
                                    <span className="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold">{track.level}</span>
                                </div>
                            </div>
                            <div className="w-full md:w-auto p-4 bg-slate-50 rounded-xl text-xs text-slate-500 font-mono border border-slate-100 max-w-md">
                                <p className="mb-2 font-bold text-slate-400 uppercase">Script Preview</p>
                                {track.script.substring(0, 100)}...
                            </div>
                        </div>
                    ))}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-700 flex items-start gap-3">
                         <FileText className="w-5 h-5 flex-shrink-0" />
                         <p>
                             <strong>Note for Administrator:</strong> To make audio play, upload MP3 files to your public folder and update the <code>audioSrc</code> in <code>src/data/staticContent.ts</code>.
                         </p>
                    </div>
                </div>
            )}

            {/* --- RESOURCES TAB (BOOKS & DOWNLOADS) --- */}
            {activeTab === 'resources' && (
                <div className="space-y-8">
                    
                    {/* 1. RESOURCE PACKS (Book + Audio Split) */}
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-indigo-600" /> Course Materials
                        </h3>
                        <div className="space-y-6">
                            {STATIC_RESOURCE_PACKS.map(pack => (
                                <div key={pack.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow">
                                    
                                    {/* Cover Side */}
                                    <div className={`md:w-64 p-8 flex flex-col justify-between text-white ${pack.coverColor} relative overflow-hidden`}>
                                        <div className="absolute top-[-20%] right-[-20%] p-4 opacity-10">
                                            <BookOpen className="w-48 h-48" />
                                        </div>
                                        <div className="relative z-10">
                                            <span className="inline-block bg-black/20 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider mb-3 backdrop-blur-sm border border-white/10">{pack.category}</span>
                                            <h3 className="font-serif font-bold text-xl leading-snug">{pack.title}</h3>
                                        </div>
                                        <p className="relative z-10 text-xs text-white/80 mt-4 leading-relaxed font-medium">{pack.description}</p>
                                    </div>

                                    {/* Items Side */}
                                    <div className="flex-1 p-6 md:p-8 flex flex-col justify-center">
                                        <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-4">Available Downloads</h4>
                                        <div className="grid gap-3">
                                            {pack.items.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2 rounded-lg ${
                                                            item.type === 'pdf' ? 'bg-red-100 text-red-600' :
                                                            item.type === 'audio' ? 'bg-purple-100 text-purple-600' :
                                                            'bg-orange-100 text-orange-600'
                                                        }`}>
                                                            {item.type === 'pdf' ? <FileText className="w-5 h-5" /> : 
                                                             item.type === 'audio' ? <Music className="w-5 h-5" /> :
                                                             <Archive className="w-5 h-5" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-700 text-sm">{item.label}</div>
                                                            <div className="text-xs text-slate-400">{item.size}</div>
                                                        </div>
                                                    </div>
                                                    <a 
                                                        href={item.url} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center gap-2"
                                                    >
                                                        <Download className="w-3 h-3" /> Download
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-sm text-indigo-800 flex items-start gap-3">
                         <FileCode className="w-5 h-5 flex-shrink-0" />
                         <p>
                             <strong>Admin Note:</strong> Use Google Drive's "Get Shareable Link" for each specific file and paste it into the <code>STATIC_RESOURCE_PACKS</code> array in <code>src/data/staticContent.ts</code>.
                         </p>
                    </div>
                </div>
            )}
        </div>
    );
};
