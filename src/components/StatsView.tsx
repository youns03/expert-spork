import React from 'react';
import { 
  Award, 
  Flame, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  Headphones, 
  Sparkles 
} from 'lucide-react';
import { AudioProject } from '../types';

interface StatsViewProps {
  projects: AudioProject[];
  onOpenProject: (project: AudioProject) => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  projects,
  onOpenProject
}) => {
  const totalWords = projects.reduce((acc, p) => 
    acc + p.sentences.reduce((sAcc, s) => sAcc + s.words.length, 0), 0);
  
  const totalSentences = projects.reduce((acc, p) => acc + p.sentences.length, 0);
  const totalListeningMinutes = Math.round(projects.reduce((acc, p) => acc + (p.duration || 30), 0) / 60);
  const avgProgress = Math.round(
    projects.reduce((acc, p) => acc + (p.progressPercent || 0), 0) / (projects.length || 1)
  );

  return (
    <div id="stats-view-container" className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-200 pb-24 font-[Cairo] text-slate-800 dark:text-slate-100">
      
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <span>إحصائيات تقدمك في اللغة الفرنسية</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">ملخص نشاطك الصوتي وكلماتك المكتسبة</p>
      </div>

      {/* Streak & Daily Metric Card */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-[#13223e] dark:to-[#0e172a] border border-amber-200/80 dark:border-[#1e3458] rounded-3xl p-5 shadow-sm dark:shadow-xl relative overflow-hidden transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1.5 mb-1">
              <Flame className="w-4 h-4 fill-amber-500 dark:fill-amber-400 text-amber-500 dark:text-amber-400 animate-pulse" />
              سلسلة الحماس اليومية
            </span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">5 أيام متتالية!</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">واصل الاستماع يومياً لتحسين لكنتك ونطقك</p>
          </div>
          
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-500/10 border border-amber-300/70 dark:border-amber-500/30 flex flex-col items-center justify-center text-amber-700 dark:text-amber-400 shadow-sm dark:shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <span className="text-2xl font-black">5</span>
            <span className="text-[10px] font-bold">أيام</span>
          </div>
        </div>
      </div>

      {/* Quick Metrics Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        
        <div className="bg-white dark:bg-[#121e35] border border-slate-200 dark:border-[#1e3256] rounded-2xl p-4 space-y-1 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">الكلمات في الدروس</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{totalWords} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">كلمة</span></p>
        </div>

        <div className="bg-white dark:bg-[#121e35] border border-slate-200 dark:border-[#1e3256] rounded-2xl p-4 space-y-1 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-2">
            <Headphones className="w-4 h-4" />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">الجمل المسجلة</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{totalSentences} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">جملة</span></p>
        </div>

        <div className="bg-white dark:bg-[#121e35] border border-slate-200 dark:border-[#1e3256] rounded-2xl p-4 space-y-1 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">وقت الاستماع</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">{totalListeningMinutes} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">دقيقة</span></p>
        </div>

        <div className="bg-white dark:bg-[#121e35] border border-slate-200 dark:border-[#1e3256] rounded-2xl p-4 space-y-1 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">متوسط الإنجاز</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{avgProgress}%</p>
        </div>

      </div>

      {/* Levels Progress Section */}
      <div className="bg-white dark:bg-[#121e35] border border-slate-200 dark:border-[#1e3256] rounded-3xl p-5 space-y-4 shadow-xs">
        <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          توزيع المستويات التعليمية (CEFR)
        </h4>

        <div className="space-y-3 text-xs">
          {[
            { level: 'A1', label: 'مبتدئ أساسي', count: projects.filter(p => p.level === 'A1').length, percent: 65, color: 'bg-teal-500 dark:bg-teal-400' },
            { level: 'A2', label: 'مبتدئ متقدم', count: projects.filter(p => p.level === 'A2').length, percent: 35, color: 'bg-cyan-500 dark:bg-cyan-400' },
            { level: 'B1', label: 'متوسط مستقل', count: projects.filter(p => p.level === 'B1').length, percent: 15, color: 'bg-blue-500 dark:bg-blue-400' },
            { level: 'B2', label: 'متوسط متقدم', count: projects.filter(p => p.level === 'B2').length, percent: 5, color: 'bg-indigo-500 dark:bg-indigo-400' },
          ].map((item) => (
            <div key={item.level} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-200">{item.level} - {item.label}</span>
                <span className="text-slate-500 dark:text-slate-400 font-mono">{item.count} درس ({item.percent}%)</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className={`${item.color} h-full rounded-full transition-all duration-500`} style={{ width: `${item.percent}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
