import React from 'react';
import { 
  BookOpen, 
  Search, 
  TrendingUp, 
  Headphones, 
  Settings 
} from 'lucide-react';
import { NavTab } from '../types';

interface BottomNavBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onSelectTab
}) => {
  const navItems = [
    { id: 'library' as NavTab, label: 'المكتبة', icon: BookOpen },
    { id: 'search' as NavTab, label: 'بحث', icon: Search },
    { id: 'stats' as NavTab, label: 'إحصائيات', icon: TrendingUp },
    { id: 'voices' as NavTab, label: 'الصوتيات', icon: Headphones },
    { id: 'settings' as NavTab, label: 'الإعدادات', icon: Settings },
  ];

  return (
    <nav 
      id="bottom-app-navigation"
      aria-label="شريط التنقل الرئيسي"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#09101f]/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-[#1e2f4d] py-2 px-3 shadow-lg dark:shadow-2xl transition-all font-[Cairo]"
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all cursor-pointer relative group ${
                isActive 
                  ? 'text-teal-600 dark:text-teal-300 font-bold' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {/* Active Indicator Bar on top of active icon */}
              {isActive && (
                <span className="w-6 h-1 rounded-full bg-teal-500 dark:bg-teal-400 mb-1 shadow-xs dark:shadow-[0_0_8px_#2dd4bf] animate-in fade-in zoom-in-50 duration-200" />
              )}
              
              <div className={`p-1 rounded-xl transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-teal-600 dark:text-teal-300 stroke-[2.2]' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 stroke-[1.7]'}`} />
              </div>
              <span className={`text-[11px] tracking-wide mt-0.5 ${isActive ? 'text-teal-600 dark:text-teal-300 font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
