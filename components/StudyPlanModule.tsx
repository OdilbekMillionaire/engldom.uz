import React, { useState, useEffect } from 'react';
import {
    CalendarDays, Target, Trophy, Zap, BookOpen, PenTool, Headphones,
    Mic, BookMarked, Scale, RefreshCw, CheckCircle2, Circle, ChevronDown,
    ChevronUp, Sparkles, Clock, Star, Flame, ArrowRight, RotateCcw
} from 'lucide-react';
import { generateStudyPlan } from '../services/geminiService';
import { gamificationService } from '../services/gamificationService';
import { storageService } from '../services/storageService';
import { StudyPlanResponse, StudyPlanDay, StudyPlanTask } from '../types';
import { useXPToast } from './ui/XPToastProvider';

// ── Constants ────────────────────────────────────────────────────────────────

const IELTS_BANDS = ['4.0', '4.5', '5.0', '5.5', '6.0', '6.5', '7.0', '7.5', '8.0', '8.5', '9.0'];

const TASK_ICONS: Record<string, React.ElementType> = {
    reading: BookOpen, writing: PenTool, listening: Headphones,
    speaking: Mic, vocabulary: BookMarked, grammar: Scale, review: Star,
};

const TASK_COLORS: Record<string, string> = {
    reading: 'bg-blue-100   text-blue-700   border-blue-200',
    writing: 'bg-purple-100 text-purple-700 border-purple-200',
    listening: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    speaking: 'bg-orange-100 text-orange-700 border-orange-200',
    vocabulary: 'bg-pink-100   text-pink-700   border-pink-200',
    grammar: 'bg-teal-100   text-teal-700   border-teal-200',
    review: 'bg-amber-100  text-amber-700  border-amber-200',
};

const TASK_DOT: Record<string, string> = {
    reading: 'bg-blue-500', writing: 'bg-purple-500', listening: 'bg-emerald-500',
    speaking: 'bg-orange-500', vocabulary: 'bg-pink-500', grammar: 'bg-teal-500', review: 'bg-amber-500',
};

const STORAGE_KEY = 'engldom_study_plan';
const COMPLETED_KEY = 'engldom_study_plan_completed';

// ── Helpers ──────────────────────────────────────────────────────────────────

const savePlan = (plan: StudyPlanResponse) =>
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));

const loadPlan = (): StudyPlanResponse | null => {
    try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
};

const loadCompleted = (): Set<string> => {
    try { const r = localStorage.getItem(COMPLETED_KEY); return r ? new Set(JSON.parse(r)) : new Set(); } catch { return new Set(); }
};

const saveCompleted = (set: Set<string>) =>
    localStorage.setItem(COMPLETED_KEY, JSON.stringify([...set]));

// ── Sub-components ────────────────────────────────────────────────────────────

