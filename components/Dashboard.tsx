import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { gamificationService, getLevel, ALL_BADGES } from '../services/gamificationService';
import { ProgressEntry, ModuleType, UserSettings, StreakData } from '../types';
import {
    TrendingUp, Award, Clock, Flame, Target, BookOpen,
    PenTool, Headphones, Mic, BookMarked, Scale, Settings,
    ArrowRight, TrendingDown, Minus, BrainCircuit, Sparkles,
    ChevronRight, BarChart3, PieChart as PieChartIcon, Activity
} from 'lucide-react';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { LevelBadge } from './ui/LevelBadge';

interface DashboardProps {
    onModuleChange: (m: ModuleType) => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const getGreeting = (name: string): string => {
    const h = new Date().getHours();
    const t = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    return name ? `${t}, ${name}!` : `${t}!`;
};

const MODULE_SHORTCUTS = [
    { id: ModuleType.READING, icon: BookOpen, label: 'Reading', color: 'bg-blue-500' },
    { id: ModuleType.WRITING, icon: PenTool, label: 'Writing', color: 'bg-purple-500' },
    { id: ModuleType.LISTENING, icon: Headphones, label: 'Listening', color: 'bg-emerald-500' },
    { id: ModuleType.SPEAKING, icon: Mic, label: 'Speaking', color: 'bg-orange-500' },
    { id: ModuleType.GRAMMAR, icon: Scale, label: 'Grammar', color: 'bg-pink-500' },
    { id: ModuleType.VOCABULARY, icon: BookMarked, label: 'Vocab', color: 'bg-indigo-500' },
];

// ── Activity Heatmap ──────────────────────────────────────────────────────────

const INTENSITIES = [
    'bg-slate-100/50',
    'bg-indigo-100/60',
    'bg-indigo-300/60',
    'bg-indigo-500/80',
    'bg-indigo-600',
];

const ActivityHeatmap: React.FC = () => {
    const xpByDate = gamificationService.getXPByDate();

    // 77 days = 11 weeks for better fit in bento
    const days = Array.from({ length: 77 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (76 - i));
        return d.toISOString().split('T')[0];
    });

    const intensity = (date: string) => {
        const xp = xpByDate[date] || 0;
        if (xp === 0) return 0;
        if (xp < 30) return 1;
        if (xp < 80) return 2;
        if (xp < 180) return 3;
        return 4;
    };

    const weeks: string[][] = [];
    for (let i = 0; i < 77; i += 7) weeks.push(days.slice(i, i + 7));

