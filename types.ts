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
  wordFormation?: string; // Added for Reading Module UI
  // Generator Specifics
  collocations?: string[];
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
  type: 'fix_error' | 'gap_fill' | 'mcq';
  question: string;
  options?: string[]; // Only for MCQ
  answer: string;
  explanation: string;
  hint?: string; // New: Subtle clue
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

// Quiz
export interface QuizResponse {
  questions: Question[];
}

// Enrichment
export interface VocabEnrichmentResponse {
    etymology: string;
    detailedDefinition: string;
    synonyms: string[];
}

// Vocabulary Generator
export interface VocabGenerationResponse {
    topic: string;
    words: VocabItem[];
}