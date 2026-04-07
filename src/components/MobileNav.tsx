import React from 'react';
import { TrendingUp, PlusCircle, Activity } from 'lucide-react';
import { cn } from '../utils';

interface MobileNavProps {
  view: string;
  setView: (view: any) => void;
}

export function MobileNav({ view, setView }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-white/10 px-6 py-2 flex justify-around items-center sm:hidden transition-colors z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
      <button 
        onClick={() => setView('dashboard')} 
        className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300", 
          view === 'dashboard' ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 scale-105" : "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        )}
      >
        <TrendingUp size={20} className={cn("transition-transform", view === 'dashboard' ? "scale-110" : "")} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
      </button>
      <button 
        onClick={() => setView('track')} 
        className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300", 
          view === 'track' ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 scale-105" : "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        )}
      >
        <PlusCircle size={20} className={cn("transition-transform", view === 'track' ? "scale-110" : "")} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Log</span>
      </button>
      <button 
        onClick={() => setView('suggest')} 
        className={cn(
          "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300", 
          view === 'suggest' ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 scale-105" : "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        )}
      >
        <Activity size={20} className={cn("transition-transform", view === 'suggest' ? "scale-110" : "")} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Plan</span>
      </button>
    </nav>
  );
}