    return (
        <div className="flex flex-col h-full justify-between">
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2">
                {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1.5">
                        {week.map(day => (
                            <div
                                key={day}
                                title={`${day} · ${xpByDate[day] || 0} XP`}
                                className={`heatmap-cell w-3.5 h-3.5 rounded-[3px] cursor-default transition-all duration-300 hover:ring-2 hover:ring-indigo-400 hover:ring-offset-1 ${INTENSITIES[intensity(day)]}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                <div className="flex items-center gap-2">
                    <span>Less</span>
                    <div className="flex gap-1">
                        {INTENSITIES.map((cls, i) => (
                            <div key={i} className={`w-2.5 h-2.5 rounded-sm ${cls}`} />
                        ))}
                    </div>
                    <span>More</span>
                </div>
                <span>Weekly</span>
            </div>
        </div>
    );
};

// ── Bento Card Wrapper ────────────────────────────────────────────────────────

const BentoCard: React.FC<{
    children: React.ReactNode;
    className?: string;
    title?: string;
    icon?: React.ReactNode;
    subtitle?: string;
    onClick?: () => void;
}> = ({ children, className = '', title, icon, subtitle, onClick }) => (
    <div
        onClick={onClick}
        className={`group relative bg-white border border-slate-200 rounded-2xl p-6 
        transition-all duration-300 shadow-premium
        ${onClick ? 'cursor-pointer hover:border-indigo-200 hover:shadow-premium-hover active:scale-[0.98]' : ''} 
        ${className}`}
    >
        {(title || icon) && (
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                    {title && <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{title}</h3>}
                    {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
                </div>
                {icon && <div className="p-2.5 bg-slate-50 rounded-xl text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all duration-300">
                    {icon}
                </div>}
            </div>
        )}
        {children}
    </div>
);

// ── Score Delta ───────────────────────────────────────────────────────────────

const ScoreDelta: React.FC<{ current: number; previous?: number; label: string }> = ({ current, previous, label }) => {
    if (previous === undefined) return <span className="text-slate-400 text-xs">First attempt</span>;
    const diff = parseFloat((current - previous).toFixed(1));
    if (diff === 0) return <span className="flex items-center gap-1 text-slate-400 text-xs"><Minus className="w-3 h-3" /> No change</span>;
    const positive = diff > 0;
    return (
        <span className={`flex items-center gap-1 text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
            {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {positive ? '+' : ''}{diff} vs previous
        </span>
    );
};

// ── Main component ────────────────────────────────────────────────────────────

export const Dashboard: React.FC<DashboardProps> = ({ onModuleChange }) => {
    const [history, setHistory] = useState<ProgressEntry[]>([]);
    const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
    const [streak, setStreak] = useState<StreakData>(() => storageService.getStreak());
    const [todayCount, setTodayCount] = useState(0);
    const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
    const [lastActivity, setLastActivity] = useState<any>(null);

    useEffect(() => {
        const data = storageService.getProgress();
        setHistory(data.sort((a, b) => a.date - b.date));
        setSettings(storageService.getSettings());
        setStreak(storageService.getStreak());
        setTodayCount(storageService.getTodayActivityCount());
        setEarnedBadges(gamificationService.getData().badges);

        const log = storageService.getActivityLog();
        if (log.length > 0) setLastActivity(log[0]);
    }, []);

    // Calculate Skill Mastery for Radar Chart
    const calculateSkillMastery = () => {
        const map: Record<string, number[]> = {
            reading: [], writing: [], listening: [], speaking: []
        };

        history.forEach(p => {
            const mod = p.module.toString().toLowerCase();
            if (map[mod]) map[mod].push(p.score);
        });

        const getAvg = (arr: number[], max: number) => {
            if (arr.length === 0) return 40; // baseline
            const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
            return (avg / max) * 100;
        };

        return [
            { subject: 'Reading', A: getAvg(map.reading, 5), fullMark: 100 },
            { subject: 'Writing', A: getAvg(map.writing, 9), fullMark: 100 },
            { subject: 'Listening', A: getAvg(map.listening, 5), fullMark: 100 },
            { subject: 'Speaking', A: getAvg(map.speaking, 10), fullMark: 100 },
        ];
    };

    const masteryData = calculateSkillMastery();
    const xpByDate = gamificationService.getXPByDate();

    // Learning Velocity (Last 14 days)
    const velocityData = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const dateStr = d.toISOString().split('T')[0];
        return {
            date: d.toLocaleDateString(undefined, { weekday: 'short' }),
            xp: xpByDate[dateStr] || 0
        };
    });

    // AI Tip Logic
    const getAiTip = () => {
        const sorted = [...masteryData].sort((a, b) => a.A - b.A);
        const lowSkill = sorted[0];

        const TIPS: Record<string, string> = {
            Reading: "Skim scientific articles for 10 minutes daily to boost your scanning speed.",
            Writing: "Focus on 'Cohesion and Coherence' by using balanced linking words in your essays.",
            Listening: "Try listening to English podcasts at 1.25x speed to sharpen your ear for native flow.",
            Speaking: "Record yourself answering a Part 2 cue card and count your filler words (um, ah).",
        };

        return {
            skill: lowSkill.subject,
            tip: TIPS[lowSkill.subject] || "Mix up your study routine to stay engaged and sharp!",
            score: Math.round(lowSkill.A)
        };
    };

    const aiTip = getAiTip();
    const gamData = gamificationService.getData();
    const levelInfo = getLevel(gamData.xp);
    const displayedBadges = ALL_BADGES.filter(b => earnedBadges.includes(b.id));

    const goalProgress = Math.min(100, Math.round((todayCount / settings.dailyGoal) * 100));

    return (
        <div className="space-y-8 fade-slide-in pb-20">

            {/* ── Crystal Dashboard ─────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-8 auto-rows-fr">

                {/* Card 1: Clean Hero (Col Span 4) */}
                <div className="md:col-span-4 lg:col-span-4 bg-white rounded-3xl p-10 border border-slate-200 shadow-sm relative overflow-hidden group">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                        <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px]" />
                    </div>

                    <div className="flex items-start justify-between relative z-10">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-2 bg-slate-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-slate-200">
                                <img src="/assets/logo.png" alt="Dragon" className="w-3.5 h-3.5 object-contain" /> {levelInfo.name} Specialist
                            </div>
                            <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight leading-tight">{getGreeting(settings.displayName)}</h2>
                            <p className="text-slate-500 font-medium text-base">Mastering English to Band {settings.targetBand}.</p>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Active Rank</div>
                                <div className="text-3xl font-bold text-slate-900 tabular-nums">#1,248</div>
                            </div>
                            <LevelBadge size={80} showLabel />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mt-16 relative z-10">
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                    <Flame className="w-6 h-6 text-orange-600" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Streak</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900">{streak.current}<span className="text-sm font-bold text-slate-400 ml-1">days</span></div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                    <Target className="w-6 h-6 text-emerald-600" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Today</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900">{todayCount}<span className="text-sm font-bold text-slate-400 ml-1">/ {settings.dailyGoal}</span></div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <BarChart3 className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mastery</span>
                            </div>
                            <div className="text-3xl font-black text-slate-900">{Math.round(masteryData.reduce((a, b) => a + b.A, 0) / 4)}<span className="text-sm font-bold text-slate-400 ml-1">%</span></div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Skill Mastery Radar (Col Span 2) */}
                <BentoCard
                    title="Proficiency Radar"
                    subtitle="Skill Balance"
                    icon={<PieChartIcon className="w-5 h-5" />}
                    className="md:col-span-2 lg:col-span-2 shadow-[0_20px_60px_rgba(0,0,0,0.03)]"
                >
                    <div className="h-64 w-full -mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={masteryData}>
                                <PolarGrid stroke="#f1f5f9" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 900 }} />
                                <Radar
                                    name="Skill"
                                    dataKey="A"
                                    stroke="#4f46e5"
                                    fill="#4f46e5"
                                    fillOpacity={0.15}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>

                {/* Card 3: AI Coach (Col Span 2) */}
                <BentoCard
                    className="md:col-span-2 lg:col-span-2 bg-slate-50 border-slate-200 relative overflow-hidden"
                    title="Coach Insight"
                    icon={<BrainCircuit className="w-5 h-5 text-indigo-600" />}
                >
                    {/* Living AI Ring */}
                    <div className="absolute top-8 right-8 w-10 h-10 border-2 border-indigo-600/20 rounded-xl animate-ping pointer-events-none" />
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 font-black text-sm shadow-sm border border-indigo-50">
                                {aiTip.score}%
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Low Proficiency</p>
                                <p className="text-lg font-black text-indigo-700 capitalize">{aiTip.skill}</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 font-bold leading-relaxed">
                            "{aiTip.tip}"
                        </p>
                        <button
                            onClick={() => onModuleChange(aiTip.skill.toLowerCase() as any)}
                            className="w-full flex items-center justify-between p-4 bg-white border border-indigo-100 rounded-[1.5rem] text-xs font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all group/btn shadow-sm"
                        >
                            Master This Skill
                            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </BentoCard>

                {/* Card 4: Learning Velocity (Col Span 4) */}
                <BentoCard
                    title="Activity Velocity"
                    subtitle="Recent Progress"
                    icon={<TrendingUp className="w-5 h-5" />}
                    className="md:col-span-4 lg:col-span-4 shadow-[0_20px_60px_rgba(0,0,0,0.03)]"
                >
                    <div className="h-52 w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={velocityData}>
                                <defs>
                                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                        <feGaussianBlur stdDeviation="3" result="blur" />
                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                    </filter>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }}
                                    dy={10}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
                                        fontWeight: '600',
                                        fontSize: '12px',
                                        padding: '12px'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="xp"
                                    stroke="#4f46e5"
                                    strokeWidth={3}
                                    filter="url(#glow)"
                                    dot={{ fill: '#4f46e5', r: 4, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                    fillOpacity={1}
                                    fill="url(#colorXp)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </BentoCard>

                {/* Card 5: Heatmap (Col Span 3) */}
                <BentoCard
                    title="Consistency Tracking"
                    icon={<Flame className="w-5 h-5 text-orange-500" />}
                    className="md:col-span-3 lg:col-span-3 min-h-[240px] shadow-[0_20px_60px_rgba(0,0,0,0.03)]"
                >
                    <ActivityHeatmap />
                </BentoCard>

                {/* Card 6: Achievements (Col Span 3) */}
                <BentoCard
                    title="Achievements"
                    subtitle={`${displayedBadges.length} collected`}
                    icon={<Award className="w-5 h-5 text-amber-500" />}
                    className="md:col-span-3 lg:col-span-3 overflow-y-auto max-h-[240px] shadow-[0_20px_60px_rgba(0,0,0,0.03)]"
                >
                    <div className="flex flex-wrap gap-4">
                        {displayedBadges.slice(0, 10).map(b => (
                            <div
                                key={b.id}
                                title={b.description}
                                className="group/badge relative w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl hover:bg-white hover:scale-110 hover:shadow-md transition-all cursor-help border border-slate-100"
                            >
                                {b.icon}
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-amber-400 shadow-sm" />
                            </div>
                        ))}
                    </div>
                </BentoCard>

            </div>

            {/* ── Training Modules ──────────────────────────────────── */}
            <div className="pt-4">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 ml-4">Core Training</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                    {MODULE_SHORTCUTS.map(m => (
                        <button
                            key={m.id}
                            onClick={() => onModuleChange(m.id)}
                            className="flex flex-col items-center gap-4 bg-white border border-slate-100 rounded-[2.5rem] p-6 hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1.5 transition-all group shadow-sm"
                        >
                            <div className={`w-14 h-14 ${m.color} bg-opacity-10 rounded-2xl flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform`}>
                                <div className={`w-10 h-10 ${m.color} rounded-xl flex items-center justify-center`}>
                                    <m.icon className="w-6 h-6" />
                                </div>
                            </div>
                            <span className="text-xs font-black text-slate-600 uppercase tracking-widest">{m.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
