/**
 * CompletionScreen — full-panel "Session Complete" celebration overlay.
 * Shows score, XP earned, any new badges, level-up notice, and CTAs.
 */
import React, { useEffect, useState } from 'react';
import { Trophy, Star, ArrowRight, RotateCcw, Home } from 'lucide-react';
import { Badge } from '../../services/gamificationService';

interface Props {
  score:        number;        // e.g. 4
  maxScore:     number;        // e.g. 5
  xpEarned:     number;
  bonusXP?:     number;
  leveledUp?:   boolean;
  newLevel?:    number;
  newBadges?:   Badge[];
  moduleLabel:  string;        // e.g. "Reading"
  onRetry?:     () => void;
  onHome:       () => void;
}

const percent = (s: number, m: number) => (m > 0 ? Math.round((s / m) * 100) : 0);

const emojiForScore = (pct: number) =>
  pct === 100 ? '🎉' : pct >= 80 ? '🌟' : pct >= 60 ? '👍' : '💪';

const TIER_COLORS: Record<Badge['tier'], string> = {
  bronze: 'bg-orange-100 border-orange-300 text-orange-700',
  silver: 'bg-surface-2  border-slate-300  text-t-2',
  gold:   'bg-yellow-100 border-yellow-300 text-yellow-700',
};

export const CompletionScreen: React.FC<Props> = ({
  score, maxScore, xpEarned, bonusXP = 0, leveledUp, newLevel,
  newBadges = [], moduleLabel, onRetry, onHome,
}) => {
  const pct       = percent(score, maxScore);
  const totalXP   = xpEarned + bonusXP;
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div className={`flex flex-col items-center text-center px-6 py-12 space-y-6 transition-all duration-500 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

      {/* Big emoji */}
      <div className="text-7xl select-none">{emojiForScore(pct)}</div>

      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold text-t-1">
          {pct === 100 ? 'Perfect Score!' : pct >= 80 ? 'Great Work!' : pct >= 60 ? 'Good Effort!' : 'Keep Practising!'}
        </h2>
        <p className="text-t-3 mt-1">{moduleLabel} complete</p>
      </div>

      {/* Score ring */}
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="50"
            fill="none"
            stroke={pct === 100 ? '#10b981' : pct >= 60 ? '#4f46e5' : '#f59e0b'}
            strokeWidth="10"
            strokeDasharray={`${2 * Math.PI * 50}`}
            strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease 0.3s' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-t-1">{score}/{maxScore}</span>
          <span className="text-xs text-t-4 font-medium">{pct}%</span>
        </div>
      </div>

      {/* XP row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg shadow-indigo-200">
          <span className="text-yellow-300">⚡</span>
          <span>+{totalXP} XP earned</span>
        </div>
        {bonusXP > 0 && (
          <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-2.5 rounded-2xl text-sm font-bold">
            <Star className="w-4 h-4" /> +{bonusXP} bonus
          </div>
        )}
      </div>

      {/* Level-up notice */}
      {leveledUp && newLevel !== undefined && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-lg">
          <Trophy className="w-5 h-5" />
          Level Up! You are now Level {newLevel}
        </div>
      )}

      {/* New badges */}
      {newBadges.length > 0 && (
        <div className="w-full">
          <p className="text-xs font-bold text-t-4 uppercase tracking-widest mb-3">
            Badge{newBadges.length > 1 ? 's' : ''} Unlocked
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {newBadges.map(b => (
              <div key={b.id} className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm ${TIER_COLORS[b.tier]}`}>
                <span className="text-xl">{b.icon}</span>
                <div className="text-left">
                  <div className="font-bold text-xs capitalize text-current/60">{b.tier}</div>
                  <div>{b.name}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          onClick={onHome}
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border-2 border-base-border text-t-2 font-bold rounded-xl hover:bg-background transition-colors"
        >
          <Home className="w-4 h-4" /> Dashboard
        </button>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
