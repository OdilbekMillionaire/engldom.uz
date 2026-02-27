
import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen, PenTool, Headphones, Mic, BarChart2, BookMarked,
  Library, Clock, Scale, Search, Command, ArrowRight, CornerDownLeft,
  Hash, FileText, X, PanelLeftClose, PanelLeftOpen,
  GraduationCap, Settings, User, CalendarDays, Gamepad2
} from 'lucide-react';

import { LevelBadge } from './ui/LevelBadge';
import { ModuleType } from '../types';
import { storageService } from '../services/storageService';
import { gamificationService, getLevel } from '../services/gamificationService';
import { Menu, X as LucideX, Flame } from 'lucide-react';

interface LayoutProps {
  currentModule: ModuleType;
  onModuleChange: (m: ModuleType) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentModule, onModuleChange, children }) => {
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // User settings – load once on mount and whenever module changes to SETTINGS
  const [userSettings, setUserSettings] = useState(() => storageService.getSettings());

  useEffect(() => {
    const s = storageService.getSettings();
    setUserSettings(s);
  }, [currentModule]); // re-read after visiting Settings

  const navItems = [
    { id: ModuleType.DASHBOARD, icon: BarChart2, label: 'Dashboard' },
    { id: ModuleType.HISTORY, icon: Clock, label: 'History' },
    { type: 'divider' },
    { id: ModuleType.STUDY_PLAN, icon: CalendarDays, label: 'Study Plan', badge: '✨' },
    { id: ModuleType.GAMES, icon: Gamepad2, label: 'Vocab Games', badge: '🎮' },
    { type: 'divider' },
    { id: ModuleType.LIBRARY, icon: GraduationCap, label: 'Study Center' },
    { type: 'divider' },
    { id: ModuleType.READING, icon: BookOpen, label: 'Reading' },
    { id: ModuleType.WRITING, icon: PenTool, label: 'Writing' },
    { id: ModuleType.LISTENING, icon: Headphones, label: 'Listening' },
    { id: ModuleType.SPEAKING, icon: Mic, label: 'Speaking' },
    { type: 'divider' },
    { id: ModuleType.GRAMMAR, icon: Scale, label: 'Grammar Lab' },
    { id: ModuleType.VOCABULARY, icon: BookMarked, label: 'Vocab Generator' },
    { id: ModuleType.VAULT, icon: Library, label: 'My Vault' },
  ];


  // Keyboard Shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCmdOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsCmdOpen(false);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search Logic
  useEffect(() => {
    if (!isCmdOpen) {
      setSearchQuery('');
      setSearchResults([]);
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 100);

    const q = searchQuery.toLowerCase();
    const results: any[] = [];

    navItems.forEach(item => {
      if (item.type !== 'divider' && item.label && item.label.toLowerCase().includes(q)) {
        results.push({ type: 'nav', ...item });
      }
    });

    const words = storageService.getWords();
    words.forEach(w => {
      if (w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)) {
        results.push({ type: 'word', ...w });
      }
    });

    const history = storageService.getProgress();
    history.slice(0, 10).forEach(h => {
      if (h.label.toLowerCase().includes(q)) {
        results.push({ type: 'history', ...h });
      }
    });

    setSearchResults(results.slice(0, 8));
    setActiveIndex(0);
  }, [searchQuery, isCmdOpen]);

  const handleSelect = (item: any) => {
    if (item.type === 'nav') {
      onModuleChange(item.id);
    } else if (item.type === 'word') {
      onModuleChange(ModuleType.VAULT);
    } else if (item.type === 'history') {
      onModuleChange(ModuleType.HISTORY);
    }
    setIsCmdOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[activeIndex]) {
        handleSelect(searchResults[activeIndex]);
      }
    }
  };

  const moduleTitle = () => {
    switch (currentModule) {
      case ModuleType.VAULT: return 'My Vault';
      case ModuleType.HISTORY: return 'Activity History';
      case ModuleType.GRAMMAR: return 'Grammar Laboratory';
      case ModuleType.LIBRARY: return 'Study Center';
      case ModuleType.SETTINGS: return 'Settings & Profile';
      case ModuleType.STUDY_PLAN: return '✨ AI Study Plan';
      case ModuleType.GAMES: return '🎮 Vocabulary Games';
      default: return `${currentModule.charAt(0).toUpperCase() + currentModule.slice(1)} Module`;
    }
  };


  return (
    <div className="min-h-screen bg-background text-t-1 font-sans overflow-x-hidden">
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/80 z-[45] lg:hidden transition-opacity duration-300"
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col z-50 transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0 w-64 shadow-2xl' : 'lg:translate-x-0 -translate-x-full lg:w-20'
          } ${!isMobileMenuOpen && !isSidebarCollapsed ? 'lg:w-64' : 'lg:w-20'}`}
      >
        {/* Logo */}
        <div className={`flex items-center gap-3 border-b border-slate-800 transition-all duration-300 ${isSidebarCollapsed ? 'p-4 justify-center' : 'p-6'}`}>
          <div className="w-10 h-10 bg-surface rounded-xl flex-none flex items-center justify-center shadow-lg shadow-indigo-900/50 p-1.5">
            <img src="/assets/logo.png" alt="Dragon" className="w-full h-full object-contain" />
          </div>
          <span className="font-display font-black text-xl tracking-tight text-white whitespace-nowrap overflow-hidden transition-all duration-300">
            ENGLDOM
          </span>
        </div>

        {/* User profile mini-card */}
        {!isSidebarCollapsed && (userSettings.displayName || userSettings.avatarDataUrl) && (
          <button
            onClick={() => onModuleChange(ModuleType.SETTINGS)}
            className="flex items-center gap-3 px-4 py-3 border-b border-slate-800 hover:bg-slate-800 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center flex-shrink-0">
              {userSettings.avatarDataUrl
                ? <img src={userSettings.avatarDataUrl} alt="avatar" className="w-full h-full object-cover" />
                : <User className="w-4 h-4 text-t-4" />
              }
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white truncate">{userSettings.displayName || 'My Profile'}</div>
              <div className="text-xs text-t-4">Target Band {userSettings.targetBand}</div>
            </div>
          </button>
        )}

        {/* Nav items */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item, idx) => (
            item.type === 'divider' ? (
              <div key={`div-${idx}`} className="h-px bg-slate-800 my-4 mx-2"></div>
            ) : (
              <button
                key={item.id}
                onClick={() => { onModuleChange(item.id as ModuleType); setIsMobileMenuOpen(false); }}
                title={isSidebarCollapsed && !isMobileMenuOpen ? item.label : ''}
                className={`group w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 active:scale-95 ${currentModule === item.id
                  ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                  } ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : ''}`}
              >
                {item.icon && <item.icon className={`w-5 h-5 flex-shrink-0 transition-transform ${currentModule === item.id ? 'scale-110' : 'group-hover:scale-110'}`} />}
                <span className={`font-medium truncate transition-all duration-300 ${isSidebarCollapsed && !isMobileMenuOpen ? 'w-0 hidden' : 'block'}`}>
                  {item.label}
                </span>
                {(!isSidebarCollapsed || isMobileMenuOpen) && (item as any).badge && (
                  <span className="ml-auto text-[10px] bg-slate-800 px-1.5 py-0.5 rounded-full border border-slate-700">{(item as any).badge}</span>
                )}
              </button>
            )
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2 bg-slate-900">
          {(!isSidebarCollapsed || isMobileMenuOpen) && (
            <button
              onClick={() => { setIsCmdOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full bg-slate-800 hover:bg-slate-700 text-t-4 hover:text-white py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition-all mb-1 border border-slate-700/50"
            >
              <span className="flex items-center gap-2"><Search className="w-3 h-3" /> Quick Find</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700">⌘K</span>
            </button>
          )}

          {/* Gamification Bar */}
          {(!isSidebarCollapsed || isMobileMenuOpen) && (
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 mb-2 space-y-2 group transition-colors">
              <div className="flex justify-between items-center text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                <span>LVL {getLevel(gamificationService.getData().xp).level}</span>
                <span className="flex items-center gap-1 bg-orange-500/10 px-1.5 py-0.5 rounded text-orange-400">
                  <Flame className="w-3 h-3" /> {storageService.getStreak().current}
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all duration-1000 ease-out shadow-lg"
                  style={{ width: `${getLevel(gamificationService.getData().xp).progressPercent}%` }}
                />
              </div>
              <div className="text-[10px] text-t-3 font-bold text-center tracking-tight">
                {gamificationService.getData().xp.toLocaleString()} TOTAL XP
              </div>
            </div>
          )}

          {/* XP Level badge row */}
          <div className={`flex items-center ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : 'gap-2 px-1 py-1'}`}>
            <LevelBadge size={isSidebarCollapsed && !isMobileMenuOpen ? 40 : 36} showLabel={!isSidebarCollapsed || isMobileMenuOpen} />
          </div>

          {/* Settings button */}
          <button
            onClick={() => { onModuleChange(ModuleType.SETTINGS); setIsMobileMenuOpen(false); }}
            title={isSidebarCollapsed && !isMobileMenuOpen ? 'Settings' : ''}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${currentModule === ModuleType.SETTINGS
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
              : 'text-t-4 hover:text-indigo-300 hover:bg-slate-800'
              } ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : ''}`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className={`font-medium text-sm transition-all duration-300 ${isSidebarCollapsed && !isMobileMenuOpen ? 'w-0 hidden' : 'block'}`}>Settings</span>
          </button>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-lg text-t-3 hover:bg-slate-800 hover:text-white transition-colors"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`min-h-screen transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          } pl-0`}
      >
        <header className="h-16 bg-surface border-b border-base-border flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 hover:bg-surface-2 rounded-lg text-t-2 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="font-bold text-t-1 capitalize flex items-center gap-2">
              {moduleTitle()}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsCmdOpen(true)} className="p-2 text-t-4 hover:text-t-2 transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {/* Gamification chips in header */}
            <div className="hidden sm:flex items-center gap-3 border-l border-sub-border pl-4 h-6">
              <div className="flex items-center gap-1.5 text-xs font-black">
                <span className="text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shadow-sm">{gamificationService.getData().xp.toLocaleString()} XP</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg border border-orange-100 shadow-sm">
                <Flame className="w-4 h-4" />
                <span>{storageService.getStreak().current}</span>
              </div>
            </div>

            {/* Avatar in header */}
            {userSettings.avatarDataUrl && (
              <button onClick={() => onModuleChange(ModuleType.SETTINGS)} className="w-9 h-9 rounded-full overflow-hidden border-2 border-indigo-100 shadow-sm flex-shrink-0 hover:border-indigo-400 transition-all hover:scale-105">
                <img src={userSettings.avatarDataUrl} alt="avatar" className="w-full h-full object-cover" />
              </button>
            )}

            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 shadow-inner">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">AI Online</span>
            </div>
          </div>
        </header>
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Command Palette Modal */}
      {isCmdOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-start justify-center pt-[20vh] px-4">
          <div className="w-full max-w-xl bg-surface rounded-2xl shadow-2xl overflow-hidden border border-base-border">
            <div className="p-4 border-b border-sub-border flex items-center gap-3">
              <Command className="w-5 h-5 text-t-4" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command or search..."
                className="flex-1 text-lg outline-none text-t-1 placeholder:text-t-4 bg-transparent"
              />
              <button onClick={() => setIsCmdOpen(false)} className="text-t-4 hover:text-t-2"><X className="w-5 h-5" /></button>
            </div>
            <div className="max-h-[300px] overflow-y-auto p-2">
              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-t-4 text-sm">
                  No results found. Try "Writing", "History", or a saved word.
                </div>
              ) : (
                searchResults.map((result, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelect(result)}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between group transition-colors ${i === activeIndex ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-background text-t-2'}`}
                  >
                    <div className="flex items-center gap-3">
                      {result.type === 'nav' && <CornerDownLeft className="w-4 h-4 text-t-4 group-hover:text-indigo-500" />}
                      {result.type === 'word' && <Hash className="w-4 h-4 text-t-4 group-hover:text-pink-500" />}
                      {result.type === 'history' && <FileText className="w-4 h-4 text-t-4 group-hover:text-emerald-500" />}
                      <div>
                        <div className="font-bold text-sm">
                          {result.type === 'word' ? result.word : result.label}
                        </div>
                        {result.type === 'word' && <div className="text-xs text-t-4 truncate max-w-[200px]">{result.meaning}</div>}
                      </div>
                    </div>
                    {i === activeIndex && <ArrowRight className="w-4 h-4 text-indigo-500" />}
                  </button>
                ))
              )}
            </div>
            <div className="bg-background px-4 py-2 border-t border-sub-border flex justify-between items-center text-[10px] text-t-4 font-bold uppercase tracking-wider">
              <span>↑↓ Navigate · Enter Select</span>
              <span>EnglDom v1.1</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
