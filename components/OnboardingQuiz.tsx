import React, { useState, useEffect } from 'react';
import {
    ChevronRight,
    Target,
    Trophy,
    Timer,
    GraduationCap,
    Briefcase,
    Globe,
    Zap,
    BookOpen,
    Bot,
    AudioLines,
    BrainCircuit,
    Lightbulb,
    Clock,
    Star,
    Pen,
    MessageSquare,
    BarChart
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
        sequence: 'INITIALIZATION',
        title: 'Enter your designation.',
        isInput: true,
        placeholder: 'e.g. Alex, Maria...',
        options: []
    },
    {
        id: 'goal',
        sequence: 'MISSION VECTOR',
        title: 'What is your primary objective?',
        options: [
            { id: 'ielts', label: 'IELTS Academic', icon: <Trophy className="w-5 h-5" />, desc: 'University admission & Band 8.0+' },
            { id: 'general', label: 'IELTS General', icon: <Star className="w-5 h-5" />, desc: 'Immigration & work permits' },
            { id: 'business', label: 'Business English', icon: <Briefcase className="w-5 h-5" />, desc: 'Corporate fluency & negotiations' },
            { id: 'academic', label: 'Academic Research', icon: <GraduationCap className="w-5 h-5" />, desc: 'Postgraduate-level comprehension' },
            { id: 'travel', label: 'Global Mobility', icon: <Globe className="w-5 h-5" />, desc: 'International travel & living' },
            { id: 'career', label: 'Career Advancement', icon: <BarChart className="w-5 h-5" />, desc: 'Professional certification & promotion' },
        ]
    },
    {
        id: 'targetBand',
        sequence: 'TARGET ACQUISITION',
        title: 'What IELTS band score are you aiming for?',
        options: [
            { id: '5.5', label: 'Band 5.5', icon: <div className="font-black text-sm">5.5</div>, desc: 'Community college / entry-level work' },
            { id: '6.5', label: 'Band 6.5', icon: <div className="font-black text-sm">6.5</div>, desc: 'Most universities & skilled migration' },
            { id: '7.0', label: 'Band 7.0', icon: <div className="font-black text-sm">7.0</div>, desc: 'Competitive programs & professional jobs' },
            { id: '7.5', label: 'Band 7.5', icon: <div className="font-black text-sm">7.5</div>, desc: 'Top universities & specialist occupations' },
            { id: '8.0', label: 'Band 8.0', icon: <div className="font-black text-sm">8.0</div>, desc: 'Elite institutions & senior professionals' },
            { id: '9.0', label: 'Band 9.0', icon: <div className="font-black text-sm">9.0</div>, desc: 'Native-level mastery — Expert user' },
        ]
    },
    {
        id: 'level',
        sequence: 'BASELINE CALIBRATION',
        title: 'What is your current English level?',
        options: [
            { id: 'a1', label: 'Beginner (A1-A2)', icon: <div className="font-black text-xs">A1</div>, desc: 'Basic words and phrases only' },
            { id: 'b1', label: 'Intermediate (B1)', icon: <div className="font-black text-xs">B1</div>, desc: 'Comfortable in everyday situations' },
            { id: 'b2', label: 'Upper-Intermediate (B2)', icon: <div className="font-black text-xs">B2</div>, desc: 'Fluent but with occasional errors' },
            { id: 'c1', label: 'Advanced (C1-C2)', icon: <div className="font-black text-xs">C1</div>, desc: 'Near-native, seeking perfection' },
        ]
    },
    {
        id: 'weakness',
        sequence: 'WEAKNESS DIAGNOSTICS',
        title: 'Where do you struggle most?',
        options: [
            { id: 'speaking', label: 'Speaking', icon: <AudioLines className="w-5 h-5" />, desc: 'Fluency, hesitation, pronunciation' },
            { id: 'writing', label: 'Writing', icon: <Pen className="w-5 h-5" />, desc: 'Task response, cohesion, grammar' },
            { id: 'listening', label: 'Listening', icon: <Zap className="w-5 h-5" />, desc: 'Fast speech, accents, note-taking' },
            { id: 'reading', label: 'Reading', icon: <BookOpen className="w-5 h-5" />, desc: 'Skimming speed, inference, vocab' },
        ]
    },
    {
        id: 'learning_style',
        sequence: 'LEARNING PROFILE',
        title: 'How do you learn best?',
        options: [
            { id: 'visual', label: 'Visual & Structured', icon: <BarChart className="w-5 h-5" />, desc: 'Charts, diagrams, written rules' },
            { id: 'audio', label: 'Audio & Conversational', icon: <AudioLines className="w-5 h-5" />, desc: 'Listening, repeating, speaking' },
            { id: 'practice', label: 'Practice-First', icon: <Zap className="w-5 h-5" />, desc: 'Jump in, learn from mistakes' },
            { id: 'analytical', label: 'Analytical & Deep', icon: <BrainCircuit className="w-5 h-5" />, desc: 'Understand grammar rules fully' },
        ]
    },
    {
        id: 'exam_date',
        sequence: 'TIMELINE LOCK',
        title: 'When is your exam or deadline?',
        options: [
            { id: 'under1month', label: 'Under 1 Month', icon: <Clock className="w-4 h-4" />, desc: 'Intensive sprint mode activated' },
            { id: '1to3months', label: '1 – 3 Months', icon: <Clock className="w-4 h-4" />, desc: 'Structured acceleration plan' },
            { id: '3to6months', label: '3 – 6 Months', icon: <Clock className="w-4 h-4" />, desc: 'Balanced deep-learning path' },
            { id: '6plus', label: '6+ Months', icon: <Clock className="w-4 h-4" />, desc: 'Long-term mastery program' },
            { id: 'nodate', label: 'No fixed date', icon: <Lightbulb className="w-4 h-4" />, desc: 'Self-paced lifelong learning' },
        ]
    },
    {
        id: 'context',
        sequence: 'ENVIRONMENT SCAN',
        title: 'What best describes your current situation?',
        options: [
            { id: 'student', label: 'Full-time Student', icon: <GraduationCap className="w-5 h-5" />, desc: 'Studying at school or university' },
            { id: 'working', label: 'Working Professional', icon: <Briefcase className="w-5 h-5" />, desc: 'Employed and studying part-time' },
            { id: 'selfpaced', label: 'Self-studying at Home', icon: <BookOpen className="w-5 h-5" />, desc: 'Full control of own schedule' },
            { id: 'retaker', label: 'IELTS Retaker', icon: <Trophy className="w-5 h-5" />, desc: 'Taken IELTS before, improving score' },
        ]
    },
    {
        id: 'motivation',
        sequence: 'DRIVE ANALYSIS',
        title: 'What motivates you most to improve?',
        options: [
            { id: 'university', label: 'University Admission', icon: <GraduationCap className="w-5 h-5" />, desc: 'Dream institution acceptance' },
            { id: 'migration', label: 'Migration / Visa', icon: <Globe className="w-5 h-5" />, desc: 'Moving abroad permanently' },
            { id: 'promotion', label: 'Career Promotion', icon: <BarChart className="w-5 h-5" />, desc: 'Advance in current career' },
            { id: 'confidence', label: 'Personal Confidence', icon: <Star className="w-5 h-5" />, desc: 'Speak with native-like ease' },
            { id: 'social', label: 'Daily Communication', icon: <MessageSquare className="w-5 h-5" />, desc: 'Connect better with people' },
        ]
    },
    {
        id: 'commitment',
        sequence: 'NEURAL SYNC DURATION',
        title: 'How much time can you dedicate daily?',
        options: [
            { id: '5', label: 'Micro-Burst (5m)', icon: <Timer className="w-4 h-4 opacity-40" />, desc: 'Tight schedule, minimal sessions' },
            { id: '15', label: 'Standard (15m)', icon: <Timer className="w-4 h-4" />, desc: 'Steady, compounded improvement' },
            { id: '30', label: 'Focused (30m)', icon: <Timer className="w-4 h-4 text-indigo-400" />, desc: 'Significant weekly progress' },
            { id: '60', label: 'Deep Work (60m+)', icon: <div className="relative"><Timer className="w-4 h-4" /><Zap className="absolute -top-1 -right-1 w-3 h-3 text-indigo-400" /></div>, desc: 'Maximum velocity to target band' },
        ]
    },
];

