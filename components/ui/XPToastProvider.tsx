/**
 * XPToastProvider — global context for firing +XP toasts and badge-unlock
 * notifications from anywhere in the component tree.
 *
 * Usage:
 *   const { showXP, showBadge } = useXPToast();
 *   showXP(50, 'Reading complete');
 *   showBadge(badge);
 */
import React, { createContext, useCallback, useContext, useState } from 'react';
import { Badge } from '../../services/gamificationService';

// ── Context ──────────────────────────────────────────────────────────────────

interface XPToastCtx {
  showXP:   (amount: number, label?: string) => void;
  showBadge: (badge: Badge) => void;
}

const Ctx = createContext<XPToastCtx | null>(null);
export const useXPToast = () => useContext(Ctx)!;

// ── Toast item types ──────────────────────────────────────────────────────────

type ToastItem =
  | { id: string; kind: 'xp';    amount: number; label?: string }
  | { id: string; kind: 'badge'; badge: Badge };

// ── Provider ──────────────────────────────────────────────────────────────────

export const XPToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) =>
    setToasts(prev => prev.filter(t => t.id !== id)), []);

  const showXP = useCallback((amount: number, label?: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev.slice(-4), { id, kind: 'xp', amount, label }]);
    setTimeout(() => remove(id), 2600);
  }, [remove]);

  const showBadge = useCallback((badge: Badge) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev.slice(-4), { id, kind: 'badge', badge }]);
    setTimeout(() => remove(id), 4200);
  }, [remove]);

  return (
    <Ctx.Provider value={{ showXP, showBadge }}>
      {children}

      {/* Toast stack — rendered via a portal-like fixed layer */}
      <div
        aria-live="polite"
        className="fixed bottom-6 right-6 z-[400] flex flex-col-reverse gap-2 items-end pointer-events-none select-none"
      >
        {toasts.map(t =>
          t.kind === 'xp' ? (
            <XPItem key={t.id} amount={t.amount} label={t.label} />
          ) : (
            <BadgeItem key={t.id} badge={t.badge} />
          )
        )}
      </div>
    </Ctx.Provider>
  );
};

// ── Individual toast renderers ────────────────────────────────────────────────

const XPItem: React.FC<{ amount: number; label?: string }> = ({ amount, label }) => (
  <div className="xp-toast flex items-center gap-2.5 bg-indigo-600 text-white pl-3 pr-4 py-2.5 rounded-2xl shadow-2xl shadow-indigo-900/40 font-semibold text-sm">
    <span className="text-base leading-none">⚡</span>
    <span className="text-yellow-300 font-bold">+{amount} XP</span>
    {label && <span className="opacity-70 font-normal text-xs hidden sm:inline">{label}</span>}
  </div>
);

const TIER_GRADIENT: Record<Badge['tier'], string> = {
  bronze: 'from-orange-500 to-amber-600',
  silver: 'from-slate-400 to-slate-600',
  gold:   'from-yellow-400 to-orange-500',
};

const BadgeItem: React.FC<{ badge: Badge }> = ({ badge }) => (
  <div className={`xp-toast flex items-center gap-3 bg-gradient-to-r ${TIER_GRADIENT[badge.tier]} text-white px-4 py-3 rounded-2xl shadow-2xl font-semibold`}>
    <span className="text-2xl leading-none">{badge.icon}</span>
    <div>
      <div className="text-[10px] font-normal uppercase tracking-widest opacity-80">Badge Unlocked!</div>
      <div className="text-sm font-bold">{badge.name}</div>
    </div>
  </div>
);
