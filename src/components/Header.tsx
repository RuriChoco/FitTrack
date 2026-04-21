import React, { useState, useEffect, useRef } from 'react';
import { Activity, User, Flame, Sun, Moon, Users, Settings, LogOut, Dumbbell } from 'lucide-react';
import { type UserProfile } from '../api';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  user: UserProfile;
  streak: number;
  isDark: boolean;
  toggleTheme: () => void;
  setView: (view: any) => void;
  handleLogout: () => void;
}

export function Header({ user, streak, isDark, toggleTheme, setView, handleLogout }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50 transition-colors">
      <div className="flex items-center gap-2 text-emerald-600 font-bold text-base sm:text-xl tracking-tight">
        <Activity size={24} className="shrink-0" />
        <span className="hidden xs:inline">Exercise Tracking System</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-orange-100 dark:border-orange-800 transition-colors" title="Current Streak">
          <Flame size={16} className={streak > 0 ? "fill-orange-500 text-orange-500" : ""} />
          <span className="font-bold text-sm">{streak} <span className="hidden sm:inline">Day{streak !== 1 && 's'}</span></span>
        </div>
        <div className="relative flex items-center gap-3" ref={dropdownRef}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium">{user.username}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.age}y · {user.gender}</p>
          </div>
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="rounded-full transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                <User size={20} />
              </div>
            )}
          </button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-12 mt-2 w-48 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden z-50"
              >
                <div className="py-1">
                  <button onClick={() => { setView('settings'); setDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors"><Settings size={16} />Settings</button>
                  {user.is_admin && (
                    <button onClick={() => { setView('admin'); setDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 transition-colors"><Users size={16} />Admin</button>
                  )}
                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                  <button onClick={() => { handleLogout(); setDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors"><LogOut size={16} />Log out</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button 
          onClick={toggleTheme}
          className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors"
          title="Toggle Theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          onClick={() => setView('suggest')}
          className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors hidden sm:block"
          title="Activity Suggestions"
        >
          <Dumbbell size={20} />
        </button>
      </div>
    </header>
  );
}
