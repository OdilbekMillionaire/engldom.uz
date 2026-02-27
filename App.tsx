import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ReadingModule } from './components/ReadingModule';
import { WritingModule } from './components/WritingModule';
import { ListeningModule } from './components/ListeningModule';
import { SpeakingModule } from './components/SpeakingModule';
import { Dashboard } from './components/Dashboard';
import { VocabularyModule } from './components/VocabularyModule';
import { VaultModule } from './components/VaultModule';
import { HistoryModule } from './components/HistoryModule';
import { GrammarModule } from './components/GrammarModule';
import { LibraryModule } from './components/LibraryModule';
import { SettingsModule } from './components/SettingsModule';
import { LandingPage } from './components/LandingPage';
import { OnboardingQuiz } from './components/OnboardingQuiz';
import { XPToastProvider } from './components/ui/XPToastProvider';
import { StudyPlanModule } from './components/StudyPlanModule';
import { GamesModule } from './components/GamesModule';
import { ModuleType, CEFRLevel } from './types';
import { storageService } from './services/storageService';

function App() {
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.DASHBOARD);
  const [sessionData, setSessionData] = useState<any>(null);
  const [showLanding, setShowLanding] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Apply saved theme on first load; show landing for new users
  useEffect(() => {
    const settings = storageService.getSettings();

    if (!settings.onboardingCompleted) {
      setShowLanding(true);
    }
  }, []);

  const handleStartOnboarding = () => {
    setShowLanding(false);
    setShowOnboarding(true);
  };

  const handleOnboardingComplete = (results: any) => {
    storageService.saveSettings({
      displayName: results.name,
      targetBand: results.targetBand.toString(),
      dailyGoal: results.commitment,
      defaultCEFRLevel: results.level.toUpperCase() as CEFRLevel,
      onboardingCompleted: true,
    });
    setShowOnboarding(false);
  };

  const handleModuleChange = (module: ModuleType) => {
    setSessionData(null);
    setCurrentModule(module);
  };

  const handleRestoreSession = (module: ModuleType, data: any) => {
    setSessionData(data);
    setCurrentModule(module);
  };

  const renderModule = () => {
    switch (currentModule) {
      case ModuleType.DASHBOARD: return <Dashboard onModuleChange={handleModuleChange} />;
      case ModuleType.READING: return <ReadingModule initialData={sessionData} />;
      case ModuleType.WRITING: return <WritingModule initialData={sessionData} />;
      case ModuleType.LISTENING: return <ListeningModule initialData={sessionData} />;
      case ModuleType.SPEAKING: return <SpeakingModule initialData={sessionData} />;
      case ModuleType.VOCABULARY: return <VocabularyModule initialData={sessionData} />;
      case ModuleType.VAULT: return <VaultModule />;
      case ModuleType.HISTORY: return <HistoryModule onRestore={handleRestoreSession} />;
      case ModuleType.GRAMMAR: return <GrammarModule initialData={sessionData} />;
      case ModuleType.LIBRARY: return <LibraryModule />;
      case ModuleType.SETTINGS: return <SettingsModule />;
      case ModuleType.STUDY_PLAN: return <StudyPlanModule />;
      case ModuleType.GAMES: return <GamesModule />;
      default: return <Dashboard onModuleChange={handleModuleChange} />;
    }
  };

  return (
    <XPToastProvider>
      {showLanding ? (
        <LandingPage onStart={handleStartOnboarding} />
      ) : (
        <>
          <Layout currentModule={currentModule} onModuleChange={handleModuleChange}>
            {renderModule()}
          </Layout>

          {showOnboarding && (
            <OnboardingQuiz onComplete={handleOnboardingComplete} />
          )}
        </>
      )}
    </XPToastProvider>
  );
}

export default App;
