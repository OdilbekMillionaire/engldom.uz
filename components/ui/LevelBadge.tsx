/**
 * LevelBadge — compact SVG progress ring showing the user's current level.
 * Used in the sidebar and on the Dashboard.
 */
import React from 'react';
import { gamificationService, getLevel } from '../../services/gamificationService';

interface Props {
  size?:      number;  // ring diameter in px
  showLabel?: boolean; // show level name + xp text next to ring
  className?: string;
}

export const LevelBadge: React.FC<Props> = ({ size = 44, showLabel = false, className = '' }) => {
  const data      = gamificationService.getData();
  const levelInfo = getLevel(data.xp);
  const r         = size / 2 - 4;
  const circ      = 2 * Math.PI * r;
  const offset    = circ * (1 - levelInfo.progressPercent / 100);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#334155" strokeWidth="3.5" />
          <circle
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke="#818cf8" strokeWidth="3.5"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-bold text-white"
          style={{ fontSize: size * 0.28 }}
        >
          {levelInfo.level}
        </span>
      </div>
      {showLabel && (
        <div className="min-w-0">
          <div className="text-xs font-bold text-white leading-tight">{levelInfo.name}</div>
          <div className="text-[10px] text-slate-400">{data.xp.toLocaleString()} XP</div>
        </div>
      )}
    </div>
  );
};
