
// Shared Enums
export enum CEFRLevel {
  A1 = 'A1',
  A2 = 'A2',
  B1 = 'B1',
  B2 = 'B2',
  C1 = 'C1',
  C2 = 'C2',
}

export enum ModuleType {
  DASHBOARD = 'dashboard',
  VOCABULARY = 'vocabulary', // The Generator
  VAULT = 'vault',           // The Saved Collection
  READING = 'reading',
  WRITING = 'writing',
  LISTENING = 'listening',
  SPEAKING = 'speaking',
  HISTORY = 'history',       // New History Module
  GRAMMAR = 'grammar',       // New Grammar Module
  LIBRARY = 'library',       // New Study Center (Static Content)
  SETTINGS = 'settings',     // User Settings & Profile
}

// Data Models based on Specification

export interface VocabItem {
  word: string;
  pos: string; // Part of speech
  meaning: string;
  example: string;
  savedAt?: number; // Timestamp
  // New Enrichment Fields
  etymology?: string;
  detailedDefinition?: string;
  synonyms?: string[];
  antonyms?: string[];         // Opposite words
  wordFormation?: string;      // e.g. "Verb: ameliorate, Noun: amelioration, Adj: ameliorative"
  register?: string;           // 'formal' | 'informal' | 'academic' | 'technical' | 'neutral'
  grammarNote?: string;        // e.g. "Takes 'of' + noun: a dearth of resources. Not used with 'a/an'."
  // Generator Specifics
  collocations?: string[];     // Real multi-word phrases, e.g. "make a significant impact"
  context?: string;
  // SRS Fields
  srsLevel?: number; // 0 = New, 1-5 = Learned intervals
  nextReview?: number; // Timestamp for next review
}

export interface Question {
  id: string;
  type: 'mcq' | 'tfng' | 'short_answer' | 'gap_fill' | 'matching';
  prompt: string;
  options?: string[];
  answer: string;
  explanation: string;
}

// Storage Models
export interface ProgressEntry {
  id: string;
  date: number;
  module: ModuleType;
  score: number; // Band 0-9 or Percentage 0-100
  maxScore: number;
  label: string; // e.g., "Reading: Architecture"
}

// Activity Log to store RAW generations (The "Store Everything" rule)
export interface ActivityLogEntry {
    id: string;
    date: number;
    module: ModuleType;
    type: 'generation' | 'practice';
    data: any; // The full JSON response from Gemini
}

// Reading
export interface ReadingResponse {
  title: string;
  article: string;
  estimatedMinutes: number;
  newWords: VocabItem[];
  questions: Question[];
}

// Writing Models - Updated to "WRITIFY" Spec
export interface WritingMistake {
  original: string;
  correction: string;
  type: string; // e.g. "Spelling", "Tense"
  rule: string;
}

export interface WritingCriteria {
  score: number;
  strengths: string[];
  weaknesses: string[];
}

export interface GrammarReviewTask {
  error_type: string;
  rule_explanation: string;
  example_sentence: string;
  practice_task: string;
  practice_answer: string;
}

export interface WritingResponse {
  band_score: string; // "6.5"
  cefr_level: string; // "B2"
  spelling_standard?: string;
  overall_feedback: string;
  detailed_analysis: {
    task_response: WritingCriteria;
    coherence_cohesion: WritingCriteria;
    lexical_resource: WritingCriteria;
    grammatical_range_accuracy: WritingCriteria;
  };
  mistakes_and_corrections: WritingMistake[];
  grammar_review_tasks: GrammarReviewTask[];
}

// Listening
export interface ListeningResponse {
  title: string;
  level: string;
  audio_script: string;
  estimatedMinutes: number;
  newWords: VocabItem[];
  questions: Question[];
}

// Speaking
export interface SpeakingDrill {
  id: string;
  focus: string;
  instruction: string;
  practice: string;
}

export interface SpeakingMistake {
  word: string;
  error: string; // Description of the error
  correction: string; // Phonetic or explanation
}

export interface SpeakingLessonResponse {
  type: 'lesson';
  prompts: { level: 'easy' | 'medium' | 'hard'; text: string }[];
  modelAnswers: { short: string; long: string };
  rubricTemplate: Record<string, number>;
  feedbackTemplate: string;
}

export interface SpeakingEvalResponse {
  type: 'evaluation';
  scores: {
    fluency: number;
    grammar: number;
    vocab: number;
    coherence: number;
    pronunciation: number;
  };
  feedbackPoints: string[];
  correctedVersion: string;
  pronunciationFeedback?: { // New native audio field
    strengths: string[];
    improvements: string[];
  };
  mistakes?: SpeakingMistake[]; // Specific word errors
  drills: SpeakingDrill[];
}

export type SpeakingResponse = SpeakingLessonResponse | SpeakingEvalResponse;

// Grammar Module
export interface GrammarExercise {
  id: string;
  type: 'fix_error' | 'gap_fill' | 'mcq' | 'reorder';
  question: string; // For reorder, this is the instruction
  scrambled?: string[]; // For reorder
  options?: string[]; // Only for MCQ or Dropdown Gap Fill
  answer: string;
  explanation: string;
  hint?: string; 
}

export interface GrammarMistake {
  error: string;
  correction: string;
  explanation: string;
}

export interface GrammarVariation {
  context: string;
  text: string;
  note: string;
}

export interface GrammarResponse {
  topic: string;
  level: string;
  lessonContent: {
    coreRule: string; // 1-sentence summary
    detailedExplanation: string; // Deep dive paragraph
    examples: { context: string; text: string }[];
    commonMistakes: GrammarMistake[]; // Structured mistakes
    structureVariations: GrammarVariation[]; // Alternative ways to say it
  };
  exercises: GrammarExercise[];
}

export interface SavedGrammarRule {
    id: string;
    topic: string;
    rule: string;
    example: string;
    savedAt: number;
}

// User Settings & Profile
export interface UserSettings {
  // Profile
  displayName: string;
  avatarDataUrl: string | null;      // Base64-encoded image
  // Learning Preferences
  nativeLanguage: string;            // e.g. "Uzbek", "Russian", "Arabic"
  targetBand: string;                // "5.0" … "9.0"
  dailyGoal: number;                 // exercises per day: 2, 5, 10, 20
  defaultCEFRLevel: CEFRLevel;
  // Appearance
  theme: 'light' | 'dark' | 'system';
  // Meta
  createdAt: number;
  updatedAt: number;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string;            // YYYY-MM-DD
}

// Quiz
export interface QuizResponse {
  questions: Question[];
}

// Enrichment
export interface VocabEnrichmentResponse {
    etymology: string;
    detailedDefinition: string;
    synonyms: string[];
    antonyms?: string[];
    collocations?: string[];
    register?: string;
    grammarNote?: string;
}

// Vocabulary Generator
export interface VocabGenerationResponse {
    topic: string;
    words: VocabItem[];
}