const ScoreGapBadge: React.FC<{ current: string; target: string }> = ({ current, target }) => {
    const gap = parseFloat(target) - parseFloat(current);
    const color = gap <= 0.5 ? 'bg-emerald-100 text-emerald-700' : gap <= 1.5 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
    return (
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${color}`}>
            {gap > 0 ? `+${gap.toFixed(1)} bands to go` : 'Target reached! 🎉'}
        </span>
    );
};

const TaskCard: React.FC<{
    task: StudyPlanTask;
    isCompleted: boolean;
    onToggle: (id: string, xp: number) => void;
    dayIndex: number;
}> = ({ task, isCompleted, onToggle, dayIndex }) => {
    const [expanded, setExpanded] = useState(false);
    const Icon = TASK_ICONS[task.type] || Star;
    const colorClass = TASK_COLORS[task.type] || TASK_COLORS.review;
    const dotClass = TASK_DOT[task.type] || 'bg-slate-400';

    return (
        <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${isCompleted
                ? 'bg-slate-50 border-slate-200 opacity-75'
                : 'bg-white border-slate-200 hover:border-indigo-200 hover:shadow-md'
            }`}>
            <div
                className="p-4 flex items-start gap-3 cursor-pointer"
                onClick={() => setExpanded(e => !e)}
            >
                {/* Check button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(task.id, task.xp); }}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all mt-0.5 ${isCompleted
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 hover:border-emerald-400'
                        }`}
                >
                    {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                </button>

                {/* Icon + content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${colorClass}`}>
                            <Icon className="w-3 h-3" />
                            {task.type.toUpperCase()}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                            <Clock className="w-3 h-3" /> {task.duration}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-bold ml-auto">
                            <Zap className="w-3 h-3" /> +{task.xp} XP
                        </span>
                    </div>
                    <p className={`font-semibold text-sm ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {task.title}
                    </p>
                </div>

                {/* Expand toggle */}
                <div className="text-slate-400 flex-shrink-0">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </div>

            {/* Expanded details */}
            {expanded && (
                <div className="px-4 pb-4 pt-0 space-y-3 animate-fade-in border-t border-slate-100 mt-0">
                    <p className="text-sm text-slate-600 leading-relaxed">{task.description}</p>
                    {task.tip && (
                        <div className="flex gap-2 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                            <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-indigo-700 leading-relaxed"><span className="font-bold">Pro Tip: </span>{task.tip}</p>
                        </div>
                    )}
                    {!isCompleted && (
                        <button
                            onClick={() => onToggle(task.id, task.xp)}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" /> Mark as Complete (+{task.xp} XP)
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const DayPanel: React.FC<{
    day: StudyPlanDay;
    completedIds: Set<string>;
    onToggle: (id: string, xp: number) => void;
    isToday?: boolean;
}> = ({ day, completedIds, onToggle, isToday }) => {
    const [open, setOpen] = useState(isToday || day.day === 1);
    const completedTasks = day.tasks.filter(t => completedIds.has(t.id)).length;
    const progress = Math.round((completedTasks / day.tasks.length) * 100);
    const isDone = completedTasks === day.tasks.length;

    return (
        <div className={`rounded-2xl border overflow-hidden transition-all ${isToday ? 'border-indigo-400 shadow-lg shadow-indigo-100' : isDone ? 'border-emerald-200' : 'border-slate-200'
            }`}>
            {/* Day header */}
            <button
                className={`w-full flex items-center gap-4 p-5 text-left transition-colors ${open ? 'bg-slate-900 text-white' : isDone ? 'bg-emerald-50' : 'bg-white hover:bg-slate-50'
                    }`}
                onClick={() => setOpen(o => !o)}
            >
                {/* Day number circle */}
                <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex flex-col items-center justify-center font-bold ${isDone ? 'bg-emerald-500 text-white' :
                        isToday ? 'bg-indigo-500 text-white' :
                            open ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                    <span className="text-[10px] uppercase tracking-widest leading-none">{day.dayName.slice(0, 3)}</span>
                    <span className="text-lg leading-none">{day.day}</span>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className={`font-bold ${open ? 'text-white' : 'text-slate-800'}`}>{day.theme}</p>
                        {isToday && <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold">TODAY</span>}
                        {isDone && <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">DONE ✓</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                        <div className={`flex-1 h-1.5 rounded-full ${open ? 'bg-white/20' : 'bg-slate-200'}`}>
                            <div
                                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                                style={{ width: `${progress}%`, background: isDone ? '#22c55e' : undefined }}
                            />
                        </div>
                        <span className={`text-xs font-semibold whitespace-nowrap ${open ? 'text-white/70' : 'text-slate-500'}`}>
                            {completedTasks}/{day.tasks.length} tasks · {day.totalMinutes} min
                        </span>
                    </div>
                </div>

                <div className={open ? 'text-white/60' : 'text-slate-400'}>
                    {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
            </button>

            {/* Tasks */}
            {open && (
                <div className="p-4 space-y-3 bg-slate-50">
                    {day.tasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            isCompleted={completedIds.has(task.id)}
                            onToggle={onToggle}
                            dayIndex={day.day}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Onboarding Form ───────────────────────────────────────────────────────────

const OnboardingForm: React.FC<{ onGenerate: (c: string, t: string, w: number) => void; loading: boolean }> = ({ onGenerate, loading }) => {
    const settings = storageService.getSettings();
    const [currentScore, setCurrentScore] = useState('6.0');
    const [targetScore, setTargetScore] = useState(settings.targetBand || '7.0');
    const [mode, setMode] = useState<'date' | 'weeks'>('weeks');
    const [testDate, setTestDate] = useState('');
    const [weeksRemaining, setWeeksRemaining] = useState(8);

    const computeWeeks = () => {
        if (mode === 'weeks') return weeksRemaining;
        if (!testDate) return 8;
        const diff = new Date(testDate).getTime() - Date.now();
        return Math.max(1, Math.round(diff / (7 * 864e5)));
    };

    const isValid = parseFloat(targetScore) > parseFloat(currentScore);

    return (
        <div className="max-w-2xl mx-auto">
            {/* Hero */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-8 text-white text-center mb-8 shadow-xl shadow-indigo-200">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CalendarDays className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-bold mb-2">AI Study Plan Generator</h2>
                <p className="text-indigo-200 text-sm leading-relaxed">
                    Tell us where you are and where you want to be. Our AI will generate a personalised 7-day IELTS study plan tailored to your exact needs.
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">
                {/* IELTS Scores */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Current IELTS Band</label>
                        <select
                            value={currentScore}
                            onChange={e => setCurrentScore(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                            {IELTS_BANDS.map(b => <option key={b} value={b}>Band {b}</option>)}
                        </select>
                        <p className="text-xs text-slate-400">Your most recent exam score</p>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Target IELTS Band</label>
                        <select
                            value={targetScore}
                            onChange={e => setTargetScore(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        >
                            {IELTS_BANDS.map(b => <option key={b} value={b}>Band {b}</option>)}
                        </select>
                        <p className="text-xs text-slate-400">The score you need to achieve</p>
                    </div>
                </div>

                {!isValid && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium text-center">
                        ⚠️ Target band must be higher than your current band.
                    </div>
                )}

                {/* Score gap visual */}
                {isValid && (
                    <div className="flex items-center gap-4 bg-indigo-50 rounded-xl p-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-slate-700">{currentScore}</div>
                            <div className="text-xs text-slate-500">Current</div>
                        </div>
                        <div className="flex-1 flex flex-col items-center">
                            <ArrowRight className="w-5 h-5 text-indigo-400" />
                            <ScoreGapBadge current={currentScore} target={targetScore} />
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-indigo-700">{targetScore}</div>
                            <div className="text-xs text-indigo-500">Target</div>
                        </div>
                    </div>
                )}

                {/* Time */}
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-slate-700">How long until your exam?</label>
                    <div className="flex gap-3">
                        {(['weeks', 'date'] as const).map(m => (
                            <button
                                key={m}
                                onClick={() => setMode(m)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${mode === m ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-500 hover:border-indigo-300'
                                    }`}
                            >
                                {m === 'weeks' ? '🗓️ Set Weeks' : '📅 Pick Date'}
                            </button>
                        ))}
                    </div>

                    {mode === 'weeks' ? (
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600 font-medium">Weeks remaining:</span>
                                <span className="text-2xl font-bold text-indigo-700">{weeksRemaining}</span>
                            </div>
                            <input
                                type="range" min={1} max={52} value={weeksRemaining}
                                onChange={e => setWeeksRemaining(Number(e.target.value))}
                                className="w-full accent-indigo-600"
                            />
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>1 week</span><span>26 weeks</span><span>52 weeks</span>
                            </div>
                        </div>
                    ) : (
                        <input
                            type="date"
                            value={testDate}
                            onChange={e => setTestDate(e.target.value)}
                            min={new Date(Date.now() + 7 * 864e5).toISOString().split('T')[0]}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    )}
                </div>

                <button
                    onClick={() => isValid && onGenerate(currentScore, targetScore, computeWeeks())}
                    disabled={!isValid || loading}
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    {loading ? 'Generating Your Plan...' : 'Generate My 7-Day Plan'}
                </button>
            </div>
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const StudyPlanModule: React.FC = () => {
    const [plan, setPlan] = useState<StudyPlanResponse | null>(() => loadPlan());
    const [completed, setCompleted] = useState<Set<string>>(() => loadCompleted());
    const [loading, setLoading] = useState(false);
    const { showXP } = useXPToast();

    const totalXP = plan ? plan.days.flatMap(d => d.tasks).filter(t => completed.has(t.id)).reduce((s, t) => s + t.xp, 0) : 0;
    const totalTasks = plan ? plan.days.flatMap(d => d.tasks).length : 0;
    const completedCount = plan ? plan.days.flatMap(d => d.tasks).filter(t => completed.has(t.id)).length : 0;
    const overallProgress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    const handleGenerate = async (currentScore: string, targetScore: string, weeksRemaining: number) => {
        setLoading(true);
        try {
            const settings = storageService.getSettings();
            const result = await generateStudyPlan(currentScore, targetScore, weeksRemaining, settings.nativeLanguage);
            setPlan(result);
            savePlan(result);
            // Reset completed tasks for new plan
            const newCompleted = new Set<string>();
            setCompleted(newCompleted);
            saveCompleted(newCompleted);
        } catch (err) {
            alert('Failed to generate study plan. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTask = (taskId: string, xp: number) => {
        setCompleted(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskId)) {
                newSet.delete(taskId);
            } else {
                newSet.add(taskId);
                // Award XP
                storageService.updateStreak();
                const result = gamificationService.earnXP('vocabulary_generate', []);
                showXP(xp, 'Study Plan Task');
            }
            saveCompleted(newSet);
            return newSet;
        });
    };

    const handleReset = () => {
        if (!confirm('Generate a new study plan? Your current plan and progress will be cleared.')) return;
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(COMPLETED_KEY);
        setPlan(null);
        setCompleted(new Set());
    };

    // Determine "today" day index (resets weekly)
    const todayDayIndex = (new Date().getDay() || 7); // 1=Mon … 7=Sun

    if (!plan) {
        return (
            <div className="space-y-6 fade-slide-in pb-12">
                <OnboardingForm onGenerate={handleGenerate} loading={loading} />
            </div>
        );
    }

    return (
        <div className="space-y-6 fade-slide-in pb-12">

            {/* Header stats */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200">
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                        <h2 className="text-2xl font-bold">{plan.title}</h2>
                        <p className="text-indigo-200 text-sm mt-1 max-w-lg">{plan.summary}</p>
                    </div>
                    <button
                        onClick={handleReset}
                        title="Generate new plan"
                        className="flex-shrink-0 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { icon: Target, label: 'Target Band', value: plan.targetScore },
                        { icon: Flame, label: 'Current Band', value: plan.currentScore },
                        { icon: CalendarDays, label: 'Weeks Left', value: plan.weeksRemaining },
                        { icon: Zap, label: 'XP Earned', value: `${totalXP}` },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                            <Icon className="w-5 h-5 mx-auto mb-1 opacity-70" />
                            <div className="text-xl font-bold">{value}</div>
                            <div className="text-[11px] opacity-70">{label}</div>
                        </div>
                    ))}
                </div>

                {/* Overall progress */}
                <div className="mt-5">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-semibold text-indigo-200">Overall Progress</span>
                        <span className="text-xs font-bold text-white">{completedCount}/{totalTasks} tasks</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                            style={{ width: `${overallProgress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Weekly goals */}
            {plan.weeklyGoals && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                        <Trophy className="w-4 h-4" /> This Week's Goals
                    </h3>
                    <ul className="space-y-2">
                        {plan.weeklyGoals.map((g, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                                <span className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">{i + 1}</span>
                                {g}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Weekly focus badge */}
            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <Sparkles className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                <div>
                    <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide">This Week's Focus</p>
                    <p className="text-sm font-semibold text-indigo-900">{plan.weeklyFocus}</p>
                </div>
            </div>

            {/* Day panels */}
            <div className="space-y-4">
                {plan.days.map(day => (
                    <DayPanel
                        key={day.day}
                        day={day}
                        completedIds={completed}
                        onToggle={handleToggleTask}
                        isToday={day.day === todayDayIndex}
                    />
                ))}
            </div>

            {/* Motivational note */}
            {plan.motivationalNote && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-indigo-100 rounded-2xl p-5 text-center">
                    <div className="text-2xl mb-2">💪</div>
                    <p className="text-slate-700 font-medium italic">"{plan.motivationalNote}"</p>
                </div>
            )}
        </div>
    );
};
