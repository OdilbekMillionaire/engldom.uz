import React, { useState } from 'react';
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
import { ModuleType } from './types';

function App() {
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.DASHBOARD);

  const renderModule = () => {
    switch (currentModule) {
      case ModuleType.DASHBOARD:
        return <Dashboard />;
      case ModuleType.READING:
        return <ReadingModule />;
      case ModuleType.WRITING:
        return <WritingModule />;
      case ModuleType.LISTENING:
        return <ListeningModule />;
      case ModuleType.SPEAKING:
        return <SpeakingModule />;
      case ModuleType.VOCABULARY:
        return <VocabularyModule />;
      case ModuleType.VAULT:
        return <VaultModule />;
      case ModuleType.HISTORY:
        return <HistoryModule />;
      case ModuleType.GRAMMAR:
        return <GrammarModule />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentModule={currentModule} onModuleChange={setCurrentModule}>
      {renderModule()}
    </Layout>
  );
}

export default App;