import React from 'react';
import { Activity, User, Flame, Sun, Moon, Users, Settings, LogOut } from 'lucide-react';
import { type UserProfile } from '../api';

interface HeaderProps {
  user: UserProfile;
  streak: number;
  isDark: boolean;
  toggleTheme: () => void;
  setView: (view: any) => void;
  handleLogout: () => void;
}

export function Header({ user, streak, isDark, toggleTheme, setView, handleLogout }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-black/5 dark:border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-10 transition-colors">
      <div className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
        <Activity size={24} />
        <span>FitTrack</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-orange-100 dark:border-orange-800 transition-colors" title="Current Streak">
          <Flame size={16} className={streak > 0 ? "fill-orange-500 text-orange-500" : ""} />
          <span className="font-bold text-sm">{streak} <span className="hidden sm:inline">Day{streak !== 1 && 's'}</span></span>
        </div>
        <div className="flex items-center gap-3">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <User size={20} />
            </div>
          )}
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.age}y · {user.gender}</p>
          </div>
        </div>
        <button 
          onClick={toggleTheme}
          className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        {user.is_admin && (
          <button 
            onClick={() => { setView('admin'); }}
            className="p-2 text-zinc-400 hover:text-blue-500 transition-colors"
            title="Admin Dashboard"
          >
            <Users size={20} />
          </button>
        )}
        <button 
          onClick={() => { setView('settings'); }}
          className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors"
          title="Settings"
        >
          <Settings size={20} />
        </button>
        <button 
          onClick={handleLogout}
          className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
