import React, { useEffect, useState } from 'react';
import { storageService } from '../services/storageService';
import { gamificationService, getLevel, ALL_BADGES } from '../services/gamificationService';
import { ProgressEntry, ModuleType, UserSettings, StreakData } from '../types';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import {
  TrendingUp, Award, Clock, Flame, Target, BookOpen,
  PenTool, Headphones, Mic, BookMarked, Scale, Settings,
  ArrowRight, TrendingDown, Minus
} from 'lucide-react';
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
  { id: ModuleType.READING,    icon: BookOpen,   label: 'Reading',   color: 'bg-blue-500' },
  { id: ModuleType.WRITING,    icon: PenTool,    label: 'Writing',   color: 'bg-purple-500' },
  { id: ModuleType.LISTENING,  icon: Headphones, label: 'Listening', color: 'bg-emerald-500' },
  { id: ModuleType.SPEAKING,   icon: Mic,        label: 'Speaking',  color: 'bg-orange-500' },
  { id: ModuleType.GRAMMAR,    icon: Scale,      label: 'Grammar',   color: 'bg-pink-500' },
  { id: ModuleType.VOCABULARY, icon: BookMarked, label: 'Vocab',     color: 'bg-indigo-500' },
];

// ── Activity Heatmap ──────────────────────────────────────────────────────────

const INTENSITIES = [
  'bg-slate-100 dark:bg-slate-800',
  'bg-indigo-200',
  'bg-indigo-400',
  'bg-indigo-600',
  'bg-indigo-800',
];

