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
    CheckCircle2,
    Globe,
    Zap,
    Users,
    ShieldCheck,
    ArrowUpRight
} from 'lucide-react';

interface LandingPageProps {
    onStart: () => void;
}

const Navbar = ({ onJoin }: { onJoin: () => void }) => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-6 inset-x-6 z-[100] transition-all duration-500 max-w-7xl mx-auto
      ${isScrolled ? 'top-4' : 'top-6'}`}>
            <div className={`flex items-center justify-between px-8 py-4 rounded-2xl border transition-all duration-300
        ${isScrolled
                    ? 'bg-white border-slate-200 shadow-sm'
                    : 'bg-transparent border-transparent'}`}>

                {/* Logo */}
                <div className="flex items-center gap-2 group cursor-pointer" onClick={onJoin}>
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform overflow-hidden p-1.5 border border-slate-100">
                        <img src="/assets/logo.png" alt="Engldom Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xl font-black text-slate-800 tracking-tighter uppercase italic">Engldom</span>
                </div>

                {/* Links */}
                <div className="hidden md:flex items-center gap-10">
                    {['Features', 'Tutors', 'Pricing', 'FAQ'].map((link) => (
                        <a key={link} href={`#${link.toLowerCase()}`} className="text-sm font-black text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-[0.15em]">
                            {link}
                        </a>
                    ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-4">
                    <button className="text-sm font-black text-slate-700 hover:text-indigo-600 px-4 transition-colors uppercase tracking-[0.1em]">Login</button>
                    <button
                        onClick={onJoin}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-[0.2em] px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-100 transition-all hover:-translate-y-1 active:scale-95">
                        Join Now
                    </button>
                </div>
            </div>
        </nav>
    );
};

