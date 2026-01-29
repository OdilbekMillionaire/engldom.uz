import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { ProgressEntry, ModuleType } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Award, Clock } from 'lucide-react';

export const Dashboard: React.FC = () => {
    const [history, setHistory] = useState<ProgressEntry[]>([]);

    useEffect(() => {
        const data = storageService.getProgress();
        // Sort by date ascending for charts
        setHistory(data.sort((a, b) => a.date - b.date));
    }, []);

    // Filter data for charts
    const writingData = history.filter(h => h.module === ModuleType.WRITING).map(h => ({
        date: new Date(h.date).toLocaleDateString(),
        score: h.score,
        label: h.label
    }));

    const readingData = history.filter(h => h.module === ModuleType.READING).map(h => ({
        date: new Date(h.date).toLocaleDateString(),
        percentage: Math.round((h.score / h.maxScore) * 100),
        label: h.label
    }));

    return (
        <div className="space-y-6 animate-fade-in">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Progress Dashboard</h2>
                <p className="text-slate-500">Track your improvements over time.</p>
             </div>

             <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg">
                    <TrendingUp className="w-8 h-8 mb-4 opacity-80" />
                    <h3 className="text-3xl font-bold">{history.length}</h3>
                    <p className="opacity-80 font-medium">Total Exercises Completed</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100">
                    <Award className="w-8 h-8 mb-4 text-emerald-500" />
                    <h3 className="text-3xl font-bold text-slate-800">
                        {writingData.length > 0 ? (writingData.reduce((acc, curr) => acc + curr.score, 0) / writingData.length).toFixed(1) : '-'}
                    </h3>
                    <p className="text-slate-500 font-medium">Average Writing Band</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-100">
                    <Clock className="w-8 h-8 mb-4 text-orange-500" />
                    <h3 className="text-3xl font-bold text-slate-800">
                        {history.length > 0 ? new Date(history[history.length-1].date).toLocaleDateString() : '-'}
                    </h3>
                    <p className="text-slate-500 font-medium">Last Active</p>
                </div>
             </div>

             <div className="grid lg:grid-cols-2 gap-6">
                 {/* Writing Chart */}
                 <div className="bg-white p-6 rounded-xl border border-slate-100 h-80">
                     <h3 className="font-bold text-slate-800 mb-4">Writing Band Progression</h3>
                     {writingData.length > 1 ? (
                         <ResponsiveContainer width="100%" height="100%">
                             <LineChart data={writingData}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                 <XAxis dataKey="date" tick={{fontSize: 12}} />
                                 <YAxis domain={[0, 9]} tickCount={10} />
                                 <Tooltip />
                                 <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 8 }} />
                             </LineChart>
                         </ResponsiveContainer>
                     ) : (
                         <div className="h-full flex items-center justify-center text-slate-400 text-sm">Not enough data yet. Complete more writing tasks.</div>
                     )}
                 </div>

                 {/* Reading/Listening Chart */}
                 <div className="bg-white p-6 rounded-xl border border-slate-100 h-80">
                     <h3 className="font-bold text-slate-800 mb-4">Comprehension Accuracy (%)</h3>
                     {readingData.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={readingData}>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                 <XAxis dataKey="date" tick={{fontSize: 12}} />
                                 <YAxis domain={[0, 100]} />
                                 <Tooltip />
                                 <Bar dataKey="percentage" fill="#10b981" radius={[4, 4, 0, 0]} />
                             </BarChart>
                         </ResponsiveContainer>
                     ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">Not enough data yet.</div>
                     )}
                 </div>
             </div>
        </div>
    );
};
