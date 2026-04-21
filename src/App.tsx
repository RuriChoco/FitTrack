import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { api, type UserProfile, type Exercise, type ActivityLog, type DailyStat, type WeeklyGoal, type Achievement, type WeightLog } from './api';
import { calculateStreak } from './utils';
import { Card, Button } from './ui';
import { motion, AnimatePresence } from 'motion/react';

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
import { AchievementCelebration } from './components/AchievementCelebration';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'profile' | 'dashboard' | 'track' | 'suggest' | 'settings' | 'admin' | 'achievements'>('profile');
  
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isOnboardingSaving, setIsOnboardingSaving] = useState(false);

  
  const [logModal, setLogModal] = useState<{ exercise: string; open: boolean }>({ exercise: '', open: false });
  const [editModal, setEditModal] = useState<{ log: ActivityLog | null; open: boolean }>({ log: null, open: false });
  const [logWeightModal, setLogWeightModal] = useState(false);
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);

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
        if (achRes.ok) {
          const newAchData = await achRes.json();
          setAchievements(prev => {
            // Find newly earned achievements
            const prevIds = new Set(prev.map(a => a.id));
            const justEarned = newAchData.filter((a: Achievement) => !prevIds.has(a.id));
            
            if (justEarned.length > 0 && prev.length > 0) {
              setPendingAchievements(current => [...current, ...justEarned]);
            }
            return newAchData;
          });
        }
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

  useEffect(() => {
    const hasSkipped = user ? localStorage.getItem(`fittrack_skip_onboarding_${user.id}`) === 'true' : false;
    if (user && (user.weight == null || user.target_weight == null) && !hasSkipped) {
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [user]);



  const isAnyModalOpen = showOnboarding || logModal.open || editModal.open || logWeightModal || confirmDialog !== null;

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAnyModalOpen]);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLogModal(prev => prev.open ? { ...prev, open: false } : prev);
        setEditModal(prev => prev.open ? { ...prev, open: false } : prev);
        setLogWeightModal(false);
        setConfirmDialog(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const renderToast = () => (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
            toast.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200' : 
            toast.type === 'error' ? 'bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200' : 
            'bg-blue-50 dark:bg-blue-950/80 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />}
          {toast.type === 'error' && <AlertCircle size={18} className="text-red-600 dark:text-red-400" />}
          {toast.type === 'info' && <Info size={18} className="text-blue-600 dark:text-blue-400" />}
          {toast.message}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!user || view === 'profile') {
    return (
      <>
        <ProfileView 
          onLoginSuccess={(u, t) => {
            setUser(u);
            localStorage.setItem('fittrack_token', t);
            setView('dashboard');
          }} 
          isDark={isDark} 
          toggleTheme={toggleTheme} 
          showToast={showToast} 
        />
        {renderToast()}
        
        <AchievementCelebration 
          achievement={pendingAchievements[0] || null} 
          onClose={() => setPendingAchievements(prev => prev.slice(1))}
        />
      </>
    );
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

        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {view === 'dashboard' && (
              <DashboardView 
                user={user} stats={stats} logs={logs} weightLogs={weightLogs} 
                goal={goal} achievements={achievements} setView={setView} 
                setLogModal={setLogModal} setLogWeightModal={setLogWeightModal} 
                setEditModal={setEditModal} handleDeleteLog={handleDeleteLog} 
                handleStatsRangeChange={handleStatsRangeChange} statsRange={statsRange} 
                isDark={isDark} recommendations={recommendations}
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
          </motion.div>
        </AnimatePresence>

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

      <AnimatePresence>
        {showOnboarding && user && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md"
            >
              <Card className="w-full relative">
            <h2 className="text-2xl font-bold mb-2">Welcome to FitTrack, {user.username}! 🎉</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6 text-sm">Let's set up your fitness profile so we can properly track your goals and progress.</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsOnboardingSaving(true);
              const formData = new FormData(e.currentTarget);
              const weight = parseFloat(formData.get('weight') as string);
              const target_weight = parseFloat(formData.get('target_weight') as string);
              const weight_unit = formData.get('weight_unit') as string;
              const height = parseFloat(formData.get('height') as string);
              const height_unit = formData.get('height_unit') as string;
              const age = parseInt(formData.get('age') as string);
              const gender = formData.get('gender') as string;
              const weekly_goal = parseInt(formData.get('weekly_goal') as string);
              const goal_type = formData.get('goal_type') as string;

              const res = await api.updateProfile({ age, gender, height, height_unit, weight, target_weight, weight_unit, weekly_goal, goal_type });
              if (res.ok) {
                const updatedUser = await res.json();
                setUser(updatedUser);
                fetchUserData(updatedUser);
                setShowOnboarding(false);
                showToast('Profile setup complete!', 'success');
              } else {
                const data = await res.json();
                showToast(data.error || 'Failed to save profile setup', 'error');
              }
              setIsOnboardingSaving(false);
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Current Weight</label>
                  <input name="weight" type="number" step="0.1" required placeholder="e.g. 150" className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Weight</label>
                  <input name="target_weight" type="number" step="0.1" required placeholder="e.g. 140" className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <select name="weight_unit" defaultValue="lbs" className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-zinc-900">
                    <option value="lbs">lbs</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Goal Type</label>
                  <select name="goal_type" defaultValue="maintain" className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-zinc-900">
                    <option value="maintain">Maintain</option>
                    <option value="lose_weight">Lose Weight</option>
                    <option value="build_muscle">Build Muscle</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Height</label>
                  <input name="height" type="number" step="0.1" required placeholder="e.g. 69" className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Height Unit</label>
                  <select name="height_unit" defaultValue="in" className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-zinc-900">
                    <option value="in">in</option>
                    <option value="cm">cm</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input name="age" type="number" defaultValue={user.age} required className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select name="gender" defaultValue={user.gender} className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-zinc-900">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weekly Activity Goal (minutes)</label>
                <input name="weekly_goal" type="number" defaultValue="150" required className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 flex items-center justify-center gap-2" disabled={isOnboardingSaving}>
                  {isOnboardingSaving && <Loader2 size={16} className="animate-spin" />}
                  {isOnboardingSaving ? 'Saving...' : 'Save Profile'}
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  localStorage.setItem(`fittrack_skip_onboarding_${user.id}`, 'true');
                  setShowOnboarding(false);
                  showToast('You can update your goals later in Settings.', 'info');
                }} disabled={isOnboardingSaving}>
                  Skip for now
                </Button>
              </div>
            </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AchievementCelebration 
        achievement={pendingAchievements[0] || null} 
        onClose={() => setPendingAchievements(prev => prev.slice(1))}
      />

      {renderToast()}
    </div>
  );
}