const ActivityHeatmap: React.FC = () => {
  const xpByDate = gamificationService.getXPByDate();

  // 84 days = 12 weeks
  const days = Array.from({ length: 84 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (83 - i));
    return d.toISOString().split('T')[0];
  });

  const intensity = (date: string) => {
    const xp = xpByDate[date] || 0;
    if (xp === 0)   return 0;
    if (xp < 50)    return 1;
    if (xp < 120)   return 2;
    if (xp < 250)   return 3;
    return 4;
  };

  const weeks: string[][] = [];
  for (let i = 0; i < 84; i += 7) weeks.push(days.slice(i, i + 7));

  const DAY_LABELS = ['Mon','','Wed','','Fri','','Sun'];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-max">
        {/* Day labels */}
        <div className="flex flex-col gap-1 mr-1">
          {DAY_LABELS.map((d, i) => (
            <div key={i} className="h-3 w-6 text-[9px] text-slate-400 flex items-center">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map(day => (
              <div
                key={day}
                title={`${day} · ${xpByDate[day] || 0} XP`}
                className={`heatmap-cell w-3 h-3 rounded-sm cursor-default transition-colors ${INTENSITIES[intensity(day)]}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400">
        <span>Less</span>
        {INTENSITIES.map((cls, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${cls}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
};

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
  const [history,    setHistory]    = useState<ProgressEntry[]>([]);
  const [settings,   setSettings]   = useState<UserSettings>(() => storageService.getSettings());
  const [streak,     setStreak]     = useState<StreakData>(() => storageService.getStreak());
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

  const writingEntries = history.filter(h => h.module === ModuleType.WRITING);
  const writingData    = writingEntries.map(h => ({
    date: new Date(h.date).toLocaleDateString(),
    score: h.score, label: h.label,
  }));

  const readingData = history.filter(h => h.module === ModuleType.READING).map(h => ({
    date: new Date(h.date).toLocaleDateString(),
    percentage: Math.round((h.score / h.maxScore) * 100),
    label: h.label,
  }));

  const avgBand       = writingData.length > 0
    ? (writingData.reduce((s, e) => s + e.score, 0) / writingData.length).toFixed(1) : null;
  const lastBand      = writingEntries[writingEntries.length - 1]?.score;
  const prevBand      = writingEntries[writingEntries.length - 2]?.score;

  const goalProgress  = Math.min(100, Math.round((todayCount / settings.dailyGoal) * 100));
  const gamData       = gamificationService.getData();
  const levelInfo     = getLevel(gamData.xp);

  const displayedBadges = ALL_BADGES.filter(b => earnedBadges.includes(b.id));

  const moduleForActivity = (module: string) => {
    const MAP: Record<string, ModuleType> = {
      reading: ModuleType.READING, writing: ModuleType.WRITING,
      listening: ModuleType.LISTENING, speaking: ModuleType.SPEAKING,
      vocabulary: ModuleType.VOCABULARY, grammar: ModuleType.GRAMMAR,
    };
    return MAP[module] || ModuleType.DASHBOARD;
  };

  return (
    <div className="space-y-6 fade-slide-in">

      {/* ── Hero banner ──────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 p-6 rounded-2xl text-white shadow-xl shadow-indigo-200">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold truncate">{getGreeting(settings.displayName)}</h2>
            <p className="opacity-80 text-sm mt-0.5">
              {settings.nativeLanguage !== 'English'
                ? `AI explanations in ${settings.nativeLanguage} · `
                : ''}
              Target: Band <span className="font-bold">{settings.targetBand}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Level ring */}
            <LevelBadge size={48} showLabel />
            {/* Avatar */}
            {settings.avatarDataUrl && (
              <button onClick={() => onModuleChange(ModuleType.SETTINGS)}>
                <img src={settings.avatarDataUrl} alt="avatar"
                  className="w-12 h-12 rounded-full border-2 border-white/30 object-cover" />
              </button>
            )}
            {!settings.avatarDataUrl && (
              <button
                onClick={() => onModuleChange(ModuleType.SETTINGS)}
                className="flex items-center gap-1 text-xs font-semibold text-white/70 hover:text-white border border-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Settings className="w-3.5 h-3.5" /> Set up profile
              </button>
            )}
          </div>
        </div>

        {/* Streak + goal row */}
        <div className="grid grid-cols-2 gap-4 mt-5">
          <div className="bg-white/10 rounded-xl p-4 flex items-center gap-3">
            <Flame className="w-8 h-8 text-orange-300 flex-shrink-0" />
            <div>
              <div className="text-3xl font-bold">{streak.current}</div>
              <div className="text-xs opacity-80">
                day streak{streak.longest > streak.current ? ` · best: ${streak.longest}` : ''}
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Target className="w-3.5 h-3.5 text-green-300" />
              <span className="text-xs font-semibold opacity-80">Today's Goal</span>
            </div>
            <div className="flex items-baseline gap-1 mb-1.5">
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

      {/* ── Continue where you left off ───────────────────────── */}
      {lastActivity && (
        <div
          onClick={() => onModuleChange(moduleForActivity(lastActivity.module))}
          className="bg-white border border-slate-100 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Continue where you left off</p>
            <p className="text-sm font-semibold text-slate-700 truncate capitalize">
              {lastActivity.module} · {new Date(lastActivity.date).toLocaleDateString()}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
        </div>
      )}

      {/* ── Quick practice ────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Practice</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {MODULE_SHORTCUTS.map(m => (
            <button
              key={m.id}
              onClick={() => onModuleChange(m.id)}
              className="flex flex-col items-center gap-2 bg-white border border-slate-100 rounded-xl p-3 hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className={`w-10 h-10 ${m.color} rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shadow-sm`}>
                <m.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-600">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-indigo-600 text-white p-5 rounded-xl shadow-md">
          <TrendingUp className="w-7 h-7 mb-3 opacity-80" />
          <h3 className="text-3xl font-bold">{history.length}</h3>
          <p className="opacity-80 text-sm font-medium mt-0.5">Total Exercises</p>
          <p className="text-indigo-200 text-xs mt-1">{gamData.xp.toLocaleString()} XP earned</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100">
          <Award className="w-7 h-7 mb-3 text-emerald-500" />
          <h3 className="text-3xl font-bold text-slate-800">
            {avgBand ?? <span className="text-slate-400 text-xl">—</span>}
          </h3>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Avg Writing Band</p>
          {lastBand !== undefined && (
            <div className="mt-1">
              <ScoreDelta current={lastBand} previous={prevBand} label="" />
            </div>
          )}
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-100">
          <Clock className="w-7 h-7 mb-3 text-orange-500" />
          <h3 className="text-2xl font-bold text-slate-800">
            {history.length > 0
              ? new Date(history[history.length - 1].date).toLocaleDateString()
              : <span className="text-slate-400 text-xl">—</span>
            }
          </h3>
          <p className="text-slate-500 text-sm font-medium mt-0.5">Last Active</p>
        </div>
      </div>

      {/* ── Charts ────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 h-72">
          <h3 className="font-bold text-slate-800 mb-4">Writing Band Progression</h3>
          {writingData.length > 1 ? (
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={writingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
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
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
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

      {/* ── Activity heatmap ──────────────────────────────────── */}
      <div className="bg-white p-6 rounded-xl border border-slate-100">
        <h3 className="font-bold text-slate-800 mb-4">Activity Heatmap <span className="text-slate-400 font-normal text-sm">(last 12 weeks)</span></h3>
        <ActivityHeatmap />
      </div>

      {/* ── Earned Badges ─────────────────────────────────────── */}
      {displayedBadges.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4">
            Achievements <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">{displayedBadges.length}</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {displayedBadges.map(b => (
              <div
                key={b.id}
                title={b.description}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${
                  b.tier === 'gold'   ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                  b.tier === 'silver' ? 'bg-slate-50  border-slate-200  text-slate-700'  :
                                        'bg-orange-50 border-orange-200 text-orange-700'
                }`}
              >
                <span className="text-base">{b.icon}</span> {b.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
