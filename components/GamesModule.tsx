import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Gamepad2, Timer, Zap, Trophy, CheckCircle2, XCircle, RotateCcw,
    Volume2, Keyboard, Link, ArrowRight, Star, Flame
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { gamificationService } from '../services/gamificationService';
import { VocabItem } from '../types';
import { useXPToast } from './ui/XPToastProvider';
import { generateSpeech } from '../services/geminiService';

// ── Types ─────────────────────────────────────────────────────────────────────

type GameType = 'menu' | 'vocab_match' | 'speed_spelling' | 'collocation';
type GameResult = { score: number; total: number; xp: number; timeLeft?: number };

// ── Helpers ───────────────────────────────────────────────────────────────────

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const getGameWords = (minCount: number): VocabItem[] => {
    const words = storageService.getWords().filter(w => w.meaning && w.word);
    return shuffle(words).slice(0, Math.max(minCount, words.length));
};

// ── XP Values ─────────────────────────────────────────────────────────────────

const GAME_XP = { vocab_match: 60, speed_spelling: 50, collocation: 70 };

// ── Menu Card ─────────────────────────────────────────────────────────────────

const GameCard: React.FC<{
    title: string; description: string; icon: React.ReactNode;
    gradient: string; badge: string; minWords: number;
    wordCount: number; onClick: () => void;
}> = ({ title, description, icon, gradient, badge, minWords, wordCount, onClick }) => {
    const canPlay = wordCount >= minWords;
    return (
        <div className={`relative rounded-2xl overflow-hidden border transition-all duration-300 ${canPlay ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
            onClick={canPlay ? onClick : undefined}>
            <div className={`${gradient} p-6 text-white`}>
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">{icon}</div>
                    <span className="text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider">{badge}</span>
                </div>
                <h3 className="text-xl font-bold mb-1">{title}</h3>
                <p className="text-white/80 text-sm leading-relaxed">{description}</p>
            </div>
            <div className="bg-white p-4 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                    {canPlay ? `${wordCount} vault words available` : `Need ${minWords}+ vault words`}
                </span>
                {canPlay
                    ? <span className="flex items-center gap-1 text-xs font-bold text-indigo-600"><Zap className="w-3.5 h-3.5" />+{GAME_XP[title === 'Vocab Match' ? 'vocab_match' : title === 'Speed Spelling' ? 'speed_spelling' : 'collocation']} XP</span>
                    : <span className="text-xs text-slate-400 font-medium">Locked 🔒</span>}
            </div>
        </div>
    );
};

// ── Result Screen ─────────────────────────────────────────────────────────────

const ResultScreen: React.FC<{ result: GameResult; gameName: string; onReplay: () => void; onMenu: () => void }> = ({ result, gameName, onReplay, onMenu }) => {
    const pct = Math.round((result.score / result.total) * 100);
    const emoji = pct === 100 ? '🏆' : pct >= 70 ? '🌟' : pct >= 40 ? '👍' : '💪';
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 fade-slide-in">
            <div className="text-7xl">{emoji}</div>
            <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-1">{pct === 100 ? 'Perfect!' : pct >= 70 ? 'Great job!' : 'Keep going!'}</h2>
                <p className="text-slate-500">You scored {result.score} out of {result.total} in {gameName}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-indigo-700">{result.score}/{result.total}</div>
                    <div className="text-xs text-indigo-500 font-medium">Score</div>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
                    <div className="text-3xl font-bold text-amber-700 flex items-center justify-center gap-1"><Zap className="w-6 h-6" />{result.xp}</div>
                    <div className="text-xs text-amber-500 font-medium">XP Earned</div>
                </div>
            </div>
            <div className="flex gap-3 w-full max-w-xs">
                <button onClick={onMenu} className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:border-indigo-300 transition-all">Menu</button>
                <button onClick={onReplay} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2">
                    <RotateCcw className="w-4 h-4" /> Replay
                </button>
            </div>
        </div>
    );
};

// ── Game 1: Vocab Match ───────────────────────────────────────────────────────

const VocabMatch: React.FC<{ onDone: (r: GameResult) => void }> = ({ onDone }) => {
    const TOTAL = 8;
    const TIME = 90;
    const words = useRef(shuffle(getGameWords(4)).slice(0, TOTAL));
    const [idx, setIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIME);
    const [score, setScore] = useState(0);
    const [chosen, setChosen] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [options, setOptions] = useState<string[]>([]);
    const allWords = storageService.getWords();

    const buildOptions = useCallback((wordIdx: number) => {
        const correct = words.current[wordIdx]?.meaning;
        if (!correct) return;
        const distractors = shuffle(allWords.filter(w => w.meaning !== correct)).slice(0, 3).map(w => w.meaning);
        setOptions(shuffle([correct, ...distractors]));
    }, [allWords]);

    useEffect(() => { buildOptions(0); }, []);

    useEffect(() => {
        if (timeLeft <= 0) { onDone({ score, total: TOTAL, xp: Math.round((score / TOTAL) * GAME_XP.vocab_match) }); return; }
        const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [timeLeft, score]);

    const handleAnswer = (opt: string) => {
        if (chosen) return;
        setChosen(opt);
        setShowFeedback(true);
        const correct = opt === words.current[idx]?.meaning;
        if (correct) setScore(s => s + 1);
        setTimeout(() => {
            const next = idx + 1;
            if (next >= TOTAL) {
                const finalScore = correct ? score + 1 : score;
                onDone({ score: finalScore, total: TOTAL, xp: Math.round((finalScore / TOTAL) * GAME_XP.vocab_match), timeLeft });
            } else {
                setIdx(next);
                setChosen(null);
                setShowFeedback(false);
                buildOptions(next);
            }
        }, 1000);
    };

    const currentWord = words.current[idx];
    if (!currentWord) return null;

    const timerPct = (timeLeft / TIME) * 100;
    const timerColor = timerPct > 50 ? '#22c55e' : timerPct > 25 ? '#f59e0b' : '#ef4444';

    return (
        <div className="max-w-xl mx-auto space-y-6 fade-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                        {Array.from({ length: TOTAL }).map((_, i) => (
                            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i < idx ? 'bg-emerald-500' : i === idx ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                        ))}
                    </div>
                    <span className="text-sm font-semibold text-slate-500">{idx + 1}/{TOTAL}</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${timerPct}%`, background: timerColor }} />
                    </div>
                    <span className="text-sm font-bold" style={{ color: timerColor }}>{timeLeft}s</span>
                </div>
            </div>

            {/* Word card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-center text-white shadow-xl shadow-indigo-200">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Match the meaning</p>
                <h2 className="text-5xl font-bold font-serif mb-2">{currentWord.word}</h2>
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">{currentWord.pos}</span>
            </div>

            {/* Options */}
            <div className="space-y-3">
                {options.map((opt, i) => {
                    const isCorrect = opt === currentWord.meaning;
                    const isChosen = chosen === opt;
                    let cls = 'bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50';
                    if (showFeedback && isCorrect) cls = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-800 font-semibold';
                    else if (showFeedback && isChosen && !isCorrect) cls = 'bg-red-50 border-2 border-red-400 text-red-700';
                    return (
                        <button
                            key={i} onClick={() => handleAnswer(opt)} disabled={!!chosen}
                            className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between gap-3 ${cls}`}
                        >
                            <span className="text-sm leading-relaxed">{opt}</span>
                            {showFeedback && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                            {showFeedback && isChosen && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ── Game 2: Speed Spelling ────────────────────────────────────────────────────

const SpeedSpelling: React.FC<{ onDone: (r: GameResult) => void }> = ({ onDone }) => {
    const TOTAL = 6;
    const words = useRef(shuffle(getGameWords(3)).slice(0, TOTAL));
    const [idx, setIdx] = useState(0);
    const [input, setInput] = useState('');
    const [score, setScore] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [loading, setLoading] = useState(false);
    const [audioPlayed, setAudioPlayed] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const playAudio = async (word: string) => {
        setLoading(true);
        try {
            const base64 = await generateSpeech(word);
            const audio = new Audio(`data:audio/wav;base64,${base64}`);
            audio.play();
            setAudioPlayed(true);
        } catch {
            // Fallback: browser TTS
            const utt = new SpeechSynthesisUtterance(word);
            utt.rate = 0.8;
            speechSynthesis.speak(utt);
            setAudioPlayed(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (words.current[idx]) playAudio(words.current[idx].word);
        inputRef.current?.focus();
    }, [idx]);

    const handleSubmit = () => {
        if (!audioPlayed) return;
        const correct = input.trim().toLowerCase() === words.current[idx]?.word.toLowerCase();
        setFeedback(correct ? 'correct' : 'wrong');
        if (correct) setScore(s => s + 1);
        setTimeout(() => {
            const next = idx + 1;
            if (next >= TOTAL) {
                const finalScore = correct ? score + 1 : score;
                onDone({ score: finalScore, total: TOTAL, xp: Math.round((finalScore / TOTAL) * GAME_XP.speed_spelling) });
            } else {
                setIdx(next);
                setInput('');
                setFeedback(null);
                setAudioPlayed(false);
            }
        }, 1200);
    };

    const currentWord = words.current[idx];
    if (!currentWord) return null;

    return (
        <div className="max-w-xl mx-auto space-y-6 fade-slide-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {Array.from({ length: TOTAL }).map((_, i) => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < idx ? 'bg-emerald-500' : i === idx ? 'bg-orange-500' : 'bg-slate-200'}`} />
                    ))}
                    <span className="text-sm font-semibold text-slate-500">{idx + 1}/{TOTAL}</span>
                </div>
                <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><Trophy className="w-4 h-4" />{score} correct</span>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-pink-600 rounded-2xl p-8 text-center text-white shadow-xl shadow-orange-200">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-4">Listen & Spell</p>

                <button
                    onClick={() => playAudio(currentWord.word)}
                    disabled={loading}
                    className="w-20 h-20 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center mx-auto transition-all mb-4 group"
                >
                    {loading
                        ? <div className="w-8 h-8 border-4 border-white/40 border-t-white rounded-full animate-spin" />
                        : <Volume2 className="w-8 h-8 group-hover:scale-110 transition-transform" />}
                </button>
                <p className="text-sm opacity-80">Click to hear the word</p>
                <p className="text-xs mt-1 opacity-50">{currentWord.pos} · {currentWord.meaning.slice(0, 60)}{currentWord.meaning.length > 60 ? '…' : ''}</p>
            </div>

            <div className={`relative transition-all ${feedback === 'correct' ? 'ring-2 ring-emerald-400 rounded-xl' : feedback === 'wrong' ? 'ring-2 ring-red-400 rounded-xl' : ''}`}>
                <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    disabled={!!feedback}
                    placeholder="Type the word you heard..."
                    className={`w-full px-5 py-4 rounded-xl border-2 text-lg font-semibold outline-none transition-all ${feedback === 'correct' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' :
                            feedback === 'wrong' ? 'border-red-400 bg-red-50 text-red-700' :
                                'border-slate-200 bg-white focus:border-orange-400'
                        }`}
                />
                {feedback === 'correct' && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-500" />}
                {feedback === 'wrong' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-right">
                        <p className="text-xs text-red-600 font-bold">{currentWord.word}</p>
                        <XCircle className="w-5 h-5 text-red-400 ml-auto" />
                    </div>
                )}
            </div>

            <button
                onClick={handleSubmit}
                disabled={!input.trim() || !audioPlayed || !!feedback}
                className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
                <Keyboard className="w-5 h-5" /> Check Spelling
            </button>
        </div>
    );
};

