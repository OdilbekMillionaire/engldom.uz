/**
 * QuizProgressBar — segmented progress bar used across all quiz flows.
 * Shows Q1…Q5 steps with fill animation and correct/wrong colour coding
 * once answers are revealed.
 */
import React from 'react';
import { Check, X } from 'lucide-react';

interface Props {
  total:    number;
  current:  number;                                   // 0-based current question index
  results?: ('correct' | 'wrong' | 'unanswered')[];  // Optional post-submission results
}

export const QuizProgressBar: React.FC<Props> = ({ total, current, results }) => (
  <div className="flex items-center gap-1.5 w-full">
    {Array.from({ length: total }, (_, i) => {
      const status = results?.[i];
      const isActive   = i === current && !results;
      const isDone     = i < current && !results;

      const bg =
        status === 'correct'    ? 'bg-emerald-500' :
        status === 'wrong'      ? 'bg-red-500'     :
        isActive                ? 'bg-indigo-500'  :
        isDone                  ? 'bg-indigo-300'  : 'bg-surface-3';

      return (
        <div
          key={i}
          className={`relative flex-1 h-2.5 rounded-full transition-all duration-500 ${bg}`}
          style={{ transitionDelay: `${i * 60}ms` }}
        >
          {/* Tiny icon on result */}
          {status === 'correct' && (
            <Check className="absolute -top-4 left-1/2 -translate-x-1/2 w-3 h-3 text-emerald-600" />
          )}
          {status === 'wrong' && (
            <X className="absolute -top-4 left-1/2 -translate-x-1/2 w-3 h-3 text-red-500" />
          )}
        </div>
      );
    })}
  </div>
);