const FeatureCard = ({ icon, title, desc, className = '' }: { icon: React.ReactNode, title: string, desc: string, className?: string }) => (
    <div className={`group relative bg-white border border-slate-200 p-10 rounded-3xl shadow-sm transition-all duration-300 hover:border-indigo-200 hover:shadow-md ${className}`}>
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
            {icon}
        </div>
        <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight leading-none">{title}</h3>
        <p className="text-slate-600 font-medium text-lg leading-relaxed">{desc}</p>
    </div>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    return (
        <div className="min-h-screen bg-slate-50 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
            <Navbar onJoin={onStart} />

            {/* Hero Section */}
            <section className="relative pt-48 pb-32 px-6 max-w-7xl mx-auto text-center">
                {/* Background Pattern */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none opacity-[0.03]">
                    <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:40px_40px]" />
                </div>

                <div className="relative z-10 space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
                    <div className="inline-flex items-center gap-3 bg-white px-6 py-2 rounded-full border border-slate-200 shadow-sm mx-auto">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-[0.2em]">The Modern Way to Mastery</span>
                    </div>

                    <h1 className="font-display text-7xl md:text-8xl lg:text-[8rem] font-black text-slate-900 tracking-tight leading-[0.9] max-w-5xl mx-auto">
                        English mastery <br className="hidden md:block" />
                        <span className="text-indigo-600">Built for speed.</span>
                    </h1>

                    <p className="max-w-xl mx-auto text-xl font-medium text-slate-500 leading-relaxed pt-4">
                        The elite AI platform for IELTS. High-density learning designed for professional results.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
                        <button
                            onClick={onStart}
                            className="bg-slate-900 active-scale text-white font-bold text-sm uppercase tracking-widest px-10 py-5 rounded-xl shadow-lg transition-all hover:bg-slate-800">
                            Get Started Now
                        </button>
                        <button className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors uppercase tracking-[0.1em] text-xs">
                            View Documentation <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* App Preview Simulation */}
                    <div className="mt-24 relative max-w-5xl mx-auto">
                        <div className="aspect-[16/9] bg-white border border-slate-200 rounded-2xl shadow-ambient overflow-hidden p-4 group">
                            <div className="w-full h-full bg-slate-50 rounded-lg border border-slate-100 p-8 text-left space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-red-400 rounded-full" />
                                        <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                                        <div className="w-3 h-3 bg-green-400 rounded-full" />
                                    </div>
                                    <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
                                </div>
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="h-32 bg-slate-200 rounded-xl animate-pulse" />
                                    <div className="h-32 bg-slate-200 rounded-xl animate-pulse delay-100" />
                                    <div className="h-32 bg-slate-200 rounded-xl animate-pulse delay-200" />
                                </div>
                                <div className="h-64 bg-slate-200 rounded-xl animate-pulse delay-300" />
                            </div>
                        </div>
                        {/* Decorative shadow glow */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[80%] h-20 bg-indigo-500/10 blur-[100px] pointer-events-none" />
                    </div>

                    {/* User Faces / Trust */}
                    <div className="pt-12 flex flex-col items-center gap-4">
                        <div className="flex -space-x-4">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-4 border-slate-50 bg-slate-200 overflow-hidden ring-2 ring-indigo-50">
                                    <img src={`https://i.pravatar.cc/100?u=engldom${i}`} alt="user" className="w-full h-full object-cover" />
                                </div>
                            ))}
                            <div className="w-12 h-12 rounded-full border-4 border-slate-50 bg-indigo-600 flex items-center justify-center text-white text-[10px] font-black">
                                +42k
                            </div>
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Trusted by students at Oxford, MIT, and Stanford</p>
                    </div>
                </div>
            </section>

            {/* Grid Features */}
            <section id="features" className="py-32 px-6 max-w-7xl mx-auto relative">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Target className="w-10 h-10" />}
                        title="IELTS Strategy"
                        desc="Master every section with examiners' logic. From complex grammar to perfect pronunciation."
                    />
                    <FeatureCard
                        icon={<Zap className="w-10 h-10" />}
                        title="AI Speed-Learning"
                        desc="Learn 5x faster with adaptive repetition. We target your weak spots until they become strengths."
                        className="md:translate-y-12"
                    />
                    <FeatureCard
                        icon={<Globe className="w-10 h-10" />}
                        title="Real Conversations"
                        desc="Talk to AI that sounds human. Practice anytime, anywhere, without the fear of judgment."
                    />
                </div>
            </section>

            {/* By the Numbers */}
            <section className="bg-white py-32 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.4em]">Engldom by Numbers</span>
                            <h2 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-none">
                                More confident, <br />
                                more expressive.
                            </h2>
                        </div>
                        <p className="text-xl font-bold text-slate-500 leading-relaxed max-w-md">
                            Our data shows that 10 minutes a day on Engldom is more effective than a monthly offline course.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                            { label: 'More Confident', val: '92%', icon: <Users className="w-5 h-5" />, color: 'bg-indigo-50 text-indigo-600' },
                            { label: 'Faster Progress', val: '5x', icon: <Zap className="w-5 h-5" />, color: 'bg-rose-50 text-rose-600' },
                            { label: 'Task Accuracy', val: '96%', icon: <Target className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
                            { label: 'Vocabulary Size', val: '+2.4k', icon: <Sparkles className="w-5 h-5" />, color: 'bg-amber-50 text-amber-600' },
                        ].map((stat, i) => (
                            <div key={i} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 space-y-4 hover:shadow-xl transition-shadow group">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                                    {stat.icon}
                                </div>
                                <div className="space-y-1">
                                    <div className="text-4xl font-black text-slate-900 tracking-tighter">{stat.val}</div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Footer */}
            <section className="py-32 px-6">
                <div className="max-w-5xl mx-auto relative group">
                    {/* Luminous Glow */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 rounded-[4rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />

                    <div className="relative bg-slate-900 overflow-hidden rounded-[4rem] p-16 md:p-24 text-center space-y-12 border border-slate-800">
                        {/* Background Texture */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#4f46e5_0,transparent_50%)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,#ec4899_0,transparent_50%)]" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-none">
                                Build your future <br />
                                <span className="text-indigo-400">Step by Step.</span>
                            </h2>
                            <p className="text-slate-400 font-bold text-xl max-w-xl mx-auto">
                                Join 42,000+ members mastering English with the power of personalized AI.
                            </p>
                        </div>

                        <div className="relative z-10">
                            <button
                                onClick={onStart}
                                className="bg-white text-slate-900 font-bold text-sm uppercase tracking-widest px-14 py-6 rounded-2xl shadow-xl transition-all hover:bg-slate-50 active:scale-95">
                                Start Learning Now
                            </button>
                        </div>

                        <div className="relative z-10 pt-4 flex items-center justify-center gap-6 text-slate-500">
                            <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> <span className="text-[10px] font-black uppercase tracking-widest">No Card Required</span></div>
                            <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> <span className="text-[10px] font-black uppercase tracking-widest">Cancel Anytime</span></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Real Footer */}
            <footer className="py-20 px-6 border-t border-slate-200/60 text-center space-y-8">
                <div className="flex items-center justify-center gap-2 grayscale brightness-50 opacity-50">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center p-1 border border-slate-200">
                        <img src="/assets/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-sm font-black text-slate-900 tracking-tighter uppercase italic">Engldom</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                    © 2026 Engldom AI Language Engine. All Rights Reserved.
                </p>
            </footer>

        </div>
    );
};
