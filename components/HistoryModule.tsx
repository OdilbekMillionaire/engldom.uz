import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { ActivityLogEntry, ModuleType } from '../types';
import { Clock, BookOpen, PenTool, Headphones, Mic, BookMarked, ChevronDown, ChevronUp, Scale } from 'lucide-react';

export const HistoryModule: React.FC = () => {
    const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const log = storageService.getActivityLog();
        setActivities(log.sort((a, b) => b.date - a.date));
    }, []);

    const getModuleIcon = (module: ModuleType) => {
        switch(module) {
            case ModuleType.READING: return <BookOpen className="w-5 h-5 text-emerald-500" />;
            case ModuleType.WRITING: return <PenTool className="w-5 h-5 text-indigo-500" />;
            case ModuleType.LISTENING: return <Headphones className="w-5 h-5 text-purple-500" />;
            case ModuleType.SPEAKING: return <Mic className="w-5 h-5 text-orange-500" />;
            case ModuleType.VOCABULARY: return <BookMarked className="w-5 h-5 text-pink-500" />;
            case ModuleType.GRAMMAR: return <Scale className="w-5 h-5 text-blue-500" />;
            default: return <Clock className="w-5 h-5 text-slate-400" />;
        }
    };

    const getSummary = (item: ActivityLogEntry) => {
        if (!item.data) return "No data";
        
        switch(item.module) {
            case ModuleType.READING: return item.data.title || "Reading Practice";
            case ModuleType.WRITING: return `Task: ${item.data.cefr_level || 'N/A'} - Band ${item.data.band_score || '?'}`;
            case ModuleType.LISTENING: return item.data.title || "Listening Practice";
            case ModuleType.SPEAKING: {
                if (item.data.type === 'lesson') return 'Topic Generation';
                const scores = Object.values(item.data.scores || {}) as number[];
                const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                return `Evaluation (Band ${avg.toFixed(1)})`;
            }
            case ModuleType.VOCABULARY: return item.data.topic ? `Glossary: ${item.data.topic}` : "Vocabulary Quiz";
            case ModuleType.GRAMMAR: return `Grammar: ${item.data.topic}`;
            default: return "Activity";
        }
    };

    const renderDetails = (item: ActivityLogEntry) => {
        // Simplified JSON view for now, could be elaborated per module
        return (
            <div className="bg-slate-900 text-slate-300 p-4 rounded-xl text-xs font-mono overflow-x-auto">
                <pre>{JSON.stringify(item.data, null, 2)}</pre>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-12 animate-fade-in">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                 <h2 className="text-3xl font-bold text-slate-800 font-serif mb-2">History Log</h2>
                 <p className="text-slate-500">A timeline of your generated content and practice sessions.</p>
             </div>

             <div className="space-y-4">
                 {activities.map((item) => {
                     const isExpanded = expandedId === item.id;
                     return (
                         <div key={item.id} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                             <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : item.id)}>
                                 <div className="flex items-center gap-4">
                                     <div className="p-3 bg-slate-50 rounded-full border border-slate-100">
                                         {getModuleIcon(item.module)}
                                     </div>
                                     <div>
                                         <h3 className="font-bold text-slate-800">{getSummary(item)}</h3>
                                         <p className="text-xs text-slate-400">{new Date(item.date).toLocaleString()} • {item.module.toUpperCase()}</p>
                                     </div>
                                 </div>
                                 <button className="text-slate-400">
                                     {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                 </button>
                             </div>
                             
                             {isExpanded && (
                                 <div className="mt-6 border-t border-slate-100 pt-6 animate-fade-in">
                                     <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Raw Data Snapshot</h4>
                                     {renderDetails(item)}
                                 </div>
                             )}
                         </div>
                     );
                 })}
                 
                 {activities.length === 0 && (
                     <div className="text-center py-24 text-slate-400">
                         <Clock className="w-16 h-16 mx-auto mb-4 opacity-20" />
                         <p>No activity recorded yet.</p>
                     </div>
                 )}
             </div>
        </div>
    );
};