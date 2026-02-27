import React, { useState, useEffect } from 'react';
import {
    ChevronRight,
    Globe,
    Zap,
    Users,
    ArrowUpRight,
    TrendingUp,
    BrainCircuit,
    Cpu,
    MessagesSquare
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
        <nav className={`fixed top-0 inset-x-0 z-[100] transition-all duration-500
      ${isScrolled ? 'bg-surface/80 backdrop-blur-xl border-b border-sub-border py-4' : 'bg-transparent py-6'}`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={onJoin}>
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)] group-hover:scale-110 transition-transform overflow-hidden p-1.5 border border-indigo-400/30 text-white">
                        <Cpu className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-black text-t-1 tracking-tighter uppercase italic">Engldom Engine</span>
                </div>

                <div className="hidden md:flex items-center gap-8">
                    {['Architecture', 'Intelligence', 'Results'].map((link) => (
                        <a key={link} href={`#${link.toLowerCase()}`} className="text-xs font-black text-t-4 hover:text-indigo-600 transition-colors uppercase tracking-[0.2em]">
                            {link}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-6">
                    <button className="text-xs font-black text-t-2 hover:text-t-1 transition-colors uppercase tracking-[0.1em] hidden sm:block">Sign In</button>
                    <button
                        onClick={onJoin}
                        className="bg-t-1 hover:bg-t-2 text-background font-black text-xs uppercase tracking-[0.2em] px-8 py-3.5 rounded-full shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2">
                        Initialize <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    return (
        <div className="min-h-screen bg-background overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
            <Navbar onJoin={onStart} />

            {/* Hero Section */}
            <section className="relative pt-48 pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
                {/* Orbital Background Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20 pointer-events-none">
                    <div className="absolute inset-0 rounded-full border border-slate-700/50 [mask-image:linear-gradient(transparent,black)] animate-[spin_60s_linear_infinite]" />
                    <div className="absolute inset-10 rounded-full border border-slate-700/30 [mask-image:linear-gradient(black,transparent)] animate-[spin_40s_linear_infinite_reverse]" />
                </div>
                <div className="absolute top-20 right-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-20 left-20 w-96 h-96 bg-rose-600/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 space-y-10 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000">
                    <div className="inline-flex items-center gap-3 bg-surface border border-sub-border px-4 py-2 rounded-full shadow-sm mx-auto">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                        <span className="text-[10px] font-black text-t-2 uppercase tracking-[0.2em]">v2.0 Architecture Live</span>
                    </div>

                    <h1 className="font-display text-6xl md:text-8xl lg:text-[7rem] font-black text-t-1 tracking-tighter leading-[0.95] max-w-5xl mx-auto">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-500">Hyper-optimized</span>
                        <br /> IELTS Mastery.
                    </h1>

                    <p className="max-w-2xl mx-auto text-xl font-medium text-t-3 leading-relaxed">
                        Engldom replaces static textbooks with a neural engine that maps your exact weaknesses and mathematically optimizes your path to Band 8.0+.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
                        <button
                            onClick={onStart}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest px-12 py-5 rounded-full shadow-[0_0_40px_rgba(79,70,229,0.4)] transition-all hover:scale-105 active:scale-95 group flex items-center gap-3">
                            <Zap className="w-5 h-5 text-indigo-200 group-hover:text-white transition-colors" />
                            Deploy Personal AI
                        </button>
                        <button className="flex items-center gap-2 text-t-3 font-bold hover:text-t-1 transition-colors uppercase tracking-[0.1em] text-xs">
                            Read Architecture <ArrowUpRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Dashboard Preview Abstract */}
                    <div className="mt-28 relative max-w-6xl mx-auto w-full group perspective-1000">
                        <div className="relative transform-gpu transition-all duration-700 hover:rotate-x-2">
                            <div className="absolute -inset-1 bg-gradient-to-b from-indigo-500/20 to-transparent rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
                            <div className="relative bg-surface/50 backdrop-blur-3xl border border-sub-border rounded-[2rem] p-4 shadow-2xl overflow-hidden aspect-video flex flex-col">
                                {/* Fake UI Header */}
                                <div className="flex items-center gap-2 pb-4 border-b border-sub-border/50">
                                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                                    <div className="w-3 h-3 rounded-full bg-slate-700" />
                                </div>
                                {/* Fake UI Body */}
                                <div className="flex-1 grid grid-cols-12 gap-4 mt-4 h-full">
                                    <div className="col-span-3 bg-white/5 rounded-xl border border-white/5" />
                                    <div className="col-span-9 grid grid-rows-3 gap-4">
                                        <div className="row-span-2 grid grid-cols-2 gap-4">
                                            <div className="bg-white/5 rounded-xl border border-white/5 relative overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent" />
                                            </div>
                                            <div className="bg-white/5 rounded-xl border border-white/5" />
                                        </div>
                                        <div className="bg-white/5 rounded-xl border border-white/5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Bento Grid Features */}
            <section id="architecture" className="py-32 px-6 max-w-7xl mx-auto space-y-20">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-5xl font-black text-t-1 tracking-tight">System Architecture</h2>
                    <p className="text-t-3 font-medium text-lg max-w-2xl mx-auto">Engineered specifically for cognitive retention and test-day precision.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
                    <div className="md:col-span-2 bg-surface border border-sub-border rounded-[2rem] p-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors" />
                        <div className="relative z-10 w-16 h-16 bg-background rounded-2xl flex items-center justify-center border border-sub-border mb-8 shadow-inner">
                            <BrainCircuit className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h3 className="text-3xl font-black text-t-1 mb-4">Neural Personalization</h3>
                        <p className="text-t-3 font-medium text-lg max-w-md">Our algorithm analyzes your specific error patterns and dynamically generates practice material targeting your highest-leverage weaknesses.</p>
                    </div>
                    <div className="bg-surface border border-sub-border rounded-[2rem] p-10 relative overflow-hidden group">
                        <div className="relative z-10 w-16 h-16 bg-background rounded-2xl flex items-center justify-center border border-sub-border mb-8">
                            <TrendingUp className="w-8 h-8 text-rose-400" />
                        </div>
                        <h3 className="text-3xl font-black text-t-1 mb-4">Data-Driven Routing</h3>
                        <p className="text-t-3 font-medium text-lg">Tracks your trajectory against 10,000+ past successful Band 8.0 candidates.</p>
                    </div>
                    <div className="bg-surface border border-sub-border rounded-[2rem] p-10 relative overflow-hidden group">
                        <div className="relative z-10 w-16 h-16 bg-background rounded-2xl flex items-center justify-center border border-sub-border mb-8">
                            <Globe className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-3xl font-black text-t-1 mb-4">Examiner Standard</h3>
                        <p className="text-t-3 font-medium text-lg">Trained strictly on Cambridge rubrics for ruthless, objective grading.</p>
                    </div>
                    <div className="md:col-span-2 bg-surface border border-sub-border rounded-[2rem] p-10 relative overflow-hidden group">
                        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-background/50 to-transparent" />
                        <div className="relative z-10 w-16 h-16 bg-background rounded-2xl flex items-center justify-center border border-sub-border mb-8">
                            <MessagesSquare className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-3xl font-black text-t-1 mb-4">Real-time Conversational Tutor</h3>
                        <p className="text-t-3 font-medium text-lg max-w-sm">Not just exercises. Engage in unscripted, highly-contextual debates and speaking simulations with an AI that mimics native examiners.</p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-32 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="relative bg-surface border-y border-sub-border py-24 text-center">
                        <div className="absolute inset-0 bg-background/50" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.1)_0,transparent_100%)]" />

                        <div className="relative z-10 space-y-8">
                            <h2 className="text-5xl md:text-6xl font-black text-t-1 tracking-tighter">
                                Begin Sequence.
                            </h2>
                            <p className="text-t-3 font-medium text-xl max-w-md mx-auto">
                                The intelligence layer for your language acquisition.
                            </p>
                            <button
                                onClick={onStart}
                                className="bg-t-1 text-background font-black text-sm uppercase tracking-widest px-14 py-6 rounded-full shadow-2xl transition-all hover:bg-t-2 active:scale-95 inline-flex items-center gap-3">
                                Initialize Matrix <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-12 px-6 border-t border-sub-border/50 text-center text-t-4 text-xs font-bold uppercase tracking-widest bg-background">
                <p>© 2026 Engldom System. All Rights Reserved.</p>
            </footer>
        </div>
    );
};
