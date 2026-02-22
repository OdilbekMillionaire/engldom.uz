import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  User, BookOpen, Palette, Database,
  Camera, Check, Download, Upload, Trash2,
  Sun, Moon, Monitor, AlertTriangle, ChevronDown, X
} from 'lucide-react';
import { storageService } from '../services/storageService';
import { UserSettings, CEFRLevel } from '../types';

// ── Helpers ─────────────────────────────────────────────────────────────────

export const applyTheme = (theme: UserSettings['theme']) => {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
  } else if (theme === 'light') {
    html.classList.remove('dark');
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) html.classList.add('dark');
    else html.classList.remove('dark');
  }
};

// ── Language list ─────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: 'English',    label: 'English (native)' },
  { code: 'Uzbek',      label: 'Uzbek / O\'zbek' },
  { code: 'Russian',    label: 'Russian / Русский' },
  { code: 'Arabic',     label: 'Arabic / العربية' },
  { code: 'Chinese (Simplified)',  label: 'Chinese Simplified / 中文(简体)' },
  { code: 'Chinese (Traditional)', label: 'Chinese Traditional / 中文(繁體)' },
  { code: 'Spanish',    label: 'Spanish / Español' },
  { code: 'French',     label: 'French / Français' },
  { code: 'German',     label: 'German / Deutsch' },
  { code: 'Italian',    label: 'Italian / Italiano' },
  { code: 'Portuguese', label: 'Portuguese / Português' },
  { code: 'Hindi',      label: 'Hindi / हिन्दी' },
  { code: 'Bengali',    label: 'Bengali / বাংলা' },
  { code: 'Urdu',       label: 'Urdu / اردو' },
  { code: 'Turkish',    label: 'Turkish / Türkçe' },
  { code: 'Korean',     label: 'Korean / 한국어' },
  { code: 'Japanese',   label: 'Japanese / 日本語' },
  { code: 'Vietnamese', label: 'Vietnamese / Tiếng Việt' },
  { code: 'Thai',       label: 'Thai / ภาษาไทย' },
  { code: 'Indonesian', label: 'Indonesian / Bahasa Indonesia' },
  { code: 'Malay',      label: 'Malay / Bahasa Melayu' },
  { code: 'Persian',    label: 'Persian / فارسی' },
  { code: 'Nepali',     label: 'Nepali / नेपाली' },
  { code: 'Tamil',      label: 'Tamil / தமிழ்' },
  { code: 'Telugu',     label: 'Telugu / తెలుగు' },
  { code: 'Sinhala',    label: 'Sinhala / සිංහල' },
  { code: 'Kazakh',     label: 'Kazakh / Қазақша' },
  { code: 'Azerbaijani',label: 'Azerbaijani / Azərbaycan' },
  { code: 'Georgian',   label: 'Georgian / ქართული' },
  { code: 'Romanian',   label: 'Romanian / Română' },
  { code: 'Polish',     label: 'Polish / Polski' },
  { code: 'Ukrainian',  label: 'Ukrainian / Українська' },
  { code: 'Hungarian',  label: 'Hungarian / Magyar' },
  { code: 'Greek',      label: 'Greek / Ελληνικά' },
  { code: 'Hebrew',     label: 'Hebrew / עברית' },
  { code: 'Dutch',      label: 'Dutch / Nederlands' },
  { code: 'Swedish',    label: 'Swedish / Svenska' },
  { code: 'Norwegian',  label: 'Norwegian / Norsk' },
  { code: 'Danish',     label: 'Danish / Dansk' },
  { code: 'Finnish',    label: 'Finnish / Suomi' },
  { code: 'Swahili',    label: 'Swahili / Kiswahili' },
  { code: 'Amharic',    label: 'Amharic / አማርኛ' },
];

