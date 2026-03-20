import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { Award, Star, Medal, Trophy, Lock, Flame, Search, Filter } from 'lucide-react';
import { type Achievement } from '../api';
import { ALL_ACHIEVEMENTS } from '../data/achievements';
import { cn } from '../utils';

interface AchievementsViewProps {
  achievements: Achievement[];
  setView: (view: any) => void;
}

export function AchievementsView({ achievements, setView }: AchievementsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'earned' | 'locked'>('all');

  const earnedIds = new Set(achievements.map(a => a.id));
  const progressPercent = Math.round((earnedIds.size / ALL_ACHIEVEMENTS.length) * 100) || 0;

  const renderAchievementIcon = (iconName: string, earned: boolean) => {
    const iconClass = earned ? "" : "opacity-30 grayscale";
    switch (iconName) {
      case 'Star': return <Star size={24} className={cn(earned ? "text-amber-500" : "text-zinc-400", iconClass)} />;
      case 'Medal': return <Medal size={24} className={cn(earned ? "text-emerald-500" : "text-zinc-400", iconClass)} />;
      case 'Award': return <Award size={24} className={cn(earned ? "text-purple-500" : "text-zinc-400", iconClass)} />;
      case 'Trophy': return <Trophy size={24} className={cn(earned ? "text-rose-500" : "text-zinc-400", iconClass)} />;
      case 'Flame': return <Flame size={24} className={cn(earned ? "text-orange-500" : "text-zinc-400", iconClass)} />;
      default: return <Award size={24} className={cn(earned ? "text-blue-500" : "text-zinc-400", iconClass)} />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Award size={24} className="text-purple-500" />
            Your Achievements
          </h2>
          <Button variant="outline" onClick={() => setView('dashboard')}>Back</Button>
        </div>
        
        <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800 mb-8 text-center transition-colors">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Completion Progress</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            {earnedIds.size} / {ALL_ACHIEVEMENTS.length}
          </p>
          <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-purple-500 h-3 rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            {progressPercent}% Complete
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search achievements..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-purple-500 outline-none transition-colors text-sm text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
            <button onClick={() => setFilterType('all')} className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors", filterType === 'all' ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}>All</button>
            <button onClick={() => setFilterType('earned')} className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors", filterType === 'earned' ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}>Earned</button>
            <button onClick={() => setFilterType('locked')} className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors", filterType === 'locked' ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300")}>Locked</button>
          </div>
        </div>

        {ALL_ACHIEVEMENTS.filter(ach => {
          const isEarned = earnedIds.has(ach.id);
          if (filterType === 'earned' && !isEarned) return false;
          if (filterType === 'locked' && isEarned) return false;
          if (searchQuery && !ach.name.toLowerCase().includes(searchQuery.toLowerCase()) && !ach.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          return true;
        }).length === 0 ? (
          <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 italic bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
            No achievements found matching your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ALL_ACHIEVEMENTS.filter(ach => {
              const isEarned = earnedIds.has(ach.id);
              if (filterType === 'earned' && !isEarned) return false;
              if (filterType === 'locked' && isEarned) return false;
              if (searchQuery && !ach.name.toLowerCase().includes(searchQuery.toLowerCase()) && !ach.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
              return true;
            }).map(ach => {
              const earned = earnedIds.has(ach.id);
              return (
                <div 
                key={ach.id} 
                className={cn(
                  "p-4 rounded-xl border transition-colors flex items-center gap-4 relative overflow-hidden",
                  earned 
                    ? "bg-white dark:bg-zinc-900 border-emerald-200 dark:border-emerald-800/50 shadow-sm" 
                    : "bg-zinc-50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800"
                )}
              >
                {!earned && (
                  <div className="absolute -top-6 -right-6 w-16 h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center opacity-50 transform rotate-12">
                     <Lock size={16} className="text-zinc-400 translate-y-2 -translate-x-2" />
                  </div>
                )}
                <div className={cn(
                  "p-3 rounded-lg flex-shrink-0 transition-colors",
                  earned 
                    ? "bg-amber-50 dark:bg-amber-900/20" 
                    : "bg-zinc-200 dark:bg-zinc-800"
                )}>
                  {renderAchievementIcon(ach.icon, earned)}
                </div>
                <div className="flex-1">
                  <h3 className={cn("font-bold text-sm", earned ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400")}>
                    {ach.name}
                  </h3>
                  <p className={cn("text-xs mt-0.5", earned ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-400 dark:text-zinc-500")}>
                    {ach.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </Card>
    </div>
  );
}
