import React from 'react';
import { Card, Button } from '../ui';

interface TrackViewProps {
  handleLogActivity: (exerciseName: string, duration: number) => void;
  setView: (view: any) => void;
}

export function TrackView({ handleLogActivity, setView }: TrackViewProps) {
  return (
    <div className="max-w-md mx-auto">
      <Card>
        <h2 className="text-xl font-bold mb-6">Log Daily Activity</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          handleLogActivity(
            formData.get('exercise') as string,
            parseInt(formData.get('duration') as string)
          );
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Exercise Name</label>
            <input 
              name="exercise"
              list="exercise-suggestions"
              required
              type="text" 
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
              placeholder="e.g. Morning Walk"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Duration (minutes)</label>
            <input 
              name="duration"
              required
              type="number" 
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
              placeholder="30"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">Save Log</Button>
            <Button variant="outline" type="button" onClick={() => setView('dashboard')}>Cancel</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