const BAND_OPTIONS = ['5.0','5.5','6.0','6.5','7.0','7.5','8.0','8.5','9.0'];
const CEFR_OPTIONS = [CEFRLevel.A1, CEFRLevel.A2, CEFRLevel.B1, CEFRLevel.B2, CEFRLevel.C1, CEFRLevel.C2];
const DAILY_GOAL_OPTIONS = [
  { value: 2,  label: 'Light',    desc: '2 exercises/day' },
  { value: 5,  label: 'Moderate', desc: '5 exercises/day' },
  { value: 10, label: 'Intense',  desc: '10 exercises/day' },
  { value: 20, label: 'Expert',   desc: '20 exercises/day' },
];

// ── Sub-components ────────────────────────────────────────────────────────

const SectionCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-5">
    <div>
      <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
      <p className="text-slate-500 text-sm mt-0.5">{description}</p>
    </div>
    {children}
  </div>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{children}</label>
);

// ── Toast component ──────────────────────────────────────────────────────

interface ToastProps { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }
const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-600',
    error:   'bg-red-600',
    info:    'bg-indigo-600',
  };

  return (
    <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl text-white font-medium shadow-xl ${colors[type]}`}>
      {type === 'success' && <Check className="w-4 h-4 flex-shrink-0" />}
      {type === 'error'   && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────

type Tab = 'profile' | 'learning' | 'appearance' | 'data';

export const SettingsModule: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(() => storageService.getSettings());
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [langSearch, setLangSearch] = useState('');
  const [langOpen, setLangOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [clearConfirm, setClearConfirm] = useState<'progress' | 'vault' | 'all' | null>(null);

  const avatarInputRef  = useRef<HTMLInputElement>(null);
  const importInputRef  = useRef<HTMLInputElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close language dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  }, []);

  const update = (partial: Partial<UserSettings>) => setSettings(s => ({ ...s, ...partial }));

  const handleSave = () => {
    storageService.saveSettings(settings);
    applyTheme(settings.theme);
    showToast('Settings saved successfully!');
  };

  // ── Avatar ─────────────────────────────────────────────────────────────

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update({ avatarDataUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  // ── Data actions ───────────────────────────────────────────────────────

  const handleExport = () => {
    const data = storageService.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `engldom-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully!');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = storageService.importData(reader.result as string);
      if (result.success) {
        setSettings(storageService.getSettings());
        showToast('Data imported! Refresh the page to see all changes.', 'info');
      } else {
        showToast(result.error || 'Import failed.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = (type: 'progress' | 'vault' | 'all') => {
    if (type === 'progress')      storageService.clearProgressOnly();
    else if (type === 'vault')    storageService.clearVaultOnly();
    else                          storageService.clearAllData();
    setClearConfirm(null);
    showToast(
      type === 'all' ? 'All data cleared. Page will refresh.' : 'Selected data cleared.',
      type === 'all' ? 'info' : 'success'
    );
    if (type === 'all') setTimeout(() => window.location.reload(), 1500);
  };

  // ── Language filter ────────────────────────────────────────────────────

  const filteredLangs = LANGUAGES.filter(l =>
    l.label.toLowerCase().includes(langSearch.toLowerCase()) ||
    l.code.toLowerCase().includes(langSearch.toLowerCase())
  );
  const selectedLang = LANGUAGES.find(l => l.code === settings.nativeLanguage);

  // ── Tabs ───────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'profile',    label: 'Profile',    icon: User },
    { id: 'learning',   label: 'Learning',   icon: BookOpen },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'data',       label: 'Data',       icon: Database },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-1">Settings & Profile</h2>
        <p className="text-slate-500">Personalise your ENGLDOM experience.</p>
      </div>

      {/* Tab navigation */}
      <div className="bg-white rounded-xl border border-slate-100 p-1.5 flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Profile Tab ──────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <SectionCard title="Your Profile" description="How you appear within the app and personalised greetings.">

            {/* Avatar */}
            <div>
              <FieldLabel>Profile Picture</FieldLabel>
              <div className="flex items-center gap-5">
                <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-indigo-100 bg-slate-100 flex items-center justify-center">
                    {settings.avatarDataUrl ? (
                      <img src={settings.avatarDataUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Upload Photo
                  </button>
                  {settings.avatarDataUrl && (
                    <button
                      onClick={() => update({ avatarDataUrl: null })}
                      className="block px-4 py-2 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-xs text-slate-400">JPG, PNG, GIF up to 2 MB</p>
                </div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
            </div>

            {/* Display name */}
            <div>
              <FieldLabel>Display Name</FieldLabel>
              <input
                type="text"
                value={settings.displayName}
                onChange={e => update({ displayName: e.target.value })}
                placeholder="e.g. Akbar, Sarah…"
                maxLength={40}
                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Used in dashboard greetings and streaks.</p>
            </div>
          </SectionCard>

          <div className="flex justify-end">
            <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Check className="w-4 h-4" /> Save Profile
            </button>
          </div>
        </div>
      )}

      {/* ── Learning Tab ─────────────────────────────────────────────── */}
      {activeTab === 'learning' && (
        <div className="space-y-4">
          <SectionCard title="Language Preferences" description="AI explanations, hints, and feedback will be delivered in your native language.">

            {/* Native Language */}
            <div>
              <FieldLabel>Native Language</FieldLabel>
              <div className="relative" ref={langDropdownRef}>
                <button
                  onClick={() => setLangOpen(o => !o)}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-left text-slate-800 text-sm flex items-center justify-between hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  <span>{selectedLang?.label || 'Select language…'}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                {langOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <input
                        type="text"
                        value={langSearch}
                        onChange={e => setLangSearch(e.target.value)}
                        placeholder="Search language…"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {filteredLangs.map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => { update({ nativeLanguage: lang.code }); setLangOpen(false); setLangSearch(''); }}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors flex items-center justify-between ${
                            settings.nativeLanguage === lang.code ? 'text-indigo-600 font-semibold bg-indigo-50' : 'text-slate-700'
                          }`}
                        >
                          <span>{lang.label}</span>
                          {settings.nativeLanguage === lang.code && <Check className="w-4 h-4 text-indigo-600" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {settings.nativeLanguage !== 'English' && (
                <div className="mt-2 px-3 py-2 bg-indigo-50 rounded-lg text-xs text-indigo-700 font-medium">
                  AI explanations, hints, and feedback will now be in <strong>{settings.nativeLanguage}</strong>. Exercise questions remain in English.
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard title="IELTS Goals" description="Set your target score and daily study commitment.">

            {/* Target Band */}
            <div>
              <FieldLabel>Target IELTS Band</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {BAND_OPTIONS.map(b => (
                  <button
                    key={b}
                    onClick={() => update({ targetBand: b })}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                      settings.targetBand === b
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Goal */}
            <div>
              <FieldLabel>Daily Practice Goal</FieldLabel>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DAILY_GOAL_OPTIONS.map(g => (
                  <button
                    key={g.value}
                    onClick={() => update({ dailyGoal: g.value })}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      settings.dailyGoal === g.value
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className={`text-base font-bold ${settings.dailyGoal === g.value ? 'text-indigo-700' : 'text-slate-700'}`}>{g.label}</div>
                    <div className={`text-xs mt-0.5 ${settings.dailyGoal === g.value ? 'text-indigo-500' : 'text-slate-400'}`}>{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Default CEFR */}
            <div>
              <FieldLabel>Default CEFR Level</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {CEFR_OPTIONS.map(c => (
                  <button
                    key={c}
                    onClick={() => update({ defaultCEFRLevel: c })}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                      settings.defaultCEFRLevel === c
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <div className="flex justify-end">
            <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Check className="w-4 h-4" /> Save Learning Preferences
            </button>
          </div>
        </div>
      )}

      {/* ── Appearance Tab ───────────────────────────────────────────── */}
      {activeTab === 'appearance' && (
        <div className="space-y-4">
          <SectionCard title="Theme" description="Choose how ENGLDOM looks on your device.">
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'light',  label: 'Light',  icon: Sun,     desc: 'Bright & clean' },
                { id: 'dark',   label: 'Dark',   icon: Moon,    desc: 'Easy on the eyes' },
                { id: 'system', label: 'System', icon: Monitor, desc: 'Match OS setting' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => { update({ theme: t.id as UserSettings['theme'] }); applyTheme(t.id as UserSettings['theme']); }}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    settings.theme === t.id
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <t.icon className={`w-6 h-6 ${settings.theme === t.id ? 'text-indigo-600' : 'text-slate-500'}`} />
                  <span className={`text-sm font-bold ${settings.theme === t.id ? 'text-indigo-700' : 'text-slate-700'}`}>{t.label}</span>
                  <span className={`text-xs ${settings.theme === t.id ? 'text-indigo-500' : 'text-slate-400'}`}>{t.desc}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">Theme changes are applied immediately and saved when you click Save.</p>
          </SectionCard>

          <div className="flex justify-end">
            <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2">
              <Check className="w-4 h-4" /> Save Appearance
            </button>
          </div>
        </div>
      )}

      {/* ── Data Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'data' && (
        <div className="space-y-4">
          <SectionCard title="Backup & Restore" description="Export your progress, vocabulary, and settings for safekeeping or transfer.">
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-3 px-5 py-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                Export All Data
              </button>
              <button
                onClick={() => importInputRef.current?.click()}
                className="flex items-center justify-center gap-3 px-5 py-4 border-2 border-dashed border-slate-300 text-slate-600 rounded-xl font-semibold hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                <Upload className="w-5 h-5" />
                Import from Backup
              </button>
            </div>
            <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
            <p className="text-xs text-slate-400">
              Exported as a <code className="bg-slate-100 px-1 rounded">.json</code> file. You can import it later on any device.
            </p>
          </SectionCard>

          <SectionCard title="Clear Data" description="Permanently delete specific data. These actions cannot be undone.">
            <div className="space-y-3">
              {/* Clear Progress */}
              {clearConfirm === 'progress' ? (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-700 font-medium flex-1">Clear all progress & streaks?</span>
                  <button onClick={() => handleClear('progress')} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg">Yes, clear</button>
                  <button onClick={() => setClearConfirm(null)} className="px-3 py-1.5 border border-slate-300 text-slate-600 text-xs font-bold rounded-lg">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setClearConfirm('progress')}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all text-sm font-semibold text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  <div>
                    <div>Clear Progress & Streaks</div>
                    <div className="text-xs font-normal text-slate-400">Removes scores, history, and streak data</div>
                  </div>
                </button>
              )}

              {/* Clear Vault */}
              {clearConfirm === 'vault' ? (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-700 font-medium flex-1">Clear vocabulary vault & grammar rules?</span>
                  <button onClick={() => handleClear('vault')} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg">Yes, clear</button>
                  <button onClick={() => setClearConfirm(null)} className="px-3 py-1.5 border border-slate-300 text-slate-600 text-xs font-bold rounded-lg">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setClearConfirm('vault')}
                  className="w-full flex items-center gap-3 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-all text-sm font-semibold text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  <div>
                    <div>Clear Vocabulary Vault</div>
                    <div className="text-xs font-normal text-slate-400">Removes all saved words and grammar rules</div>
                  </div>
                </button>
              )}

              {/* Clear All */}
              {clearConfirm === 'all' ? (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-700 font-medium flex-1">Delete ALL data including settings? This cannot be undone.</span>
                  <button onClick={() => handleClear('all')} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg">Yes, delete all</button>
                  <button onClick={() => setClearConfirm(null)} className="px-3 py-1.5 border border-slate-300 text-slate-600 text-xs font-bold rounded-lg">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setClearConfirm('all')}
                  className="w-full flex items-center gap-3 px-4 py-3 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all text-sm font-semibold text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  <div>
                    <div>Reset Everything</div>
                    <div className="text-xs font-normal text-red-400">Deletes all data and resets to factory defaults</div>
                  </div>
                </button>
              )}
            </div>
          </SectionCard>

          <SectionCard title="About" description="">
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">App version</span>
                <span className="font-semibold text-slate-700">ENGLDOM v1.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">AI engine</span>
                <span className="font-semibold text-slate-700">Google Gemini</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Storage</span>
                <span className="font-semibold text-slate-700">Local (browser)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Settings since</span>
                <span className="font-semibold text-slate-700">{new Date(settings.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};
