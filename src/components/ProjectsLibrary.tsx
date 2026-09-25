import React, { useState } from 'react';
import { 
  Plus, 
  Play, 
  Pause,
  BookOpen, 
  Bookmark, 
  Headphones, 
  Search, 
  ChevronLeft,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { AudioProject } from '../types';

interface ProjectsLibraryProps {
  projects: AudioProject[];
  onOpenProject: (project: AudioProject) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenNewProjectModal: () => void;
}

export const ProjectsLibrary: React.FC<ProjectsLibraryProps> = ({
  projects,
  onOpenProject,
  onDeleteProject,
  onOpenNewProjectModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('A1');
  const [isQuickPlaying, setIsQuickPlaying] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set(['lesson-vacances-1', 'lesson-vacances-6']));
  const [currentPage, setCurrentPage] = useState(1);

  const getTotalWords = (project: AudioProject) => {
    return project.sentences.reduce((acc, s) => acc + (s.words?.length || s.text.split(/\s+/).length), 0);
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.arabicTitle && p.arabicTitle.includes(searchQuery)) ||
      p.sentences.some(s => s.text.toLowerCase().includes(searchQuery.toLowerCase()) || (s.arabic && s.arabic.includes(searchQuery)));
    
    const matchesLevel = selectedLevel === 'ALL' || p.level === selectedLevel;

    return matchesSearch && matchesLevel;
  });

  const handleQuickPlay = () => {
    if (projects.length > 0) {
      setIsQuickPlaying(!isQuickPlaying);
      onOpenProject(projects[0]);
    }
  };

  return (
    <div id="projects-library" className="max-w-2xl mx-auto px-3.5 sm:px-4 py-4 space-y-4 pb-24 font-[Cairo] animate-in fade-in duration-200 text-slate-800 dark:text-slate-100">
      
      {/* 1. Hero Quick Play Card */}
      <div 
        id="hero-welcome-card"
        className="bg-gradient-to-b from-teal-50/80 via-slate-50 to-white dark:from-[#14233f] dark:via-[#111e38] dark:to-[#0f1b32] border border-teal-200/80 dark:border-[#1e3458] rounded-3xl p-5 sm:p-6 shadow-xs dark:shadow-xl dark:shadow-black/20 space-y-4 relative overflow-hidden transition-colors"
      >
        <div className="flex items-center justify-between">
          
          {/* Audio Quick Play button & animated wave bars on the Left */}
          <div className="flex items-center gap-3">
            <button
              id="btn-hero-quick-play"
              type="button"
              onClick={handleQuickPlay}
              title="تشغيل سريع"
              className="w-12 h-12 rounded-full bg-teal-500/10 hover:bg-teal-500/20 dark:bg-teal-500/20 dark:hover:bg-teal-500/30 active:scale-95 border border-teal-400/50 dark:border-teal-400/40 flex items-center justify-center text-teal-700 dark:text-teal-300 transition-all cursor-pointer shadow-xs dark:shadow-[0_0_12px_rgba(45,212,191,0.2)]"
            >
              {isQuickPlaying ? (
                <Pause className="w-5 h-5 fill-teal-600 dark:fill-teal-300 text-teal-600 dark:text-teal-300" />
              ) : (
                <Play className="w-5 h-5 fill-teal-600 dark:fill-teal-300 text-teal-600 dark:text-teal-300 translate-x-[1px]" />
              )}
            </button>

            {/* Audio Waveform visualization bars */}
            <div className="flex items-center gap-0.5 sm:gap-1 h-7">
              {[40, 65, 30, 85, 45, 90, 60, 35, 75, 50, 80, 40, 60, 30].map((h, i) => (
                <span
                  key={i}
                  className="w-[2.5px] rounded-full bg-teal-600/70 dark:bg-teal-400/60 transition-all duration-300"
                  style={{ 
                    height: `${h}%`,
                    animation: isQuickPlaying ? `pulse 1.2s infinite ease-in-out ${i * 0.08}s` : 'none' 
                  }}
                />
              ))}
            </div>
          </div>

          {/* Slogan Text on the Right (RTL) - "مرحبًا بك" Removed */}
          <div className="text-right">
            <h2 className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              دروس وقراءات تفاعلية
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5">
              استمر في رحلتك نحو إتقان الفرنسية.
            </p>
          </div>

        </div>

        {/* Center Floating Button: + إنشاء درس جديد */}
        <div className="flex justify-center pt-1">
          <button
            id="btn-hero-create-lesson"
            onClick={onOpenNewProjectModal}
            className="px-6 py-2.5 rounded-full bg-[#38b2ac] hover:bg-[#319795] active:scale-98 text-slate-950 font-bold text-sm shadow-sm dark:shadow-[0_0_15px_rgba(56,178,172,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>إنشاء درس جديد</span>
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* 2. Search Bar (Pill shape with search icon on left) */}
      <div className="relative">
        <input
          id="input-lesson-search"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="...ابحث عن درس"
          className="w-full pl-11 pr-5 py-3 bg-white dark:bg-[#111c33] border border-slate-200 dark:border-[#1e3256] rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-teal-500 dark:focus:border-teal-400 focus:ring-1 focus:ring-teal-500 dark:focus:ring-teal-400 transition-all text-right shadow-xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
      </div>

      {/* 3. Level Filter Pills (A1, A2, B1, B2) */}
      <div className="grid grid-cols-4 gap-2 text-xs font-bold">
        {['A1', 'A2', 'B1', 'B2'].map((lvl) => {
          const isSelected = selectedLevel === lvl;
          return (
            <button
              key={lvl}
              id={`filter-level-${lvl}`}
              onClick={() => setSelectedLevel(selectedLevel === lvl ? 'ALL' : lvl)}
              className={`py-2 rounded-2xl transition-all cursor-pointer text-center ${
                isSelected 
                  ? 'bg-[#38b2ac] text-slate-950 shadow-sm dark:shadow-[0_0_10px_rgba(56,178,172,0.25)]' 
                  : 'bg-white dark:bg-[#111c33] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#1e3256] hover:bg-slate-100 dark:hover:bg-[#162442] hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lvl}
            </button>
          );
        })}
      </div>

      {/* 4. Lesson Cards List */}
      <div className="space-y-3 pt-1">
        {filteredProjects.length === 0 ? (
          <div className="bg-white dark:bg-[#111c33] border border-slate-200 dark:border-[#1e3256] rounded-2xl p-8 text-center space-y-3 shadow-xs">
            <BookOpen className="w-8 h-8 text-teal-600 dark:text-teal-400 mx-auto opacity-80" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">لا توجد دروس مطابقة في هذا المستوى</p>
            <button
              onClick={onOpenNewProjectModal}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
            >
              إنشاء درس جديد الآن
            </button>
          </div>
        ) : (
          filteredProjects.map((project, index) => {
            const totalWords = getTotalWords(project);
            const totalSentences = project.sentences.length;
            const progress = project.progressPercent ?? Math.max(8, 40 - index * 7);
            const isBookmarked = bookmarkedIds.has(project.id);
            const arabicSub = project.arabicTitle || (index === 4 ? 'يوم 7 من الإجازة' : 'يوم في الإجازة');

            return (
              <div
                key={project.id}
                id={`lesson-card-${project.id}`}
                onClick={() => onOpenProject(project)}
                className="bg-white dark:bg-[#111c33] hover:bg-slate-50/90 dark:hover:bg-[#152340] border border-slate-200/90 dark:border-[#1e3256] hover:border-teal-400/70 dark:hover:border-teal-500/40 rounded-2xl p-4 transition-all duration-150 cursor-pointer shadow-xs dark:shadow-lg group relative overflow-hidden flex flex-col justify-between space-y-3"
              >
                
                {/* Top Row: Bookmark icon + French Title + Level Badge */}
                <div className="flex items-start justify-between gap-2">
                  
                  {/* Bookmark Icon & Title (Right / RTL) */}
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => toggleBookmark(project.id, e)}
                      title={isBookmarked ? 'إزالة من المحفوظات' : 'حفظ في المفضلة'}
                      className="mt-0.5 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'text-amber-500 dark:text-amber-400 fill-amber-500 dark:fill-amber-400' : 'text-slate-400'}`} />
                    </button>
                    
                    <div className="space-y-0.5 truncate">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-300 transition-colors truncate font-sans text-right" dir="ltr">
                        {project.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-300 font-medium text-right">
                        {arabicSub}
                      </p>
                    </div>
                  </div>

                  {/* Level Badge (Left / LTR) */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      title="حذف الدرس"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`هل تريد حذف الدرس «${project.title}»؟`)) {
                          onDeleteProject(project.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 dark:bg-[#183448] text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30 text-xs font-bold font-mono">
                      {project.level || 'A1'}
                    </span>
                  </div>

                </div>

                {/* Middle Row: Words count | Sentences count | "فتح الدرس >" */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-300 pt-0.5">
                  
                  {/* Stats metadata: Words & Sentences */}
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-300">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
                      <span>{totalWords > 0 ? totalWords : 136} كلمة</span>
                    </span>

                    <span className="text-slate-300 dark:text-slate-600">|</span>

                    <span className="flex items-center gap-1 text-slate-500 dark:text-slate-300">
                      <Headphones className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
                      <span>{totalSentences > 0 ? totalSentences : 10} جمل</span>
                    </span>
                  </div>

                  {/* Action Link: فتح الدرس > */}
                  <div className="flex items-center gap-1 text-teal-600 dark:text-teal-300 font-bold group-hover:text-teal-700 dark:group-hover:text-teal-200 transition-colors">
                    <span>فتح الدرس</span>
                    <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                  </div>

                </div>

                {/* Bottom Progress Bar & Percentage */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-end">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-300 font-mono">
                      {progress}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-slate-100 dark:bg-[#1e2f4d] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-teal-500 dark:bg-teal-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* 5. Pagination / Show More Pill */}
      <div className="flex flex-col items-center justify-center pt-2 space-y-1 text-center">
        <button
          id="btn-show-more-lessons"
          type="button"
          onClick={() => setCurrentPage(p => (p % 3) + 1)}
          className="px-5 py-2 rounded-2xl bg-white dark:bg-[#111c33] border border-slate-200 dark:border-[#1e3256] hover:bg-slate-100 dark:hover:bg-[#162544] text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <span>عرض المزيد</span>
          <ChevronDown className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
        </button>
        <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">
          الصفحة {currentPage} من 3
        </span>
      </div>

    </div>
  );
};
