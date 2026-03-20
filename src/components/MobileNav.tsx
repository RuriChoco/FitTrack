import React from 'react';
import { TrendingUp, PlusCircle, Activity } from 'lucide-react';
import { cn } from '../utils';

interface MobileNavProps {
  view: string;
  setView: (view: any) => void;
}

export function MobileNav({ view, setView }: MobileNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-black/5 dark:border-white/10 px-6 py-3 flex justify-around items-center sm:hidden transition-colors z-10">
      <button onClick={() => setView('dashboard')} className={cn("p-2 transition-colors", view === 'dashboard' ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500")}>
        <TrendingUp size={24} />
      </button>
      <button onClick={() => setView('track')} className={cn("p-2 transition-colors", view === 'track' ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500")}>
        <PlusCircle size={24} />
      </button>
      <button onClick={() => setView('suggest')} className={cn("p-2 transition-colors", view === 'suggest' ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-zinc-500")}>
        <Activity size={24} />
      </button>
    </nav>
  );
}
