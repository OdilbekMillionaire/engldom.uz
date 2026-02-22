/**
 * OnboardingModal — first-time user 3-step welcome wizard.
 * Shown once when no display name is set AND no progress exists.
 * Saves to UserSettings on completion.
 */
import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { storageService } from '../services/storageService';
import { CEFRLevel } from '../types';
import { applyTheme } from './SettingsModule';

interface Props {
  onComplete: () => void;
}

const BAND_OPTIONS = ['5.5','6.0','6.5','7.0','7.5','8.0','8.5+'];
const GOAL_OPTIONS = [
  { value: 2,  label: 'Light',    sub: '~15 min/day',  emoji: '🌿' },
  { value: 5,  label: 'Moderate', sub: '~30 min/day',  emoji: '🔥' },
  { value: 10, label: 'Intense',  sub: '~1 hour/day',  emoji: '⚡' },
  { value: 20, label: 'Expert',   sub: '2+ hours/day', emoji: '🏆' },
];

type Step = 1 | 2 | 3;

export const OnboardingModal: React.FC<Props> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [band, setBand] = useState('7.0');
  const [goal, setGoal] = useState(5);

  const handleFinish = () => {
    storageService.saveSettings({
      displayName:    name.trim() || 'Learner',
      targetBand:     band.replace('+', ''),
      dailyGoal:      goal,
      defaultCEFRLevel: CEFRLevel.B2,
      theme:          'light',
    });
    applyTheme('light');
    onComplete();
  };

  const progress = ((step - 1) / 3) * 100;

  return (
    <div className="fixed inset-0 z-[500] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header progress */}
        <div className="h-1.5 bg-slate-100">
          <div
            className="h-full bg-indigo-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-8">
          {/* Logo mark */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <span className="text-3xl">🐉</span>
            </div>
          </div>

          {/* ── Step 1: Name ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6 text-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Welcome to ENGLDOM!</h2>
                <p className="text-slate-500 mt-2">Your AI-powered IELTS preparation engine. Let's set you up in 3 quick steps.</p>
              </div>
              <div className="text-left">
                <label className="block text-sm font-semibold text-slate-700 mb-2">What should we call you?</label>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && setStep(2)}
                  placeholder="e.g. Akbar, Sarah, Mohammed…"
                  maxLength={30}
                  className="w-full border-2 border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-800 outline-none transition-colors text-center text-lg font-medium placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 2: Target band ──────────────────────────── */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800">
                  {name ? `Nice to meet you, ${name}!` : 'What is your goal?'}
                </h2>
                <p className="text-slate-500 mt-2">What IELTS band score are you aiming for?</p>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {BAND_OPTIONS.map(b => (
                  <button
                    key={b}
                    onClick={() => setBand(b)}
                    className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${
                      band === b || band === b.replace('+','')
                        ? 'border-indigo-600 bg-indigo-600 text-white scale-105 shadow-lg shadow-indigo-200'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3.5 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                  Back
                </button>
                <button onClick={() => setStep(3)} className="flex-2 flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Daily goal ───────────────────────────── */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800">How much will you study?</h2>
                <p className="text-slate-500 mt-2">Set a daily practice goal. You can change this anytime in Settings.</p>
              </div>
              <div className="space-y-2">
                {GOAL_OPTIONS.map(g => (
                  <button
                    key={g.value}
                    onClick={() => setGoal(g.value)}
                    className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all text-left ${
                      goal === g.value
                        ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <span className="text-2xl">{g.emoji}</span>
                    <div className="flex-1">
                      <div className={`font-bold ${goal === g.value ? 'text-indigo-700' : 'text-slate-700'}`}>{g.label}</div>
                      <div className={`text-sm ${goal === g.value ? 'text-indigo-500' : 'text-slate-400'}`}>{g.sub} · {g.value} exercises/day</div>
                    </div>
                    {goal === g.value && <Check className="w-5 h-5 text-indigo-600 flex-shrink-0" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-3.5 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                  Start Learning 🚀
                </button>
              </div>
            </div>
          )}

          {/* Step indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {[1,2,3].map(s => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-6 bg-indigo-600' : s < step ? 'w-3 bg-indigo-300' : 'w-3 bg-slate-200'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
