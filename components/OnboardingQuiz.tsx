import React, { useState, useEffect } from 'react';
import {
    Sparkles,
    ChevronRight,
    Target,
    Trophy,
    Timer,
    GraduationCap,
    Briefcase,
    Palmtree,
    CheckCircle2
} from 'lucide-react';

interface OnboardingQuizProps {
    onComplete: (results: {
        name: string;
        goal: string;
        level: string;
        commitment: number;
        targetBand: number;
    }) => void;
}

const steps = [
    {
        id: 'name',
        title: 'Welcome!',
        subtitle: 'What should we call you?',
        isInput: true,
        placeholder: 'e.g. Akbar, Sarah...',
        options: []
    },
    {
        id: 'goal',
        title: 'Your English Goal',
        subtitle: 'What is your primary focus?',
        options: [
            { id: 'ielts', label: 'IELTS Mastery', icon: <Trophy className="w-6 h-6" />, desc: 'Aiming for a high band score' },
            { id: 'business', label: 'Business Focus', icon: <Briefcase className="w-6 h-6" />, desc: 'Professional communication' },
            { id: 'travel', label: 'Travel & Fun', icon: <Palmtree className="w-6 h-6" />, desc: 'For your next adventure' },
            { id: 'academic', label: 'Academic Study', icon: <GraduationCap className="w-6 h-6" />, desc: 'University & Research' },
        ]
    },
    {
        id: 'level',
        title: 'Current Level',
        subtitle: 'Where are you starting from?',
        options: [
            { id: 'a1', label: 'Beginner (A1-A2)', icon: <div className="font-black text-xs">A1</div>, desc: 'Can understand basic phrases' },
            { id: 'b1', label: 'Intermediate (B1-B2)', icon: <div className="font-black text-xs">B1</div>, desc: 'Can handle most situations' },
            { id: 'c1', label: 'Advanced (C1-C2)', icon: <div className="font-black text-xs">C1</div>, desc: 'Fluent and sophisticated usage' },
        ]
    },
    {
        id: 'commitment',
        title: 'Daily Spark',
        subtitle: 'How much can you commit daily?',
        options: [
            { id: '5', label: '5 Minutes', icon: <Timer className="w-6 h-6 opacity-50" />, desc: 'For the busy schedule' },
            { id: '15', label: '15 Minutes', icon: <Timer className="w-6 h-6" />, desc: 'Steady progress daily' },
            { id: '30', label: '30 Minutes', icon: <div className="relative"><Timer className="w-6 h-6" /><Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-amber-400" /></div>, desc: 'The elite fast-track' },
        ]
    }
];

export const OnboardingQuiz: React.FC<OnboardingQuizProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [selections, setSelections] = useState<Record<string, string>>({});
    const [inputValue, setInputValue] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (isProcessing) {
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => {
                            const targetBandMap: Record<string, number> = {
                                'a1': 5,
                                'b1': 7,
                                'c1': 8.5
                            };
                            onComplete({
                                name: selections.name || 'Learner',
                                goal: selections.goal || 'ielts',
                                level: selections.level || 'b1',
                                commitment: parseInt(selections.commitment || '15'),
                                targetBand: targetBandMap[selections.level] || 7
                            });
                        }, 800);
                        return 100;
                    }
                    return prev + 2;
                });
            }, 50);
            return () => clearInterval(interval);
        }
    }, [isProcessing, selections, onComplete]);

    const handleNext = () => {
        if (steps[currentStep].isInput && !inputValue.trim()) return;

        const val = steps[currentStep].isInput ? inputValue.trim() : selections[steps[currentStep].id];
        const newSelections = { ...selections, [steps[currentStep].id]: val };
        setSelections(newSelections);

        if (currentStep < steps.length - 1) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 400);
        } else {
            setTimeout(() => setIsProcessing(true), 400);
        }
    };

    const handleSelect = (optionId: string) => {
        const newSelections = { ...selections, [steps[currentStep].id]: optionId };
        setSelections(newSelections);

        if (currentStep < steps.length - 1) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 400);
        } else {
            setTimeout(() => setIsProcessing(true), 400);
        }
    };

    if (isProcessing) {
        return (
            <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center p-6 z-50 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                    <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:32px_32px]" />
                </div>

                <div className="relative p-12 rounded-3xl border border-slate-200 max-w-md w-full text-center space-y-8 shadow-sm bg-white animate-in zoom-in-95 duration-700">
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 border-4 border-sub-border rounded-full" />
                        <div
                            className="absolute inset-0 border-4 border-indigo-600 rounded-full transition-all duration-150"
                            style={{
                                clipPath: `inset(0 0 0 0)`,
                                strokeDasharray: '251.2',
                                strokeDashoffset: (251.2 - (251.2 * progress) / 100),
                                transform: 'rotate(-90deg)'
                            }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-indigo-600 font-black text-xl">
                            {progress}%
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-display font-black text-t-1 tracking-tight">Generating your plan...</h2>
                        <p className="text-t-3 font-semibold text-sm">Personalizing your English journey.</p>
                    </div>

                    <div className="space-y-4 pt-4">
                        {[
                            { id: 1, label: 'Analyzing goals', threshold: 30 },
                            { id: 2, label: 'Mapping proficiency', threshold: 60 },
                            { id: 3, label: 'Optimizing schedule', threshold: 90 },
                        ].map((s) => (
                            <div key={s.id} className="flex items-center gap-3 text-left">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${progress >= s.threshold ? 'bg-indigo-600 text-white' : 'bg-surface-2 text-slate-300'}`}>
                                    {progress >= s.threshold ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1.5 h-1.5 bg-current rounded-full" />}
                                </div>
                                <span className={`text-xs font-black uppercase tracking-widest ${progress >= s.threshold ? 'text-t-2' : 'text-t-4'}`}>
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6 z-50 overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[120px] -mr-40 -mt-40" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-rose-100/20 rounded-full blur-[120px] -ml-40 -mb-40" />

            <div className="max-w-4xl w-full relative z-10 flex flex-col md:flex-row items-center gap-16 animate-in slide-in-from-bottom-8 duration-700">

                {/* Left Side: Context */}
                <div className="md:w-1/2 space-y-6 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 bg-surface px-4 py-2 rounded-full border border-sub-border shadow-sm mx-auto md:mx-0">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
                        <span className="text-[10px] font-black text-t-2 uppercase tracking-widest">Onboarding Experience</span>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-5xl lg:text-6xl font-black text-t-1 tracking-tighter leading-[1.1]">
                            Craft your <span className="text-indigo-600">crystal</span> future.
                        </h1>
                        <p className="text-t-3 font-bold text-xl leading-relaxed max-w-md mx-auto md:mx-0">
                            A few questions to build a learning path that actually works for you.
                        </p>
                    </div>

                    <div className="flex gap-2 justify-center md:justify-start">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentStep ? 'w-12 bg-indigo-600' : 'w-4 bg-surface-3'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Right Side: Step Card */}
                <div className="md:w-1/2 w-full">
                    <div className="bg-surface/70 backdrop-blur-3xl p-10 lg:p-12 rounded-[3.5rem] border border-white shadow-[0_40px_100px_rgba(0,0,0,0.04)] space-y-8">
                        <div className="space-y-1">
                            <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">{step.title}</span>
                            <h3 className="text-3xl font-black text-t-1 tracking-tight">{step.subtitle}</h3>
                        </div>

                        {step.isInput ? (
                            <div className="space-y-6">
                                <input
                                    autoFocus
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                    placeholder={step.placeholder}
                                    className="w-full bg-surface/50 border-2 border-sub-border focus:border-indigo-600 rounded-2xl px-6 py-5 text-xl font-bold text-t-1 outline-none transition-all placeholder:text-slate-300"
                                />
                                <button
                                    onClick={handleNext}
                                    disabled={!inputValue.trim()}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-surface-3 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-100"
                                >
                                    Continue <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {step.options.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleSelect(opt.id)}
                                        className={`group flex items-center gap-6 p-6 rounded-[2rem] border-2 transition-all duration-300 text-left
                      ${selections[step.id] === opt.id
                                                ? 'bg-indigo-50 border-indigo-600'
                                                : 'bg-surface border-transparent hover:border-indigo-100 hover:shadow-lg hover:-translate-y-1'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm
                      ${selections[step.id] === opt.id
                                                ? 'bg-indigo-600 text-white scale-110'
                                                : 'bg-background text-t-4 group-hover:bg-indigo-100 group-hover:text-indigo-600'}`}>
                                            {opt.icon}
                                        </div>
                                        <div>
                                            <h4 className={`font-black uppercase tracking-wider text-xs mb-1 ${selections[step.id] === opt.id ? 'text-indigo-700' : 'text-t-2'}`}>
                                                {opt.label}
                                            </h4>
                                            <p className="text-t-4 font-medium text-xs leading-none">{opt.desc}</p>
                                        </div>
                                        <ChevronRight className={`ml-auto w-5 h-5 transition-all duration-300 ${selections[step.id] === opt.id ? 'text-indigo-600 translate-x-1' : 'text-slate-200 group-hover:text-slate-300'}`} />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Aesthetic Bottom Footer */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-center opacity-0 md:opacity-100 transition-opacity">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-3 h-3" /> Secure AI Personalization
                </p>
            </div>

        </div>
    );
};
