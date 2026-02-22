import { storageService } from './storageService';

// ── Types ────────────────────────────────────────────────────────────────────

export interface GamificationData {
  xp: number;
  badges: string[];
  xpLog: { date: string; amount: number; activity: string }[];
}

export interface LevelInfo {
  level: number;
  name: string;
  xpForCurrent: number;
  xpForNext: number;
  progressPercent: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold';
}

export interface XPResult {
  earned: number;
  bonus: number;
  newTotal: number;
  leveledUp: boolean;
  newLevel: number;
  newBadges: Badge[];
}

// ── XP values ────────────────────────────────────────────────────────────────

export const XP_VALUES = {
  reading_complete:   50,
  reading_perfect:    30,   // Bonus: 5/5 score
  reading_speed:      20,   // Bonus: finished with 70%+ time left
  writing_complete:   150,
  writing_band7:      50,   // Bonus: Band 7.0+
  writing_band8:      100,  // Bonus: Band 8.0+
  listening_complete: 50,
  speaking_lesson:    30,
  speaking_eval:      100,
  vocabulary_generate:20,
  vault_quiz_complete:40,
  vault_quiz_perfect: 25,   // Bonus: all correct
  grammar_complete:   60,
  grammar_perfect:    30,   // Bonus: all correct
  daily_streak:       25,   // Awarded once per day of streak
} as const;

export type XPActivity = keyof typeof XP_VALUES;

// ── Level thresholds ─────────────────────────────────────────────────────────

const XP_THRESHOLDS = [
  0, 100, 250, 500, 800, 1_200, 1_800, 2_500, 3_500, 5_000,
  7_000, 9_500, 12_500, 16_000, 20_500, 26_000, 33_000, 41_000, 51_000, 63_000,
];

// Name per level (index = level-1)
const LEVEL_NAMES = [
  'Learner','Learner','Learner','Learner','Learner',
  'Explorer','Explorer','Explorer','Explorer','Explorer',
  'Scholar','Scholar','Scholar','Scholar','Scholar',
  'Linguist','Linguist','Linguist','Linguist','Linguist',
];

export const getLevel = (xp: number): LevelInfo => {
  let level = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  const xpForCurrent = XP_THRESHOLDS[Math.min(level - 1, XP_THRESHOLDS.length - 1)];
  const xpForNext    = XP_THRESHOLDS[Math.min(level,     XP_THRESHOLDS.length - 1)];
  const progressPercent =
    xpForNext > xpForCurrent
      ? Math.round(((xp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100)
      : 100;
  return {
    level,
    name: LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)],
    xpForCurrent,
    xpForNext,
    progressPercent,
  };
};

// ── Badge definitions ─────────────────────────────────────────────────────────

export const ALL_BADGES: Badge[] = [
  { id: 'first_exercise', name: 'First Step',      description: 'Complete your very first exercise',     icon: '🌱', tier: 'bronze' },
  { id: 'wordsmith_50',   name: 'Wordsmith',        description: 'Save 50 words to your Vault',           icon: '📚', tier: 'bronze' },
  { id: 'vocab_hoarder',  name: 'Vocab Hoarder',    description: 'Save 100 words to your Vault',          icon: '🏺', tier: 'silver' },
  { id: 'essay_writer',   name: 'Essay Writer',     description: 'Complete 5 writing tasks',              icon: '✍️', tier: 'bronze' },
  { id: 'band_7_club',    name: 'Band 7 Club',      description: 'Achieve Band 7.0+ in a writing task',   icon: '⭐', tier: 'silver' },
  { id: 'band_8_elite',   name: 'Band 8 Elite',     description: 'Achieve Band 8.0+ in a writing task',   icon: '🌟', tier: 'gold'   },
  { id: 'streak_3',       name: 'Hat Trick',        description: 'Study 3 days in a row',                 icon: '🔥', tier: 'bronze' },
  { id: 'streak_7',       name: 'Week Warrior',     description: 'Study 7 days in a row',                 icon: '🔥', tier: 'silver' },
  { id: 'streak_30',      name: 'Monthly Master',   description: 'Study 30 days in a row',                icon: '🔥', tier: 'gold'   },
  { id: 'grammar_guru',   name: 'Grammar Guru',     description: 'Complete 5 grammar lessons',            icon: '🎓', tier: 'silver' },
  { id: 'perfect_reader', name: 'Perfect Reader',   description: 'Score 5/5 on a reading quiz',           icon: '📖', tier: 'silver' },
  { id: 'speed_reader',   name: 'Speed Reader',     description: 'Finish reading with 70%+ time left',    icon: '⚡', tier: 'silver' },
  { id: 'century',        name: 'Century Club',     description: 'Complete 100 total exercises',          icon: '💯', tier: 'gold'   },
  { id: 'level_5',        name: 'Rising Star',      description: 'Reach Level 5',                         icon: '⚡', tier: 'bronze' },
  { id: 'level_10',       name: 'Decade',           description: 'Reach Level 10',                        icon: '🏆', tier: 'gold'   },
];

