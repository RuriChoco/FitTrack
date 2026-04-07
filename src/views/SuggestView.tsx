import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { Dumbbell, ChevronRight, Heart, Zap, Activity, Shield, Target } from 'lucide-react';
import { type UserProfile, type Exercise } from '../api';
import { cn, calculateBMI, getBMICategory } from '../utils';

interface SuggestViewProps {
  user: UserProfile;
  recommendations: Exercise[];
  setView: (view: any) => void;
  setLogModal: (modal: { exercise: string; open: boolean }) => void;
}

const DESCRIPTIONS: Record<string, string> = {
  'Brisk Walking':            'Low-impact aerobic exercise great for heart health and burning calories.',
  'Chair Aerobics':           'Seated cardio moves perfect for improving circulation and energy levels.',
  'Slow Jogging':             'Easy-paced run to build cardiovascular endurance without joint strain.',
  'Jump Rope':                'Full-body cardio that boosts coordination, agility, and stamina fast.',
  'Cycling (Leisure)':        'Gentle cycling easy on joints while strengthening your legs and core.',
  'Water Aerobics':           'Low-impact pool workout for joint-friendly cardio and resistance training.',
  'Gentle Yoga':              'Calm, stretching-based practice to improve flexibility and reduce stress.',
  'Tai Chi':                  'Slow, flowing movements that improve balance, focus, and inner calm.',
  'Stretching Routine':       'Daily flexibility work to reduce muscle tension and improve posture.',
  'Foam Rolling':             'Self-massage technique to ease muscle soreness and speed up recovery.',
  'Balance Board':            'Improves proprioception and ankle stability for everyday movement.',
  'Wall Push-Ups':            'Upper-body pressing movement using the wall for accessible arm strength.',
  'Seated Leg Raises':        'Core and hip flexor activation you can do from your chair or mat.',
  'Glute Bridges':            'Hip-extension exercise that builds glutes and relieves lower back pain.',
  'Swimming':                 'Total-body workout that builds strength and endurance with zero impact.',
  'Dancing':                  'Fun cardio that improves rhythm, coordination, and mood simultaneously.',
  'Rowing Machine':           'Powerful full-body cardio that engages legs, core, and upper back.',
  'Stair Climbing':           'High calorie-burn cardio that targets glutes, quads, and calves.',
  'Cycling (Moderate)':       'Moderate-paced ride to build leg power and sustained aerobic capacity.',
  'Running':                  'Classic endurance exercise that strengthens your heart and burns fat.',
  'Resistance Band Training': 'Portable, joint-friendly resistance work for strength and mobility.',
  'Bodyweight Squats':        'Fundamental lower-body movement targeting quads, glutes, and core.',
  'Pilates':                  'Core-focused controlled movements for posture, balance, and stability.',
  'Dumbbell Rows':            'Back-strengthening pull movement that also trains biceps and grip.',
  'Lunges':                   'Unilateral leg exercise that builds balance and lower-body strength.',
  'Push-Ups':                 'Classic pressing exercise for chest, triceps, and shoulder strength.',
  'Plank Hold':               'Isometric core and shoulder stability drill for functional strength.',
  'HIIT Circuit':             'Alternating high-intensity bursts and rest periods to torch calories.',
  'Basketball':               'Fast-paced sport combining cardio, agility, and team coordination.',
  'Tennis / Badminton':       'Racquet sport mixing explosive sprints with upper-body coordination.',
  'Heavy Lifting':            'Compound barbell work for maximum muscle growth and raw strength gains.',
  'Sprinting Intervals':      'Max-effort short sprints that build explosive speed and peak VO2 max.',
  'CrossFit WOD':             'Varied high-intensity workouts combining lifting and cardio movements.',
  'Olympic Weightlifting':    'Technical barbell lifts for peak power and athletic performance.',
  'Triathlon Training':       'Swim-bike-run multi-sport endurance training for elite fitness.',
  'Rock Climbing':            'Grip-intensive full-body challenge that builds strength and problem-solving.',
  'Advanced Yoga (Ashtanga)': 'Dynamic flowing poses demanding strength, breath control, and focus.',
};

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  Cardio:      <Heart size={22} />,
  Strength:    <Dumbbell size={22} />,
  Flexibility: <Activity size={22} />,
  Balance:     <Shield size={22} />,
  HIIT:        <Zap size={22} />,
  Sports:      <Target size={22} />,
};

const CATEGORY_COLOR: Record<string, string> = {
  Cardio:      'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 group-hover:bg-rose-600 group-hover:text-white',
  Strength:    'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 group-hover:bg-emerald-600 group-hover:text-white',
  Flexibility: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 group-hover:bg-violet-600 group-hover:text-white',
  Balance:     'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 group-hover:bg-sky-600 group-hover:text-white',
  HIIT:        'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 group-hover:bg-orange-600 group-hover:text-white',
  Sports:      'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 group-hover:bg-amber-600 group-hover:text-white',
};

export function SuggestView({ user, recommendations, setView, setLogModal }: SuggestViewProps) {
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', ...Array.from(new Set(recommendations.map(r => r.category))).sort()];

  const filtered = recommendations.filter(r => {
    if (difficultyFilter !== 'All' && r.difficulty !== difficultyFilter) return false;
    if (categoryFilter !== 'All' && r.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Recommended for You</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Based on your profile ({user.age}y, {user.gender}) 
            {calculateBMI(user.weight, user.weight_unit, user.height, user.height_unit) && (
              <> &middot; BMI: <span className={cn("font-bold", getBMICategory(calculateBMI(user.weight, user.weight_unit, user.height, user.height_unit)).color)}>{calculateBMI(user.weight, user.weight_unit, user.height, user.height_unit)}</span></>
            )}
            &middot; {filtered.length} activities
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            id="suggestCategoryFilter"
            name="categoryFilter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-zinc-900"
          >
            {categories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
          <select
            id="suggestDifficultyFilter"
            name="difficultyFilter"
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

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 dark:text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <Dumbbell size={40} className="mx-auto mb-3 opacity-20" />
          <p>No activities match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((rec) => {
            const colorClass = CATEGORY_COLOR[rec.category] || CATEGORY_COLOR['Strength'];
            const icon = CATEGORY_ICON[rec.category] || <Dumbbell size={22} />;
            const description = DESCRIPTIONS[rec.name] || 'A great exercise for your fitness level and goals.';
            return (
              <Card
                key={rec.id}
                className="hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setLogModal({ exercise: rec.name, open: true })}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={cn('p-3 rounded-xl transition-colors', colorClass)}>
                    {icon}
                  </div>
                  <div className="flex flex-wrap gap-1.5 items-center justify-end">
                    {rec.difficulty && (
                      <span className={cn(
                        'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                        rec.difficulty === 'Beginner'     ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        rec.difficulty === 'Intermediate' ? 'text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400' :
                                                            'text-rose-700 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400'
                      )}>
                        {rec.difficulty}
                      </span>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                      {rec.category}
                    </span>
                  </div>
                </div>
                <h3 className="text-base font-bold mb-1.5">{rec.name}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{description}</p>
                <div className="mt-4 flex items-center text-emerald-600 text-sm font-semibold gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Log this activity <ChevronRight size={15} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
