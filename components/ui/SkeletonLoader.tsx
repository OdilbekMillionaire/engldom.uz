/**
 * Skeleton loaders — content-shaped shimmer placeholders shown while
 * AI is generating content, replacing the plain spinner.
 */
import React from 'react';

const Line: React.FC<{ w?: string; h?: string }> = ({ w = 'w-full', h = 'h-4' }) => (
  <div className={`skeleton-shimmer rounded-lg ${w} ${h}`} />
);

/** Generic article-shaped skeleton */
export const ArticleSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <Line w="w-2/3" h="h-7" />
    <Line w="w-1/3" h="h-3" />
    <div className="h-4" />
    <Line /> <Line w="w-11/12" /> <Line w="w-4/5" />
    <div className="h-2" />
    <Line /> <Line w="w-5/6" /> <Line w="w-3/4" />
    <div className="h-2" />
    <Line /> <Line w="w-11/12" /> <Line w="w-2/3" />
  </div>
);

/** Question card skeleton */
export const QuizSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[1,2,3,4,5].map(i => (
      <div key={i} className="bg-white border border-slate-100 rounded-xl p-5 space-y-3 animate-pulse">
        <Line w="w-3/4" />
        <div className="grid grid-cols-2 gap-2">
          <Line h="h-10" /> <Line h="h-10" />
          <Line h="h-10" /> <Line h="h-10" />
        </div>
      </div>
    ))}
  </div>
);

/** Word card grid skeleton */
export const WordGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid md:grid-cols-2 gap-4">
    {Array.from({ length: count }, (_, i) => (
      <div key={i} className="bg-white border border-slate-100 rounded-xl p-5 space-y-2 animate-pulse">
        <Line w="w-1/3" h="h-5" />
        <Line w="w-1/4" h="h-3" />
        <Line w="w-full" />
        <Line w="w-4/5" />
      </div>
    ))}
  </div>
);

/** Full-screen generating overlay */
export const GeneratingOverlay: React.FC<{ message?: string }> = ({ message = 'Generating with AI…' }) => (
  <div className="flex flex-col items-center justify-center gap-6 py-20 text-center">
    {/* Pulsing rings */}
    <div className="relative w-20 h-20">
      <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-60" />
      <div className="absolute inset-2 rounded-full bg-indigo-200 animate-ping opacity-50 animation-delay-150" />
      <div className="relative w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-indigo-300">
        <span className="text-2xl">🤖</span>
      </div>
    </div>
    <div>
      <p className="font-bold text-slate-700 text-lg">{message}</p>
      <p className="text-slate-400 text-sm mt-1">This usually takes 5 – 15 seconds</p>
    </div>
    {/* Skeleton preview */}
    <div className="w-full max-w-lg opacity-40 mt-2">
      <ArticleSkeleton />
    </div>
  </div>
);
