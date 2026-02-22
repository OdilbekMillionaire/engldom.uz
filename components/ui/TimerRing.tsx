/**
 * TimerRing — SVG countdown ring.
 * Transitions green → amber (≤50%) → red (≤20%) and pulses when critical.
 */
import React from 'react';

interface Props {
  timeLeft:  number;  // seconds remaining
  totalTime: number;  // seconds total
  size?: number;      // px diameter (default 60)
}

export const TimerRing: React.FC<Props> = ({ timeLeft, totalTime, size = 60 }) => {
  const r      = size / 2 - 5;
  const cx     = size / 2;
  const circ   = 2 * Math.PI * r;
  const ratio  = Math.max(0, timeLeft / totalTime);
  const offset = circ * (1 - ratio);

  const color  = ratio > 0.5 ? '#10b981' : ratio > 0.2 ? '#f59e0b' : '#ef4444';
  const urgent = ratio <= 0.2;

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');

  return (
    <div className={urgent ? 'timer-urgent' : ''} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track */}
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        {/* Progress arc */}
        <circle
          cx={cx} cy={cx} r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cx})`}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s ease' }}
        />
        {/* Time text */}
        <text
          x={cx} y={cx + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize={size * 0.22}
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          {mm}:{ss}
        </text>
      </svg>
    </div>
  );
};