export const OnboardingQuiz: React.FC<OnboardingQuizProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [selections, setSelections] = useState<Record<string, string>>({});
    const [inputValue, setInputValue] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [analysisText, setAnalysisText] = useState('Initializing AI Core...');

    useEffect(() => {
        if (isProcessing) {
            const texts = [
                'Parsing your learning profile...',
                `Calibrating for ${selections.level?.toUpperCase() || 'B1'} baseline...`,
                `Targeting ${selections.weakness || 'writing'} deficiencies...`,
                `Aligning with ${selections.goal || 'IELTS'} objective...`,
                `Scheduling ${selections.exam_date || '3-month'} sprint program...`,
                `Estimating path to Band ${selections.targetBand || '7.0'}...`,
                'Generating hyper-optimized curriculum...',
                'Mapping cognitive learning patterns...',
                'Finalizing your personalized AI engine...',
                'System ready. Welcome.'
            ];

            let textIndex = 0;
            const textInterval = setInterval(() => {
                if (textIndex < texts.length) {
                    setAnalysisText(texts[textIndex]);
                    textIndex++;
                }
            }, 600);

            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(progressInterval);
                        clearInterval(textInterval);
                        setTimeout(() => {
                            const targetBandMap: Record<string, number> = {
                                'a1': 5.5,
                                'b1': 6.5,
                                'b2': 7.0,
                                'c1': 8.0
                            };
                            const commitmentMap: Record<string, number> = {
                                '5': 5, '15': 15, '30': 30, '60': 60
                            };
                            const parsedBand = parseFloat(selections.targetBand || '7');
                            onComplete({
                                name: selections.name || 'Agent',
                                goal: selections.goal || 'ielts',
                                level: selections.level || 'b1',
                                commitment: commitmentMap[selections.commitment] || 15,
                                targetBand: !isNaN(parsedBand) ? parsedBand : targetBandMap[selections.level] || 7
                            });
                        }, 1200);
                        return 100;
                    }
                    return prev + 1;
                });
            }, 55);

            return () => {
                clearInterval(progressInterval);
                clearInterval(textInterval);
            };
        }
    }, [isProcessing, selections, onComplete]);

    const handleNext = () => {
        if (steps[currentStep].isInput && !inputValue.trim()) return;
        const val = steps[currentStep].isInput ? inputValue.trim() : selections[steps[currentStep].id];
        const newSelections = { ...selections, [steps[currentStep].id]: val };
        setSelections(newSelections);

        if (currentStep < steps.length - 1) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 200);
        } else {
            setTimeout(() => setIsProcessing(true), 200);
        }
    };

    const handleSelect = (optionId: string) => {
        const newSelections = { ...selections, [steps[currentStep].id]: optionId };
        setSelections(newSelections);

        if (currentStep < steps.length - 1) {
            setTimeout(() => setCurrentStep(prev => prev + 1), 300);
        } else {
            setTimeout(() => setIsProcessing(true), 300);
        }
    };

    if (isProcessing) {
        return (
            <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6 z-50">
                <div className="relative max-w-lg w-full text-center space-y-12">
                    {/* Animated AI Core */}
                    <div className="relative w-44 h-44 mx-auto">
                        <div className="absolute inset-0 border border-indigo-200 rounded-full animate-[spin_4s_linear_infinite]" />
                        <div className="absolute inset-3 border-y border-indigo-400/40 rounded-full animate-[spin_3s_linear_infinite_reverse]" />
                        <div className="absolute inset-6 border-x border-violet-400/30 rounded-full animate-[spin_5s_linear_infinite]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Bot className="w-14 h-14 text-indigo-600 relative z-10" />
                            <div className="absolute w-14 h-14 bg-indigo-400/20 rounded-full blur-xl animate-pulse" />
                        </div>
                    </div>

                    <div className="space-y-3 font-mono">
                        <div className="text-2xl font-black text-t-1 tracking-tight">AI Engine Compiling</div>
                        <div className="h-6 flex items-center justify-center gap-2">
                            <span className="text-indigo-600 text-sm">{analysisText}</span>
                            <span className="w-2 h-4 bg-indigo-500 inline-block animate-pulse rounded-sm" />
                        </div>
                    </div>

                    <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden border border-sub-border">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 transition-all duration-75 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="text-t-4 text-xs font-mono">{progress}% / 100%</div>
                </div>
            </div>
        );
    }

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6 z-50 overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-indigo-500/5 rounded-full blur-[120px] -mr-96 -mt-96 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px] -ml-64 -mb-64 pointer-events-none" />

            <div className="max-w-3xl w-full relative z-10 flex flex-col items-center gap-10 animate-in fade-in slide-in-from-bottom-8 duration-500">

                {/* Progress header */}
                <div className="w-full space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-1.5">
                            {steps.map((_, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1 rounded-full transition-all duration-500 ${idx === currentStep ? 'w-8 bg-indigo-500' : idx < currentStep ? 'w-3 bg-indigo-300' : 'w-3 bg-surface-2'}`}
                                />
                            ))}
                        </div>
                        <span className="text-[10px] font-black text-t-3 uppercase tracking-widest font-mono">
                            {currentStep + 1} / {steps.length}
                        </span>
                    </div>

                    <div className="text-center space-y-2">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] font-mono">{step.sequence}</span>
                        <h1 className="text-3xl md:text-4xl font-black text-t-1 tracking-tight leading-tight">
                            {step.title}
                        </h1>
                    </div>
                </div>

                {/* Question Content */}
                <div className="w-full">
                    {step.isInput ? (
                        <div className="space-y-4 max-w-md mx-auto">
                            <input
                                autoFocus
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                                placeholder={step.placeholder}
                                className="w-full bg-surface border border-sub-border focus:border-indigo-400 rounded-xl px-6 py-4 text-xl font-black text-t-1 outline-none transition-all placeholder:text-t-4 placeholder:font-medium text-center shadow-sm"
                            />
                            <button
                                onClick={handleNext}
                                disabled={!inputValue.trim()}
                                className="w-full bg-indigo-600 disabled:bg-surface-2 disabled:text-t-4 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                            >
                                Continue <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className={`grid gap-3 ${step.options.length <= 4 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
                            {step.options.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => handleSelect(opt.id)}
                                    className={`group flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 text-left
                      ${selections[step.id] === opt.id
                                            ? 'bg-indigo-50 border-indigo-400 shadow-lg shadow-indigo-100'
                                            : 'bg-surface border-sub-border hover:border-indigo-300 hover:bg-indigo-50/50 hover:-translate-y-0.5'}`}
                                >
                                    <div className={`flex-none w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                      ${selections[step.id] === opt.id
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300'
                                            : 'bg-background text-t-3 border border-sub-border group-hover:text-indigo-500 group-hover:border-indigo-200'}`}>
                                        {opt.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className={`font-black text-sm leading-tight ${selections[step.id] === opt.id ? 'text-indigo-700' : 'text-t-1'}`}>
                                            {opt.label}
                                        </h4>
                                        <p className="text-t-4 font-medium text-xs mt-0.5 truncate">{opt.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                <p className="text-[10px] font-black text-t-4 uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-3 h-3" /> Engldom Intelligence Engine
                </p>
            </div>
        </div>
    );
};
