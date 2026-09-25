import React, { useState, useEffect, useRef } from 'react';
import { AudioProject, ReaderConfig, NavTab } from './types';
import { 
  loadProjectsFromStorage, 
  saveProjectsToStorage, 
  DEFAULT_FRENCH_LESSONS,
  loadConfigFromStorage,
  saveConfigToStorage,
  DEFAULT_READER_CONFIG
} from './utils/storage';
import { AudioEngine } from './utils/audioEngine';
import { Header } from './components/Header';
import { ProjectsLibrary } from './components/ProjectsLibrary';
import { FileReadingView } from './components/FileReadingView';
import { AudioProjectModal } from './components/AudioProjectModal';
import { VoiceModelManagerModal } from './components/VoiceModelManagerModal';
import { SettingsModal } from './components/SettingsModal';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { BottomNavBar } from './components/BottomNavBar';
import { StatsView } from './components/StatsView';

export const App: React.FC = () => {
  const [projects, setProjects] = useState<AudioProject[]>(DEFAULT_FRENCH_LESSONS);
  const [activeProject, setActiveProject] = useState<AudioProject | null>(DEFAULT_FRENCH_LESSONS[0] || null);
  const [activeView, setActiveView] = useState<'library' | 'reader'>('library');
  const [activeNavTab, setActiveNavTab] = useState<NavTab>('library');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModelManagerOpen, setIsModelManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [config, setConfig] = useState<ReaderConfig>(DEFAULT_READER_CONFIG);

  const audioEngineRef = useRef<AudioEngine | null>(null);

  // Load configuration from local storage on mount
  useEffect(() => {
    const loadedCfg = loadConfigFromStorage();
    setConfig(loadedCfg);
  }, []);

  // Sync Theme with document root HTML for Dark Mode / Light Mode
  useEffect(() => {
    const applyTheme = () => {
      const isDark = 
        config.theme === 'dark' || 
        (config.theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
        document.body.style.backgroundColor = '#091122';
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
        document.body.style.backgroundColor = '#f8fafc';
      }
    };

    applyTheme();

    if (config.theme === 'system' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [config.theme]);

  // Load offline lessons from storage / IndexedDB
  useEffect(() => {
    loadProjectsFromStorage().then((loaded) => {
      if (loaded.length > 0) {
        setProjects(loaded);
        setActiveProject(loaded[0]);
      }
    });
  }, []);

  // Initialize audio engine instance
  useEffect(() => {
    const engine = new AudioEngine();
    engine.setCallbacks(
      (time, playing) => {
        setCurrentTime(time);
        setIsPlaying(playing);
      },
      () => {
        setIsPlaying(false);
      }
    );
    audioEngineRef.current = engine;

    return () => {
      engine.stop();
    };
  }, []);

  // Update speed when config changes
  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setPlaybackRate(config.speed);
    }
  }, [config.speed]);

  // Load project audio into engine whenever active project changes
  useEffect(() => {
    if (activeProject && audioEngineRef.current) {
      audioEngineRef.current.loadProjectAudio(activeProject);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [activeProject?.id, activeProject?.audioDataUrl]);

  // Save projects on modification
  const handleSaveProjects = (updatedProjects: AudioProject[]) => {
    setProjects(updatedProjects);
    saveProjectsToStorage(updatedProjects);
  };

  const handleUpdateConfig = (newCfg: Partial<ReaderConfig>) => {
    setConfig((prev) => {
      const updated = { ...prev, ...newCfg };
      saveConfigToStorage(updated);
      return updated;
    });
  };

  const handleOpenProject = (project: AudioProject) => {
    setActiveProject(project);
    setActiveView('reader');
    if (audioEngineRef.current) {
      audioEngineRef.current.loadProjectAudio(project);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    const filtered = projects.filter(p => p.id !== projectId);
    handleSaveProjects(filtered);
    if (activeProject?.id === projectId) {
      setActiveProject(filtered.length > 0 ? filtered[0] : null);
      if (filtered.length === 0) {
        setActiveView('library');
      }
    }
  };

  const handleCreateProject = (newProject: AudioProject) => {
    const updated = [newProject, ...projects];
    handleSaveProjects(updated);
    handleOpenProject(newProject);
  };

  const handleUpdateCurrentProject = (updatedProject: AudioProject) => {
    const updated = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    handleSaveProjects(updated);
    setActiveProject(updatedProject);
  };

  // Playback handlers
  const handlePlay = () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.play();
    }
  };

  const handlePause = () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.pause();
    }
  };

  const handleSeek = (time: number) => {
    if (audioEngineRef.current) {
      audioEngineRef.current.seek(time);
    }
  };

  // Global Keyboard shortcuts (Space to play/pause in reader)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isPlaying) handlePause();
        else handlePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  // Handle Tab navigation
  const handleSelectNavTab = (tab: NavTab) => {
    setActiveNavTab(tab);
    if (tab === 'library') {
      setActiveView('library');
    } else if (tab === 'search') {
      setActiveView('library');
      setTimeout(() => {
        const input = document.getElementById('input-lesson-search');
        input?.focus();
      }, 100);
    } else if (tab === 'voices') {
      setIsModelManagerOpen(true);
    } else if (tab === 'settings') {
      setIsSettingsOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#091122] text-slate-800 dark:text-slate-100 flex flex-col font-[Cairo] transition-colors duration-200">
      
      {/* Header */}
      <Header
        currentProject={activeProject}
        activeView={activeView}
        onNavigate={(view) => {
          if (view === 'library' && isPlaying) handlePause();
          setActiveView(view);
          setActiveNavTab('library');
        }}
        onOpenNewProjectModal={() => setIsModalOpen(true)}
        onOpenModelManagerModal={() => setIsModelManagerOpen(true)}
        onOpenSettingsModal={() => setIsSettingsOpen(true)}
        config={config}
        onChangeConfig={handleUpdateConfig}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'reader' && activeProject ? (
          <FileReadingView
            project={activeProject}
            currentTime={currentTime}
            isPlaying={isPlaying}
            config={config}
            onChangeConfig={handleUpdateConfig}
            onSeek={handleSeek}
            onUpdateProject={handleUpdateCurrentProject}
            onSpeakSentence={(text) => audioEngineRef.current?.speakSingleSentence(text)}
          />
        ) : activeNavTab === 'stats' ? (
          <StatsView
            projects={projects}
            onOpenProject={handleOpenProject}
          />
        ) : (
          <ProjectsLibrary
            projects={projects}
            onOpenProject={handleOpenProject}
            onDeleteProject={handleDeleteProject}
            onOpenNewProjectModal={() => setIsModalOpen(true)}
          />
        )}
      </main>

      {/* Persistent Bottom Player Bar when reading a lesson */}
      {activeView === 'reader' && activeProject && (
        <AudioPlayerBar
          project={activeProject}
          currentTime={currentTime}
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onPause={handlePause}
          onSeek={handleSeek}
          config={config}
          onChangeConfig={handleUpdateConfig}
        />
      )}

      {/* Bottom Navigation Bar */}
      {activeView === 'library' && (
        <BottomNavBar
          activeTab={activeNavTab}
          onSelectTab={handleSelectNavTab}
        />
      )}

      {/* Modal to Create/Generate Lesson from Text or Audio */}
      <AudioProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateProject={handleCreateProject}
      />

      {/* Modal to Manage Local Speech Engine & Model Cache */}
      <VoiceModelManagerModal
        isOpen={isModelManagerOpen}
        onClose={() => {
          setIsModelManagerOpen(false);
          if (activeNavTab === 'voices') setActiveNavTab('library');
        }}
      />

      {/* Modal for App Settings (Dark Mode, Light Mode, Fonts, Highlighting) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          if (activeNavTab === 'settings') setActiveNavTab('library');
        }}
        config={config}
        onChangeConfig={handleUpdateConfig}
      />

    </div>
  );
};

export default App;
