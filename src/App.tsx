import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { api, type UserProfile, type Exercise, type ActivityLog, type DailyStat, type WeeklyGoal, type Achievement, type WeightLog } from './api';
import { calculateStreak } from './utils';

import { ProfileView } from './views/ProfileView';
import { DashboardView } from './views/DashboardView';
import { TrackView } from './views/TrackView';
import { SuggestView } from './views/SuggestView';
import { AdminView } from './views/AdminView';
import { SettingsView } from './views/SettingsView';
import { AchievementsView } from './views/AchievementsView';

import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { AppModals } from './components/AppModals';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'profile' | 'dashboard' | 'track' | 'suggest' | 'settings' | 'admin' | 'achievements'>('profile');
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);
  
  const [recommendations, setRecommendations] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [statsRange, setStatsRange] = useState<'week' | 'month'>('week');
  const statsRangeRef = useRef<'week' | 'month'>('week');
  const [announcement, setAnnouncement] = useState<{message: string, date: string} | null>(null);
  const [dismissedDate, setDismissedDate] = useState(localStorage.getItem('fittrack_dismissed_announcement') || '');
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  
  const [logModal, setLogModal] = useState<{ exercise: string; open: boolean }>({ exercise: '', open: false });
  const [editModal, setEditModal] = useState<{ log: ActivityLog | null; open: boolean }>({ log: null, open: false });
  const [logWeightModal, setLogWeightModal] = useState(false);

  const fetchUserData = useCallback(async (u: UserProfile) => {
    try {
      const [recRes, logRes, weightRes] = await Promise.all([
        api.getRecommendations(u.age, u.gender, u.goal_type),
        api.getLogs(u.id),
        api.getWeightLogs(u.id)
      ]);
      
      if (recRes.ok) setRecommendations(await recRes.json());
      if (weightRes.ok) setWeightLogs(await weightRes.json());
      
      if (logRes.ok) {
        const logsData = await logRes.json();
        setLogs(logsData);
        
        const [statRes, goalRes, achRes] = await Promise.all([
          api.getStats(logsData, statsRangeRef.current),
          api.getGoals(logsData, u.weekly_goal),
          api.getAchievements(logsData)
        ]);
        
        if (statRes.ok) setStats(await statRes.json());
        if (goalRes.ok) setGoal(await goalRes.json());
        if (achRes.ok) setAchievements(await achRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  }, []);

  const handleStatsRangeChange = async (range: 'week' | 'month') => {
    setStatsRange(range);
    statsRangeRef.current = range;
    if (user) {
      try {
        const res = await api.getStats(logs, range);
        if (res.ok) setStats(await res.json());
      } catch (err) { console.error(err); }
    }
  };

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = api.subscribeToActivityLogs(user.id, () => {
      if (userRef.current) fetchUserData(userRef.current);
    });
    return () => unsubscribe();
  }, [user?.id, fetchUserData]);

  useEffect(() => {
    const unsubscribe = api.subscribeToAnnouncement((data) => {
      setAnnouncement(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (localStorage.getItem('fittrack_theme') === 'dark' || (!('fittrack_theme' in localStorage) && window.matchMedia?.('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    const token = localStorage.getItem('fittrack_token');
    if (token) {
      api.getMe()
        .then(res => res.ok ? res.json() : Promise.reject('Invalid token'))
        .then(data => {
          setUser(data);
          setView('dashboard');
        })
        .catch(() => {
          localStorage.removeItem('fittrack_token');
        });
    }
  }, [fetchUserData]);

  const handleLogout = () => {
    localStorage.removeItem('fittrack_token');
    setUser(null);
    setView('profile');
  };

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fittrack_theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fittrack_theme', 'dark');
    }
    setIsDark(!isDark);
  };

  const handleLogActivity = async (exerciseName: string, duration: number) => {
    if (!user) return;
    const date = new Date().toISOString().split('T')[0];
    
    const newLog: ActivityLog = { id: 'temp-' + Date.now(), exercise_name: exerciseName, duration, date };
    const optimisticLogs = [newLog, ...logs].sort((a, b) => b.date.localeCompare(a.date));
    setLogs(optimisticLogs);
    
    api.getStats(optimisticLogs, statsRangeRef.current).then(async res => { if (res.ok) setStats(await res.json()); });
    api.getGoals(optimisticLogs, user.weekly_goal).then(async res => { if (res.ok) setGoal(await res.json()); });

    setLogModal({ exercise: '', open: false });
    setView('dashboard');
    showToast('Activity logged successfully!', 'success');

    const res = await api.logActivity({ user_id: user.id, exercise_name: exerciseName, duration, date });
    if (!res.ok) {
      showToast('Failed to log activity', 'error');
      if (userRef.current) fetchUserData(userRef.current);
    }
  };

  const handleDeleteLog = (logId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Activity Log',
      message: 'Are you sure you want to delete this log? This action cannot be undone.',
      onConfirm: async () => {
        if (!user) return;
        setConfirmDialog(null);
        showToast('Log deleted', 'success');

        const optimisticLogs = logs.filter(l => l.id !== logId);
        setLogs(optimisticLogs);
        api.getStats(optimisticLogs, statsRangeRef.current).then(async res => { if (res.ok) setStats(await res.json()); });
        api.getGoals(optimisticLogs, user.weekly_goal).then(async res => { if (res.ok) setGoal(await res.json()); });

        const res = await api.deleteLog(logId);
        if (!res.ok) {
          showToast('Failed to delete log', 'error');
          if (userRef.current) fetchUserData(userRef.current);
        }
      }
    });
  };

  const handleUpdateLog = async (logId: string, exerciseName: string, duration: number, date: string) => {
    if (!user) return;
    
    setEditModal({ log: null, open: false });
    showToast('Log updated successfully!', 'success');

    const optimisticLogs = logs.map(l => l.id === logId ? { ...l, exercise_name: exerciseName, duration, date } : l).sort((a, b) => b.date.localeCompare(a.date));
    setLogs(optimisticLogs);
    api.getStats(optimisticLogs, statsRangeRef.current).then(async res => { if (res.ok) setStats(await res.json()); });
    api.getGoals(optimisticLogs, user.weekly_goal).then(async res => { if (res.ok) setGoal(await res.json()); });

    const res = await api.updateLog(logId, { exercise_name: exerciseName, duration, date });
    if (!res.ok) {
      showToast('Failed to update log', 'error');
      if (userRef.current) fetchUserData(userRef.current);
    }
  };

  const streak = calculateStreak(logs);

  if (!user || view === 'profile') {
    return <ProfileView 
      onLoginSuccess={(u, t) => {
        setUser(u);
        localStorage.setItem('fittrack_token', t);
        setView('dashboard');
      }} 
      isDark={isDark} 
      toggleTheme={toggleTheme} 
      showToast={showToast} 
    />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans pb-20 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Header user={user} streak={streak} isDark={isDark} toggleTheme={toggleTheme} setView={setView} handleLogout={handleLogout} />

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <datalist id="exercise-suggestions">
          {Array.from(new Set([
            ...recommendations.map(r => r.name),
            ...logs.map(l => l.exercise_name)
          ])).sort().map((ex, i) => (
            <option key={i} value={ex} />
          ))}
        </datalist>

        {user && announcement && announcement.message && announcement.date !== dismissedDate && (
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-4 py-3 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center justify-between transition-colors shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xl" role="img" aria-label="announcement">📢</span>
              <span className="font-medium text-sm">{announcement.message}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs opacity-60 hidden sm:block">{new Date(announcement.date).toLocaleDateString()}</span>
              <button 
                onClick={() => {
                  setDismissedDate(announcement.date);
                  localStorage.setItem('fittrack_dismissed_announcement', announcement.date);
                }}
                className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded transition-colors"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <DashboardView 
            user={user} stats={stats} logs={logs} weightLogs={weightLogs} 
            goal={goal} achievements={achievements} setView={setView} 
            setLogModal={setLogModal} setLogWeightModal={setLogWeightModal} 
            setEditModal={setEditModal} handleDeleteLog={handleDeleteLog} 
            handleStatsRangeChange={handleStatsRangeChange} statsRange={statsRange} 
            isDark={isDark} 
          />
        )}
        {view === 'track' && (
          <TrackView handleLogActivity={handleLogActivity} setView={setView} />
        )}
        {view === 'suggest' && (
          <SuggestView user={user} recommendations={recommendations} setView={setView} setLogModal={setLogModal} />
        )}
        {view === 'settings' && (
          <SettingsView user={user} setUser={setUser} fetchUserData={fetchUserData} setView={setView} showToast={showToast} onAccountDeleted={handleLogout} />
        )}
        {view === 'admin' && (
          <AdminView user={user} setView={setView} showToast={showToast} />
        )}
        {view === 'achievements' && (
          <AchievementsView achievements={achievements} setView={setView} />
        )}

      </main>

      <AppModals 
        user={user} logModal={logModal} setLogModal={setLogModal} 
        logWeightModal={logWeightModal} setLogWeightModal={setLogWeightModal} 
        editModal={editModal} setEditModal={setEditModal} toast={toast} 
        confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} 
        handleLogActivity={handleLogActivity} handleUpdateLog={handleUpdateLog} 
        showToast={showToast} setWeightLogs={setWeightLogs} setUser={setUser} 
        fetchUserData={fetchUserData}
      />
      <MobileNav view={view} setView={setView} />
    </div>
  );
}
