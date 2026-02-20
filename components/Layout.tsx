
import React, { useState, useEffect, useRef } from 'react';
import { 
    BookOpen, PenTool, Headphones, Mic, BarChart2, BookMarked, 
    Library, Clock, Scale, Search, Command, ArrowRight, CornerDownLeft, 
    Hash, FileText, X, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen,
    GraduationCap
} from 'lucide-react';
import { ModuleType } from '../types';
import { storageService } from '../services/storageService';

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
  const inputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { id: ModuleType.DASHBOARD, icon: BarChart2, label: 'Dashboard' },
    { id: ModuleType.HISTORY, icon: Clock, label: 'History' },
    { type: 'divider' },
    { id: ModuleType.LIBRARY, icon: GraduationCap, label: 'Study Center' }, // New Static Module
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
      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100);

      const q = searchQuery.toLowerCase();
      const results = [];

      // 1. Navigation
      navItems.forEach(item => {
          if (item.type !== 'divider' && item.label && item.label.toLowerCase().includes(q)) {
              results.push({ type: 'nav', ...item });
          }
      });

      // 2. Vault Words
      const words = storageService.getWords();
      words.forEach(w => {
          if (w.word.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)) {
              results.push({ type: 'word', ...w });
          }
      });

      // 3. History
      const history = storageService.getProgress();
      history.slice(0, 10).forEach(h => {
          if (h.label.toLowerCase().includes(q)) {
              results.push({ type: 'history', ...h });
          }
      });

      setSearchResults(results.slice(0, 8)); // Limit results
      setActiveIndex(0);

  }, [searchQuery, isCmdOpen]);

  const handleSelect = (item: any) => {
      if (item.type === 'nav') {
          onModuleChange(item.id);
      } else if (item.type === 'word') {
          onModuleChange(ModuleType.VAULT);
          // Ideally we would pass a query param to open the word, but keeping it simple
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <aside 
        className={`fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col z-50 transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`flex items-center gap-3 border-b border-slate-800 transition-all duration-300 ${isSidebarCollapsed ? 'p-4 justify-center' : 'p-6'}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex-none flex items-center justify-center shadow-lg shadow-indigo-900/50">
             {/* Custom Dragon Logo */}
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                <path d="M18 10c0-2.2-1.8-4-4-4-1 0-2 .5-2.5 1.5-.5-1-1.5-1.5-2.5-1.5-2.2 0-4 1.8-4 4 0 1.5.8 2.8 2 3.5-1.5 1-2.5 2.5-2.5 4.5 0 2.2 1.8 4 4 4 1.5 0 2.8-.8 3.5-2 1.2 0 2.5-1.3 3.5-2.5.8.5 1.8 1 3 1 2 0 3.5-1.5 3.5-3.5 0-2.2-1.8-4-4-4z" />
                <path d="M15 10c0-1.1-.9-2-2-2" />
                <path d="M12 2v4" />
                <path d="M19 5l-2 2" />
                <path d="M5 5l2 2" />
                <circle cx="10.5" cy="10.5" r="1" fill="currentColor" />
                <circle cx="15.5" cy="10.5" r="1" fill="currentColor" />
             </svg>
          </div>
          <span className={`font-bold text-xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent whitespace-nowrap overflow-hidden transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
              ENGLDOM
          </span>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item, idx) => (
            item.type === 'divider' ? (
                <div key={`div-${idx}`} className="h-px bg-slate-800 my-4 mx-2"></div>
            ) : (
                <button
                key={item.id}
                onClick={() => onModuleChange(item.id as ModuleType)}
                title={isSidebarCollapsed ? item.label : ''}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                    currentModule === item.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                >
                {item.icon && <item.icon className="w-5 h-5 flex-shrink-0" />}
                <span className={`font-medium truncate transition-all duration-300 ${isSidebarCollapsed ? 'w-0 hidden' : 'block'}`}>
                    {item.label}
                </span>
                </button>
            )
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
            {!isSidebarCollapsed && (
                <button 
                    onClick={() => setIsCmdOpen(true)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-between transition-all mb-2"
                >
                    <span className="flex items-center gap-2"><Search className="w-3 h-3" /> Quick Find</span>
                    <span className="bg-slate-900 px-1.5 py-0.5 rounded text-[10px] font-mono border border-slate-700">⌘K</span>
                </button>
            )}
            
            <button 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className={`w-full flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white transition-colors`}
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`min-h-screen transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'pl-20' : 'lg:pl-64 pl-20'
        }`}
      >
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 bg-white/80 backdrop-blur-md">
           <h1 className="font-bold text-slate-800 capitalize flex items-center gap-2">
               {currentModule === ModuleType.VAULT ? 'My Vault' : currentModule === ModuleType.HISTORY ? 'Activity History' : currentModule === ModuleType.GRAMMAR ? 'Grammar Laboratory' : currentModule === ModuleType.LIBRARY ? 'Study Center' : `${currentModule} Module`}
           </h1>
           <div className="flex items-center gap-4">
             <button onClick={() => setIsCmdOpen(true)} className="lg:hidden text-slate-400">
                 <Search className="w-5 h-5" />
             </button>
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-100">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-bold">System Online</span>
             </div>
           </div>
        </header>
        <div className="p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Command Palette Modal */}
      {isCmdOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-start justify-center pt-[20vh] px-4 animate-in fade-in duration-200">
              <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
                  <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                      <Command className="w-5 h-5 text-slate-400" />
                      <input 
                        ref={inputRef}
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a command or search..." 
                        className="flex-1 text-lg outline-none text-slate-800 placeholder:text-slate-400 bg-transparent"
                      />
                      <button onClick={() => setIsCmdOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-2">
                      {searchResults.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-sm">
                              No results found. Try "Writing", "History", or a saved word.
                          </div>
                      ) : (
                          searchResults.map((result, i) => (
                              <button
                                key={i}
                                onClick={() => handleSelect(result)}
                                className={`w-full text-left p-3 rounded-lg flex items-center justify-between group transition-colors ${i === activeIndex ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50 text-slate-600'}`}
                              >
                                  <div className="flex items-center gap-3">
                                      {result.type === 'nav' && <CornerDownLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />}
                                      {result.type === 'word' && <Hash className="w-4 h-4 text-slate-400 group-hover:text-pink-500" />}
                                      {result.type === 'history' && <FileText className="w-4 h-4 text-slate-400 group-hover:text-emerald-500" />}
                                      
                                      <div>
                                          <div className="font-bold text-sm">
                                              {result.type === 'word' ? result.word : result.label}
                                          </div>
                                          {result.type === 'word' && <div className="text-xs text-slate-400 truncate max-w-[200px]">{result.meaning}</div>}
                                      </div>
                                  </div>
                                  {i === activeIndex && <ArrowRight className="w-4 h-4 text-indigo-500" />}
                              </button>
                          ))
                      )}
                  </div>
                  <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>Pro Tip: Use arrow keys to navigate</span>
                      <span>EnglDom v1.0</span>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
