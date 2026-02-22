/**
 * AnswerFeedbackCard — Duolingo-style slide-up panel shown after each
 * question is answered.  Correct → green; Wrong → red with the right answer.
 */
import React from 'react';
import { Check, X, ArrowRight, Lightbulb } from 'lucide-react';

interface Props {
  isCorrect:   boolean;
  explanation: string;
  correctAnswer?: string;   // Only shown when wrong
  onContinue:  () => void;
  isLast?:     boolean;
}

export const AnswerFeedbackCard: React.FC<Props> = ({
  isCorrect, explanation, correctAnswer, onContinue, isLast = false,
}) => {
  const accent = isCorrect
    ? { bg: 'bg-emerald-50', border: 'border-emerald-300', btn: 'bg-emerald-600 hover:bg-emerald-700', text: 'text-emerald-800', label: 'text-emerald-700', icon: <Check className="w-5 h-5" /> }
    : { bg: 'bg-red-50',     border: 'border-red-300',     btn: 'bg-red-600 hover:bg-red-700',         text: 'text-red-800',     label: 'text-red-700',     icon: <X    className="w-5 h-5" /> };

  return (
    <div className={`slide-up-feedback border-t-4 ${accent.border} ${accent.bg} px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center gap-4`}>
      {/* Status icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isCorrect ? 'bg-emerald-500' : 'bg-red-500'}`}>
        {accent.icon}
      </div>

      {/* Message */}
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-base ${accent.label}`}>
          {isCorrect ? '✓ Correct!' : '✗ Not quite'}
        </p>
        {!isCorrect && correctAnswer && (
          <p className={`text-sm font-semibold mt-0.5 ${accent.text}`}>
            Correct answer: <span className="underline decoration-dotted">{correctAnswer}</span>
          </p>
        )}
        <div className={`flex items-start gap-1.5 mt-1.5 text-sm ${accent.text} opacity-90`}>
          <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>{explanation}</span>
        </div>
      </div>

      {/* Continue button */}
      <button
        onClick={onContinue}
        className={`flex-shrink-0 flex items-center gap-2 ${accent.btn} text-white font-bold px-5 py-2.5 rounded-xl transition-colors`}
      >
        {isLast ? 'See Results' : 'Continue'}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
