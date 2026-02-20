
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
import { LibraryModule } from './components/LibraryModule';
import { ModuleType } from './types';

function App() {
  const [currentModule, setCurrentModule] = useState<ModuleType>(ModuleType.DASHBOARD);
  const [sessionData, setSessionData] = useState<any>(null);

  const handleModuleChange = (module: ModuleType) => {
    // Clear session data if manually navigating
    setSessionData(null);
    setCurrentModule(module);
  };

  const handleRestoreSession = (module: ModuleType, data: any) => {
    setSessionData(data);
    setCurrentModule(module);
  };

  const renderModule = () => {
    switch (currentModule) {
      case ModuleType.DASHBOARD:
        return <Dashboard />;
      case ModuleType.READING:
        return <ReadingModule initialData={sessionData} />;
      case ModuleType.WRITING:
        return <WritingModule initialData={sessionData} />;
      case ModuleType.LISTENING:
        return <ListeningModule initialData={sessionData} />;
      case ModuleType.SPEAKING:
        return <SpeakingModule initialData={sessionData} />;
      case ModuleType.VOCABULARY:
        // Vocab generator creates lists, restoring just means showing the result. 
        // We pass it to prepopulate the "Output" view if needed, or simple ignore for now as it saves to Vault.
        return <VocabularyModule initialData={sessionData} />;
      case ModuleType.VAULT:
        return <VaultModule />;
      case ModuleType.HISTORY:
        return <HistoryModule onRestore={handleRestoreSession} />;
      case ModuleType.GRAMMAR:
        return <GrammarModule initialData={sessionData} />;
      case ModuleType.LIBRARY:
        return <LibraryModule />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentModule={currentModule} onModuleChange={handleModuleChange}>
      {renderModule()}
    </Layout>
  );
}

export default App;
