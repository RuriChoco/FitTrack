import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { Dumbbell, ChevronRight } from 'lucide-react';
import { type UserProfile, type Exercise } from '../api';
import { cn } from '../utils';

interface SuggestViewProps {
  user: UserProfile;
  recommendations: Exercise[];
  setView: (view: any) => void;
  setLogModal: (modal: { exercise: string; open: boolean }) => void;
}

export function SuggestView({ user, recommendations, setView, setLogModal }: SuggestViewProps) {
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  const filteredRecommendations = difficultyFilter === 'All'
    ? recommendations
    : recommendations.filter(r => r.difficulty === difficultyFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Recommended for You</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-zinc-900"
          >
            <option value="All">All Difficulties</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <Button variant="outline" onClick={() => setView('dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
      <p className="text-zinc-500 dark:text-zinc-400">Based on your profile ({user.age}y, {user.gender}), here are some safe and effective activities:</p>
      
      {filteredRecommendations.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          No recommendations found for this difficulty level.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((rec) => (
          <Card key={rec.id} className="hover:border-emerald-200 dark:hover:border-emerald-700/50 transition-colors cursor-pointer group" onClick={() => {
            setLogModal({ exercise: rec.name, open: true });
          }}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Dumbbell size={24} />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 items-end sm:items-center">
                {rec.difficulty && (
                  <span className={cn(
                    "text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors",
                    rec.difficulty === 'Beginner' ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" :
                    rec.difficulty === 'Intermediate' ? "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" :
                    "text-rose-600 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400"
                  )}>
                    {rec.difficulty}
                  </span>
                )}
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded transition-colors">
                  {rec.category}
                </span>
              </div>
            </div>
            <h3 className="text-lg font-bold mb-1">{rec.name}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Perfect for your age group and fitness level.</p>
            <div className="mt-4 flex items-center text-emerald-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              Log this activity <ChevronRight size={16} />
            </div>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