// ── Game 3: Collocation Builder ───────────────────────────────────────────────

const CollocationBuilder: React.FC<{ onDone: (r: GameResult) => void }> = ({ onDone }) => {
    const TOTAL = 6;
    const allWords = getGameWords(4).filter(w => w.collocations && w.collocations.length > 0);
    const challengeWords = useRef(shuffle(allWords).slice(0, TOTAL));

    const [idx, setIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [chosen, setChosen] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<boolean | null>(null);

    const buildChallenge = (wordIdx: number) => {
        const w = challengeWords.current[wordIdx];
        if (!w) return null;
        const correctCollocations = (w.collocations || []).slice(0, 2);
        const correct = correctCollocations[Math.floor(Math.random() * correctCollocations.length)];
        // Add distractors: broken versions
        const distractors = [
            correct.split(' ').reverse().join(' '),
            correct.replace(w.word, '______'),
            'make a strong ' + w.word,
        ].filter(d => d !== correct);
        return { word: w, correct, options: shuffle([correct, ...distractors.slice(0, 2)]) };
    };

    const [challenge, setChallenge] = useState(() => buildChallenge(0));

    const handleAnswer = (opt: string) => {
        if (chosen) return;
        setChosen(opt);
        const isCorrect = opt === challenge?.correct;
        setFeedback(isCorrect);
        if (isCorrect) setScore(s => s + 1);
        setTimeout(() => {
            const next = idx + 1;
            if (next >= Math.min(TOTAL, challengeWords.current.length)) {
                const finalScore = isCorrect ? score + 1 : score;
                onDone({ score: finalScore, total: Math.min(TOTAL, challengeWords.current.length), xp: Math.round((finalScore / TOTAL) * GAME_XP.collocation) });
            } else {
                setIdx(next);
                setChosen(null);
                setFeedback(null);
                setChallenge(buildChallenge(next));
            }
        }, 1200);
    };

    if (challengeWords.current.length < 3) {
        return (
            <div className="text-center py-16 text-slate-500">
                <Link className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-semibold">Not enough vault words with collocations yet.</p>
                <p className="text-sm mt-1">Generate vocabulary from the Vocab Generator to unlock this game.</p>
            </div>
        );
    }

    if (!challenge) return null;

    const total = Math.min(TOTAL, challengeWords.current.length);

    return (
        <div className="max-w-xl mx-auto space-y-6 fade-slide-in">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {Array.from({ length: total }).map((_, i) => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < idx ? 'bg-emerald-500' : i === idx ? 'bg-teal-500' : 'bg-slate-200'}`} />
                    ))}
                    <span className="text-sm font-semibold text-slate-500">{idx + 1}/{total}</span>
                </div>
                <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><Trophy className="w-4 h-4" />{score} correct</span>
            </div>

            <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-8 text-center text-white shadow-xl shadow-teal-200">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Pick the Natural Collocation</p>
                <h2 className="text-4xl font-bold font-serif">{challenge.word.word}</h2>
                <p className="opacity-70 text-sm mt-2">{challenge.word.meaning.slice(0, 80)}…</p>
            </div>

            <p className="text-center text-sm text-slate-500 font-medium">Which phrase sounds natural with this word?</p>

            <div className="space-y-3">
                {challenge.options.map((opt, i) => {
                    const isCorrect = opt === challenge.correct;
                    const isChosen = chosen === opt;
                    let cls = 'bg-white border-2 border-slate-200 text-slate-700 hover:border-teal-300 hover:bg-teal-50';
                    if (feedback !== null && isCorrect) cls = 'bg-emerald-50 border-2 border-emerald-500 text-emerald-800 font-semibold';
                    else if (feedback !== null && isChosen && !isCorrect) cls = 'bg-red-50 border-2 border-red-400 text-red-700';
                    return (
                        <button key={i} onClick={() => handleAnswer(opt)} disabled={!!chosen}
                            className={`w-full text-left p-4 rounded-xl transition-all flex items-center justify-between gap-3 ${cls}`}
                        >
                            <span className="text-sm leading-relaxed italic">"{opt}"</span>
                            {feedback !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                            {feedback !== null && isChosen && !isCorrect && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

// ── Main Module ───────────────────────────────────────────────────────────────

export const GamesModule: React.FC = () => {
    const [currentGame, setCurrentGame] = useState<GameType>('menu');
    const [result, setResult] = useState<GameResult | null>(null);
    const { showXP, showBadge } = useXPToast();
    const vaultCount = storageService.getWords().length;

    const handleGameDone = (r: GameResult, gameType: GameType) => {
        setResult(r);
        if (r.xp > 0) {
            storageService.updateStreak();
            const xpResult = gamificationService.earnXP('vault_quiz_complete', r.score === r.total ? ['vault_quiz_perfect'] : []);
            xpResult.newBadges.forEach(b => showBadge(b));
            showXP(r.xp, 'Mini-Game');
        }
        setCurrentGame('menu');
    };

    const gameTitle = {
        vocab_match: 'Vocab Match', speed_spelling: 'Speed Spelling', collocation: 'Collocation Builder', menu: ''
    }[currentGame];

    return (
        <div className="space-y-6 fade-slide-in pb-12">

            {/* Header */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-3">
                            <Gamepad2 className="w-7 h-7 text-indigo-400" />
                            Vocabulary Games
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">Practice your vault words through fun mini-games and earn XP.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-400">{vaultCount}</div>
                        <div className="text-xs text-slate-500">Vault Words</div>
                    </div>
                </div>

                {vaultCount < 4 && (
                    <div className="mt-4 bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 flex items-center gap-2 text-amber-300 text-sm">
                        <Star className="w-4 h-4 flex-shrink-0" />
                        Save at least 4 words to your Vault to start playing! Go to the Vocab Generator to get started.
                    </div>
                )}
            </div>

            {/* Result banner */}
            {result && currentGame === 'menu' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-emerald-800">Last Game Result</p>
                        <p className="text-sm text-emerald-600">{result.score}/{result.total} correct · <span className="font-bold">+{result.xp} XP earned</span></p>
                    </div>
                    <button onClick={() => setResult(null)} className="text-emerald-400 hover:text-emerald-600 text-xs font-medium">Dismiss</button>
                </div>
            )}

            {/* Game menu */}
            {currentGame === 'menu' && (
                <div className="grid md:grid-cols-3 gap-6">
                    <GameCard
                        title="Vocab Match"
                        description="Match the vocabulary word to its correct definition before the timer runs out."
                        icon={<Flame className="w-6 h-6 text-white" />}
                        gradient="bg-gradient-to-br from-indigo-500 to-blue-600"
                        badge="Classic"
                        minWords={4}
                        wordCount={vaultCount}
                        onClick={() => { setCurrentGame('vocab_match'); setResult(null); }}
                    />
                    <GameCard
                        title="Speed Spelling"
                        description="Listen to the word being read aloud and type it correctly. Train your spelling and ear."
                        icon={<Volume2 className="w-6 h-6 text-white" />}
                        gradient="bg-gradient-to-br from-orange-500 to-pink-600"
                        badge="Audio"
                        minWords={3}
                        wordCount={vaultCount}
                        onClick={() => { setCurrentGame('speed_spelling'); setResult(null); }}
                    />
                    <GameCard
                        title="Collocation Builder"
                        description="Pick the natural, high-frequency phrase that native speakers actually use with the word."
                        icon={<Link className="w-6 h-6 text-white" />}
                        gradient="bg-gradient-to-br from-teal-500 to-emerald-600"
                        badge="Advanced"
                        minWords={4}
                        wordCount={vaultCount}
                        onClick={() => { setCurrentGame('collocation'); setResult(null); }}
                    />
                </div>
            )}

            {/* Active games */}
            {currentGame !== 'menu' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 text-lg">{gameTitle}</h3>
                        <button
                            onClick={() => { setCurrentGame('menu'); }}
                            className="text-sm text-slate-400 hover:text-slate-700 font-medium flex items-center gap-1"
                        >
                            ← Back to Games
                        </button>
                    </div>

                    {currentGame === 'vocab_match' && (
                        <VocabMatch onDone={(r) => handleGameDone(r, 'vocab_match')} />
                    )}
                    {currentGame === 'speed_spelling' && (
                        <SpeedSpelling onDone={(r) => handleGameDone(r, 'speed_spelling')} />
                    )}
                    {currentGame === 'collocation' && (
                        <CollocationBuilder onDone={(r) => handleGameDone(r, 'collocation')} />
                    )}
                </div>
            )}
        </div>
    );
};