const getBadge = (id: string) => ALL_BADGES.find(b => b.id === id)!;

// ── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'engldom_gamification';

const getEmpty = (): GamificationData => ({ xp: 0, badges: [], xpLog: [] });

// ── Service ──────────────────────────────────────────────────────────────────

export const gamificationService = {
  getData: (): GamificationData => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...getEmpty(), ...JSON.parse(raw) } : getEmpty();
    } catch { return getEmpty(); }
  },

  save: (data: GamificationData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  /** Award XP for a named activity and return what changed. */
  earnXP: (activity: XPActivity, bonusActivities: XPActivity[] = []): XPResult => {
    const data       = gamificationService.getData();
    const prevLevel  = getLevel(data.xp).level;
    const base       = XP_VALUES[activity];
    const bonus      = bonusActivities.reduce((s, a) => s + XP_VALUES[a], 0);
    const earned     = base + bonus;

    data.xp += earned;
    data.xpLog.push({ date: new Date().toISOString().split('T')[0], amount: earned, activity });
    if (data.xpLog.length > 365) data.xpLog = data.xpLog.slice(-365);

    const newLevelInfo = getLevel(data.xp);
    const leveledUp    = newLevelInfo.level > prevLevel;
    const newBadges    = gamificationService._checkBadges(data);

    gamificationService.save(data);
    return { earned: base, bonus, newTotal: data.xp, leveledUp, newLevel: newLevelInfo.level, newBadges };
  },

  /** Award a single specific badge (e.g. perfect_reader triggered externally). */
  awardBadge: (badgeId: string): Badge | null => {
    const data = gamificationService.getData();
    if (data.badges.includes(badgeId)) return null;
    data.badges.push(badgeId);
    gamificationService.save(data);
    return getBadge(badgeId) ?? null;
  },

  /** Check all badge conditions and award any newly earned ones. */
  _checkBadges: (data: GamificationData): Badge[] => {
    const progress   = storageService.getProgress();
    const words      = storageService.getWords();
    const streak     = storageService.getStreak();
    const activities = storageService.getActivityLog();
    const levelInfo  = getLevel(data.xp);

    const writingScores = progress.filter(p => p.module === 'writing' as any).map(p => p.score);
    const grammarCount  = activities.filter(a => a.module === 'grammar' as any).length;
    const totalDone     = progress.length;

    const newlyEarned: Badge[] = [];
    const award = (id: string, cond: boolean) => {
      if (cond && !data.badges.includes(id)) {
        data.badges.push(id);
        const b = getBadge(id);
        if (b) newlyEarned.push(b);
      }
    };

    award('first_exercise', totalDone >= 1);
    award('wordsmith_50',   words.length >= 50);
    award('vocab_hoarder',  words.length >= 100);
    award('essay_writer',   writingScores.length >= 5);
    award('band_7_club',    writingScores.some(s => s >= 7.0));
    award('band_8_elite',   writingScores.some(s => s >= 8.0));
    award('streak_3',       streak.current >= 3);
    award('streak_7',       streak.current >= 7);
    award('streak_30',      streak.current >= 30);
    award('grammar_guru',   grammarCount >= 5);
    award('century',        totalDone >= 100);
    award('level_5',        levelInfo.level >= 5);
    award('level_10',       levelInfo.level >= 10);

    return newlyEarned;
  },

  /** XP indexed by date (YYYY-MM-DD) — used for heatmap. */
  getXPByDate: (): Record<string, number> => {
    const data = gamificationService.getData();
    const map: Record<string, number> = {};
    data.xpLog.forEach(e => { map[e.date] = (map[e.date] || 0) + e.amount; });
    return map;
  },
};
