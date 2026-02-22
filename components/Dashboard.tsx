import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { ProgressEntry, ModuleType, UserSettings, StreakData } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import {
  TrendingUp, Award, Clock, Flame, Target, BookOpen,
  PenTool, Headphones, Mic, BookMarked, Scale, Settings
} from 'lucide-react';

interface DashboardProps {
  onModuleChange: (m: ModuleType) => void;
}

const getGreeting = (name: string): string => {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${timeGreeting}, ${name}!` : `${timeGreeting}!`;
};

const MODULE_SHORTCUTS = [
  { id: ModuleType.READING,   icon: BookOpen,  label: 'Reading',   color: 'bg-blue-500' },
  { id: ModuleType.WRITING,   icon: PenTool,   label: 'Writing',   color: 'bg-purple-500' },
  { id: ModuleType.LISTENING, icon: Headphones,label: 'Listening', color: 'bg-emerald-500' },
  { id: ModuleType.SPEAKING,  icon: Mic,       label: 'Speaking',  color: 'bg-orange-500' },
  { id: ModuleType.GRAMMAR,   icon: Scale,     label: 'Grammar',   color: 'bg-pink-500' },
  { id: ModuleType.VOCABULARY,icon: BookMarked,label: 'Vocab',     color: 'bg-indigo-500' },
];

export const Dashboard: React.FC<DashboardProps> = ({ onModuleChange }) => {
    const [history, setHistory]     = useState<ProgressEntry[]>([]);
    const [settings, setSettings]   = useState<UserSettings>(() => storageService.getSettings());
    const [streak, setStreak]       = useState<StreakData>(() => storageService.getStreak());
    const [todayCount, setTodayCount] = useState(0);

    useEffect(() => {
        const data = storageService.getProgress();
        setHistory(data.sort((a, b) => a.date - b.date));
        setSettings(storageService.getSettings());
        setStreak(storageService.getStreak());
        setTodayCount(storageService.getTodayActivityCount());
    }, []);

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

    const goalProgress = Math.min(100, Math.round((todayCount / settings.dailyGoal) * 100));
    const avgWritingBand = writingData.length > 0
        ? (writingData.reduce((acc, curr) => acc + curr.score, 0) / writingData.length).toFixed(1)
        : null;

    return (
        <div className="space-y-6">

            {/* Personalised greeting header */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl text-white shadow-lg">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">{getGreeting(settings.displayName)}</h2>
                        <p className="opacity-80 text-sm">
                            {settings.nativeLanguage !== 'English'
                              ? `AI explanations are in ${settings.nativeLanguage}. `
                              : ''}
                            Target band: <span className="font-bold">{settings.targetBand}</span>
                        </p>
                    </div>
                    {settings.avatarDataUrl ? (
                      <img src={settings.avatarDataUrl} alt="avatar" className="w-14 h-14 rounded-full border-2 border-white/30 object-cover" />
                    ) : (
                      <button
                        onClick={() => onModuleChange(ModuleType.SETTINGS)}
                        className="flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white transition-colors border border-white/20 px-3 py-1.5 rounded-lg"
                      >
                        <Settings className="w-3.5 h-3.5" /> Set up profile
                      </button>
                    )}
                </div>

                {/* Streak & Goal inline */}
                <div className="grid grid-cols-2 gap-4 mt-5">
                    <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
                        <Flame className="w-8 h-8 text-orange-300" />
                        <div>
                            <div className="text-3xl font-bold">{streak.current}</div>
                            <div className="text-xs opacity-80">day streak {streak.longest > streak.current && `· best: ${streak.longest}`}</div>
                        </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-green-300" />
                            <span className="text-xs font-semibold opacity-80">Today's Goal</span>
                        </div>
                        <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-2xl font-bold">{todayCount}</span>
                            <span className="opacity-70 text-sm">/ {settings.dailyGoal}</span>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-400 rounded-full transition-all duration-700"
                                style={{ width: `${goalProgress}%` }}
                            />
                        </div>
                        {goalProgress >= 100 && (
                            <div className="text-xs mt-1 text-green-300 font-semibold">Goal reached! 🎉</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick-access module shortcuts */}
            <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Practice</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {MODULE_SHORTCUTS.map(m => (
                        <button
                            key={m.id}
                            onClick={() => onModuleChange(m.id)}
                            className="flex flex-col items-center gap-2 bg-white border border-slate-100 rounded-xl p-3 hover:border-indigo-300 hover:shadow-md transition-all group"
                        >
                            <div className={`w-10 h-10 ${m.color} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                                <m.icon className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-semibold text-slate-600">{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats row */}
            <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-indigo-600 text-white p-5 rounded-xl shadow-md">
                    <TrendingUp className="w-7 h-7 mb-3 opacity-80" />
                    <h3 className="text-3xl font-bold">{history.length}</h3>
                    <p className="opacity-80 text-sm font-medium mt-0.5">Total Exercises</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-100">
                    <Award className="w-7 h-7 mb-3 text-emerald-500" />
                    <h3 className="text-3xl font-bold text-slate-800">
                        {avgWritingBand ?? <span className="text-slate-400 text-xl">—</span>}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium mt-0.5">Avg Writing Band</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-100">
                    <Clock className="w-7 h-7 mb-3 text-orange-500" />
                    <h3 className="text-2xl font-bold text-slate-800">
                        {history.length > 0
                            ? new Date(history[history.length-1].date).toLocaleDateString()
                            : <span className="text-slate-400 text-xl">—</span>
                        }
                    </h3>
                    <p className="text-slate-500 text-sm font-medium mt-0.5">Last Active</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-100 h-72">
                    <h3 className="font-bold text-slate-800 mb-4">Writing Band Progression</h3>
                    {writingData.length > 1 ? (
                        <ResponsiveContainer width="100%" height="85%">
                            <LineChart data={writingData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{fontSize: 11}} />
                                <YAxis domain={[0, 9]} tickCount={10} />
                                <Tooltip />
                                <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 7 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                            <PenTool className="w-8 h-8 opacity-30" />
                            Complete at least 2 writing tasks to see progression.
                        </div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-100 h-72">
                    <h3 className="font-bold text-slate-800 mb-4">Comprehension Accuracy (%)</h3>
                    {readingData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={readingData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{fontSize: 11}} />
                                <YAxis domain={[0, 100]} />
                                <Tooltip />
                                <Bar dataKey="percentage" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                            <BookOpen className="w-8 h-8 opacity-30" />
                            Complete a reading or listening exercise to see results.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
