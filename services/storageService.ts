import { ModuleType, ProgressEntry, VocabItem, ActivityLogEntry, SavedGrammarRule, UserSettings, StreakData, CEFRLevel } from '../types';

const STORAGE_KEYS = {
  PROGRESS:      'engldom_progress',
  VOCAB:         'engldom_vocab',
  ACTIVITY:      'engldom_activity_log',
  GRAMMAR_RULES: 'engldom_grammar_rules',
  SETTINGS:      'engldom_settings',
  STREAK:        'engldom_streak',
};

const DEFAULT_SETTINGS: UserSettings = {
  displayName:      '',
  avatarDataUrl:    null,
  nativeLanguage:   'English',
  targetBand:       '7.0',
  dailyGoal:        5,
  defaultCEFRLevel: CEFRLevel.B2,
  theme:            'light',
  createdAt:        Date.now(),
  updatedAt:        Date.now(),
};

const todayISO = () => new Date().toISOString().split('T')[0];

export const storageService = {
  // ── Vocabulary ─────────────────────────────────────────────────────────────

  saveWord: (word: VocabItem) => {
    const current = storageService.getWords();
    if (!current.find(w => w.word.toLowerCase() === word.word.toLowerCase())) {
      const updated = [{ ...word, savedAt: Date.now() }, ...current];
      localStorage.setItem(STORAGE_KEYS.VOCAB, JSON.stringify(updated));
    }
  },

  saveWords: (words: VocabItem[]) => {
    const current = storageService.getWords();
    const newWords = words.filter(nw => !current.find(cw => cw.word.toLowerCase() === nw.word.toLowerCase()));
    if (newWords.length > 0) {
      const timestamped = newWords.map(w => ({ ...w, savedAt: Date.now() }));
      const updated = [...timestamped, ...current];
      localStorage.setItem(STORAGE_KEYS.VOCAB, JSON.stringify(updated));
    }
  },

  updateWord: (word: VocabItem) => {
    const current = storageService.getWords();
    const index = current.findIndex(w => w.word.toLowerCase() === word.word.toLowerCase());
    if (index !== -1) {
      current[index] = { ...current[index], ...word };
      localStorage.setItem(STORAGE_KEYS.VOCAB, JSON.stringify(current));
    }
  },

  getWords: (): VocabItem[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.VOCAB);
    return raw ? JSON.parse(raw) : [];
  },

  removeWord: (wordText: string) => {
    const current = storageService.getWords();
    const updated = current.filter(w => w.word !== wordText);
    localStorage.setItem(STORAGE_KEYS.VOCAB, JSON.stringify(updated));
  },

  // ── Grammar Rules ──────────────────────────────────────────────────────────

  saveGrammarRule: (rule: Omit<SavedGrammarRule, 'id' | 'savedAt'>) => {
    const current = storageService.getGrammarRules();
    const newRule: SavedGrammarRule = {
      ...rule,
      id: crypto.randomUUID(),
      savedAt: Date.now()
    };
    if (!current.find(r => r.rule === rule.rule)) {
      const updated = [newRule, ...current];
      localStorage.setItem(STORAGE_KEYS.GRAMMAR_RULES, JSON.stringify(updated));
    }
  },

  getGrammarRules: (): SavedGrammarRule[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.GRAMMAR_RULES);
    return raw ? JSON.parse(raw) : [];
  },

  removeGrammarRule: (id: string) => {
    const current = storageService.getGrammarRules();
    const updated = current.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS.GRAMMAR_RULES, JSON.stringify(updated));
  },

  // ── Progress ───────────────────────────────────────────────────────────────

  saveProgress: (entry: Omit<ProgressEntry, 'id' | 'date'>) => {
    const current = storageService.getProgress();
    const newEntry: ProgressEntry = {
      ...entry,
      id: crypto.randomUUID(),
      date: Date.now(),
    };
    const updated = [newEntry, ...current];
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(updated));
  },

  getProgress: (): ProgressEntry[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return raw ? JSON.parse(raw) : [];
  },

  // ── Activity Log ───────────────────────────────────────────────────────────

  saveActivity: (module: ModuleType, data: any) => {
    const current = storageService.getActivityLog();
    const newEntry: ActivityLogEntry = {
      id: crypto.randomUUID(),
      date: Date.now(),
      module,
      type: 'generation',
      data
    };
    // Keep last 50; update streak whenever activity is logged
    const updated = [newEntry, ...current].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(updated));
    storageService.updateStreak();
  },

  getActivityLog: (): ActivityLogEntry[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    return raw ? JSON.parse(raw) : [];
  },

  clearHistory: () => {
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY);
  },

  // ── Settings ───────────────────────────────────────────────────────────────

  getSettings: (): UserSettings => {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  },

  saveSettings: (settings: Partial<UserSettings>) => {
    const current = storageService.getSettings();
    const updated: UserSettings = { ...current, ...settings, updatedAt: Date.now() };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  },

  // ── Streak ─────────────────────────────────────────────────────────────────

  getStreak: (): StreakData => {
    const raw = localStorage.getItem(STORAGE_KEYS.STREAK);
    return raw ? JSON.parse(raw) : { current: 0, longest: 0, lastActiveDate: '' };
  },

  updateStreak: () => {
    const today = todayISO();
    const streak = storageService.getStreak();
    if (streak.lastActiveDate === today) return; // Already counted today

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const newCurrent = streak.lastActiveDate === yesterday ? streak.current + 1 : 1;
    const updated: StreakData = {
      current: newCurrent,
      longest: Math.max(newCurrent, streak.longest),
      lastActiveDate: today,
    };
    localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(updated));
  },

  // ── Daily Stats ────────────────────────────────────────────────────────────

  getTodayActivityCount: (): number => {
    const today = todayISO();
    return storageService.getActivityLog().filter(
      a => new Date(a.date).toISOString().split('T')[0] === today
    ).length;
  },

  // ── Data Management ────────────────────────────────────────────────────────

  exportAllData: (): string => {
    return JSON.stringify({
      settings:    storageService.getSettings(),
      progress:    storageService.getProgress(),
      vocab:       storageService.getWords(),
      activityLog: storageService.getActivityLog(),
      grammarRules:storageService.getGrammarRules(),
      streak:      storageService.getStreak(),
      exportedAt:  new Date().toISOString(),
      version:     '1.1',
    }, null, 2);
  },

  importData: (jsonString: string): { success: boolean; error?: string } => {
    try {
      const data = JSON.parse(jsonString);
      if (data.progress)     localStorage.setItem(STORAGE_KEYS.PROGRESS,      JSON.stringify(data.progress));
      if (data.vocab)        localStorage.setItem(STORAGE_KEYS.VOCAB,         JSON.stringify(data.vocab));
      if (data.activityLog)  localStorage.setItem(STORAGE_KEYS.ACTIVITY,      JSON.stringify(data.activityLog));
      if (data.grammarRules) localStorage.setItem(STORAGE_KEYS.GRAMMAR_RULES, JSON.stringify(data.grammarRules));
      if (data.settings)     localStorage.setItem(STORAGE_KEYS.SETTINGS,      JSON.stringify(data.settings));
      if (data.streak)       localStorage.setItem(STORAGE_KEYS.STREAK,        JSON.stringify(data.streak));
      return { success: true };
    } catch {
      return { success: false, error: 'Invalid backup file. Please use a file exported from ENGLDOM.' };
    }
  },

  clearAllData: () => {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
  },

  clearProgressOnly: () => {
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVITY);
    localStorage.removeItem(STORAGE_KEYS.STREAK);
  },

  clearVaultOnly: () => {
    localStorage.removeItem(STORAGE_KEYS.VOCAB);
    localStorage.removeItem(STORAGE_KEYS.GRAMMAR_RULES);
  },
};
