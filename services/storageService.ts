import { ModuleType, ProgressEntry, VocabItem, ActivityLogEntry } from '../types';

const STORAGE_KEYS = {
  PROGRESS: 'engldom_progress',
  VOCAB: 'engldom_vocab',
  ACTIVITY: 'engldom_activity_log' // New key for raw generations
};

export const storageService = {
  // Vocabulary Methods
  saveWord: (word: VocabItem) => {
    const current = storageService.getWords();
    // Avoid duplicates
    if (!current.find(w => w.word.toLowerCase() === word.word.toLowerCase())) {
      const updated = [{ ...word, savedAt: Date.now() }, ...current];
      localStorage.setItem(STORAGE_KEYS.VOCAB, JSON.stringify(updated));
    }
  },

  // New: Bulk Save for Generator
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

  // Progress Methods (Scores)
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
  
  // NEW: Activity Log (Store Raw Generations)
  // This satisfies the "Store Everything" requirement
  saveActivity: (module: ModuleType, data: any) => {
      const current = storageService.getActivityLog();
      const newEntry: ActivityLogEntry = {
          id: crypto.randomUUID(),
          date: Date.now(),
          module,
          type: 'generation',
          data
      };
      // Keep last 50 activities to avoid LocalStorage limits, 
      // in Supabase this would be unlimited.
      const updated = [newEntry, ...current].slice(0, 50); 
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(updated));
  },

  getActivityLog: (): ActivityLogEntry[] => {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
      return raw ? JSON.parse(raw) : [];
  },

  clearHistory: () => {
      localStorage.removeItem(STORAGE_KEYS.PROGRESS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVITY);
  }
};