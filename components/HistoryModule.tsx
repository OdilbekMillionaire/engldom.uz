import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { ActivityLogEntry, ModuleType } from '../types';
import {
    Clock, BookOpen, PenTool, Headphones, Mic, BookMarked,
    ChevronDown, ChevronUp, Scale, ArrowRight, ExternalLink,
    CheckCircle2, AlertCircle, FileText
} from 'lucide-react';

interface HistoryModuleProps {
    onRestore: (module: ModuleType, data: any) => void;
}

export const HistoryModule: React.FC<HistoryModuleProps> = ({ onRestore }) => {
    const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const log = storageService.getActivityLog();
        setActivities(log.sort((a, b) => b.date - a.date));
    }, []);

    const getModuleIcon = (module: ModuleType) => {
        switch (module) {
            case ModuleType.READING: return <BookOpen className="w-5 h-5 text-emerald-500" />;
            case ModuleType.WRITING: return <PenTool className="w-5 h-5 text-indigo-500" />;
            case ModuleType.LISTENING: return <Headphones className="w-5 h-5 text-purple-500" />;
            case ModuleType.SPEAKING: return <Mic className="w-5 h-5 text-orange-500" />;
            case ModuleType.VOCABULARY: return <BookMarked className="w-5 h-5 text-pink-500" />;
            case ModuleType.GRAMMAR: return <Scale className="w-5 h-5 text-blue-500" />;
            default: return <Clock className="w-5 h-5 text-t-4" />;
        }
    };

    const getSummary = (item: ActivityLogEntry) => {
        if (!item.data) return "No data";

        switch (item.module) {
            case ModuleType.READING: return item.data.title || "Reading Practice";
            case ModuleType.WRITING: return `Writing: ${item.data.cefr_level || 'General'} Task (Band ${item.data.band_score || '?'})`;
            case ModuleType.LISTENING: return item.data.title || "Listening Practice";
            case ModuleType.SPEAKING: {
                if (item.data.type === 'lesson') return 'Speaking: Lesson Topics';
                const scores = Object.values(item.data.scores || {}) as number[];
                const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                return `Speaking: Evaluation (Band ${avg.toFixed(1)})`;
            }
            case ModuleType.VOCABULARY: return item.data.topic ? `Glossary: ${item.data.topic}` : "Vocabulary Quiz";
            case ModuleType.GRAMMAR: return `Grammar: ${item.data.topic}`;
            default: return "Activity";
        }
    };

    const renderPreview = (item: ActivityLogEntry) => {
        const { data, module } = item;

        if (!data) return <div className="text-t-4 italic">No details available.</div>;

        return (
            <div className="bg-background rounded-xl p-6 border border-sub-border space-y-4">
                {/* Content Specific Previews */}

                {module === ModuleType.READING && (
                    <div className="space-y-3">
                        <div className="flex gap-2 mb-2">
                            {data.newWords?.slice(0, 3).map((w: any, i: number) => (
                                <span key={i} className="text-xs bg-surface border border-base-border px-2 py-1 rounded text-t-2 font-medium">
                                    {w.word}
                                </span>
                            ))}
                            {data.newWords?.length > 3 && <span className="text-xs text-t-4 py-1">+{data.newWords.length - 3} more</span>}
                        </div>
                        <p className="text-sm text-t-2 line-clamp-3 italic border-l-2 border-emerald-200 pl-3">
                            "{data.article?.substring(0, 200)}..."
                        </p>
                    </div>
                )}

                {module === ModuleType.WRITING && (
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-surface p-4 rounded-lg border border-base-border">
                            <h5 className="text-xs font-bold text-t-4 uppercase mb-1">Examiner Feedback</h5>
                            <p className="text-sm text-t-2 line-clamp-3">{data.overall_feedback}</p>
                        </div>
                        <div className="bg-surface p-4 rounded-lg border border-base-border">
                            <h5 className="text-xs font-bold text-t-4 uppercase mb-1">Score Breakdown</h5>
                            <div className="flex gap-2">
                                <span className="text-2xl font-bold text-indigo-600">{data.band_score}</span>
                                <div className="text-xs text-t-3 flex flex-col justify-center">
                                    <span>Band Score</span>
                                    <span>CEFR {data.cefr_level}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {module === ModuleType.GRAMMAR && (
                    <div className="bg-surface p-4 rounded-lg border border-base-border">
                        <h5 className="text-xs font-bold text-t-4 uppercase mb-2">Core Rule</h5>
                        <p className="text-sm font-bold text-t-1 mb-2">{data.lessonContent?.coreRule}</p>
                        <p className="text-sm text-t-2">{data.lessonContent?.detailedExplanation?.substring(0, 150)}...</p>
                    </div>
                )}

                {module === ModuleType.LISTENING && (
                    <div className="space-y-3">
                        <p className="text-sm text-t-3">Audio script generated with {data.newWords?.length} vocabulary terms.</p>
                        <div className="bg-surface p-3 rounded border border-base-border text-xs text-t-2 font-mono">
                            {data.audio_script?.substring(0, 120)}...
                        </div>
                    </div>
                )}

                {module === ModuleType.VOCABULARY && data.words && (
                    <div className="flex flex-wrap gap-2">
                        {data.words.map((w: any, i: number) => (
                            <div key={i} className="bg-surface px-3 py-2 rounded border border-base-border shadow-sm flex flex-col">
                                <span className="font-bold text-xs text-t-1">{w.word}</span>
                                <span className="text-[10px] text-t-3">{w.meaning.substring(0, 30)}...</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Restore Button */}
                <div className="flex justify-end pt-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent toggling accordion
                            onRestore(module, data);
                        }}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg shadow-slate-900/10"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Open Session
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-12 animate-fade-in">
            <div className="bg-surface p-6 rounded-2xl shadow-sm border border-sub-border mb-6">
                <h2 className="text-3xl font-bold text-t-1 font-serif mb-2">History Log</h2>
                <p className="text-t-3">A timeline of your generated content and practice sessions.</p>
            </div>

            <div className="space-y-4">
                {activities.map((item) => {
                    const isExpanded = expandedId === item.id;
                    return (
                        <div key={item.id} className={`bg-surface rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-indigo-200 shadow-md ring-1 ring-indigo-50' : 'border-sub-border shadow-sm hover:shadow-md'}`}>
                            <div
                                className="flex items-center justify-between p-6 cursor-pointer"
                                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full border transition-colors ${isExpanded ? 'bg-indigo-50 border-indigo-100' : 'bg-background border-sub-border'}`}>
                                        {getModuleIcon(item.module)}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold transition-colors ${isExpanded ? 'text-indigo-900' : 'text-t-1'}`}>{getSummary(item)}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-t-4 font-medium">{new Date(item.date).toLocaleString()}</span>
                                            <span className="text-[10px] bg-surface-2 text-t-3 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{item.module}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-indigo-500' : 'text-t-4'}`}>
                                    <ChevronDown className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Expanded Content */}
                            <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden px-6 pb-6">
                                    {renderPreview(item)}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {activities.length === 0 && (
                    <div className="text-center py-24 text-t-4 bg-surface rounded-2xl border border-dashed border-base-border">
                        <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="font-medium">No activity recorded yet.</p>
                        <p className="text-sm mt-2 opacity-70">Generate some content to see it here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};