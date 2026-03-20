import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Activity, 
  User, 
  TrendingUp, 
  PlusCircle, 
  ChevronRight, 
  LogOut,
  Calendar,
  Clock,
  Dumbbell,
  Trash2,
  Edit2,
  Target,
  Download,
  Settings,
  Filter,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Sun,
  Moon,
  Star,
  Medal,
  Award,
  Trophy,
  Flame,
  Users,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  ReferenceLine
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { api, type UserProfile, type Exercise, type ActivityLog, type DailyStat, type WeeklyGoal, type Achievement, type WeightLog } from './api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Card = ({ children, className, onClick, ...props }: { children: React.ReactNode; className?: string; onClick?: () => void; [key: string]: any }) => (
  <div 
    {...props}
    onClick={onClick}
    className={cn("bg-white dark:bg-zinc-900 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm p-6 transition-colors", className)}
  >
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  type = 'button',
  disabled
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) => {
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors",
    outline: "border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
  };

  return (
    <button 
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-6 py-2.5 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

// --- App ---

const calculateStreak = (logsList: ActivityLog[]) => {
  if (!logsList || logsList.length === 0) return 0;
  const uniqueDates = Array.from(new Set(logsList.map(l => l.date)));
  
  // Convert local JS date to YYYY-MM-DD matching our database format
  const getLocalStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  let currentStreak = 0;
  let checkDate = new Date();
  
  // Check if they worked out today, otherwise check yesterday
  if (uniqueDates.includes(getLocalStr(checkDate))) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    checkDate.setDate(checkDate.getDate() - 1);
    if (uniqueDates.includes(getLocalStr(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      return 0; // No logs today or yesterday, streak broken
    }
  }

  // Walk backwards day by day to count the continuous streak
  while (uniqueDates.includes(getLocalStr(checkDate))) {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return currentStreak;
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'profile' | 'dashboard' | 'track' | 'suggest' | 'settings' | 'admin'>('profile');
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('other');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [goalType, setGoalType] = useState('maintain');
  const [error, setError] = useState('');
  
  const [recommendations, setRecommendations] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [goal, setGoal] = useState<WeeklyGoal | null>(null);
  const [logsPage, setLogsPage] = useState(1);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [sortConfig, setSortConfig] = useState<{ field: keyof ActivityLog, direction: 'asc' | 'desc' }>({ field: 'date', direction: 'desc' });
  const [isDark, setIsDark] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [statsRange, setStatsRange] = useState<'week' | 'month'>('week');
  const statsRangeRef = useRef<'week' | 'month'>('week');
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [announcement, setAnnouncement] = useState<{message: string, date: string} | null>(null);
  const [adminAnnouncement, setAdminAnnouncement] = useState('');
  const [dismissedDate, setDismissedDate] = useState(localStorage.getItem('fittrack_dismissed_announcement') || '');
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  
  // Modal state for logging from suggestions
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

  const logsPerPage = 5;
  
  const filteredLogs = logs.filter(log => {
    if (filterStartDate && log.date < filterStartDate) return false;
    if (filterEndDate && log.date > filterEndDate) return false;
    return true;
  });

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const { field, direction } = sortConfig;
    let valA = a[field];
    let valB = b[field];

    if (typeof valA === 'string' && typeof valB === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedLogs.length / logsPerPage);
  
  useEffect(() => {
    if (logsPage > totalPages && totalPages > 0) {
      setLogsPage(totalPages);
    }
  }, [sortedLogs.length, totalPages, logsPage]);

  const indexOfLastLog = logsPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = sortedLogs.slice(indexOfFirstLog, indexOfLastLog);

  const usersPerPage = 5;
  const totalUsersPages = Math.ceil(allUsers.length / usersPerPage);
  
  useEffect(() => {
    if (usersPage > totalUsersPages && totalUsersPages > 0) {
      setUsersPage(totalUsersPages);
    }
  }, [allUsers.length, totalUsersPages, usersPage]);

  const indexOfLastUser = usersPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = allUsers.slice(indexOfFirstUser, indexOfLastUser);

  const filteredRecommendations = difficultyFilter === 'All'
    ? recommendations
    : recommendations.filter(r => r.difficulty === difficultyFilter);

  const handleSort = (field: keyof ActivityLog) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const renderSortIcon = (field: keyof ActivityLog) => {
    if (sortConfig.field !== field) return <ArrowUpDown size={14} className="text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-emerald-500" /> : <ChevronDown size={14} className="text-emerald-500" />;
  };

  const renderAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'Star': return <Star size={20} className="text-amber-500" />;
      case 'Medal': return <Medal size={20} className="text-emerald-500" />;
      case 'Award': return <Award size={20} className="text-purple-500" />;
      case 'Trophy': return <Trophy size={20} className="text-rose-500" />;
      default: return <Award size={20} className="text-blue-500" />;
    }
  };

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

  // Auth check on load
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

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (authMode === 'signup') {
      const res = await api.signup({ 
        username, 
        password, 
        age: parseInt(age), 
        gender,
        weight: weight ? parseFloat(weight) : undefined,
        target_weight: targetWeight ? parseFloat(targetWeight) : undefined,
        goal_type: goalType
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('fittrack_token', data.token);
        setView('dashboard');
      } else {
        setError('Failed to create profile. Username might be taken.');
      }
    } else {
      const res = await api.login({ username, password });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('fittrack_token', data.token);
        setView('dashboard');
      } else {
        setError('Invalid username or password. Please try again.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const res = await api.loginWithGoogle();
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
      localStorage.setItem('fittrack_token', data.token);
      setView('dashboard');
    } else {
      const data = await res.json();
      setError(data.error || 'Google Sign-In failed.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fittrack_token');
    setUser(null);
    setView('profile');
    setUsername('');
    setPassword('');
    setAge('');
    setGender('other');
    setWeight('');
    setTargetWeight('');
    setGoalType('maintain');
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

  const fetchAdminData = async () => {
    const [countRes, usersRes] = await Promise.all([
      api.getTotalUsers(),
      api.getAllUsers()
    ]);
    if (countRes.ok) {
      const data = await countRes.json();
      setTotalUsers(data.count);
    }
    if (usersRes.ok) {
      const data = await usersRes.json();
      setAllUsers(data);
    }
  };

  const handleLogActivity = async (exerciseName: string, duration: number) => {
    if (!user) return;
    const date = new Date().toISOString().split('T')[0];
    const res = await api.logActivity({ user_id: user.id, exercise_name: exerciseName, duration, date });
    if (res.ok) {
      setLogModal({ exercise: '', open: false });
      setView('dashboard');
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('Are you sure you want to delete this log?')) return;
    await api.deleteLog(logId);
  };

  const handleUpdateLog = async (logId: string, exerciseName: string, duration: number, date: string) => {
    const res = await api.updateLog(logId, { exercise_name: exerciseName, duration, date });
    if (res.ok) {
      setEditModal({ log: null, open: false });
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to completely delete your account? This action cannot be undone.')) return;
    const res = await api.deleteProfile();
    if (res.ok) {
      handleLogout();
    } else {
      alert('Failed to delete account');
    }
  };

  const exportToPDF = () => {
    if (!user) return;
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('FitTrack Activity Report', 14, 22);
    
    doc.setFontSize(12);
    doc.text(`User: ${user.username}`, 14, 32);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 38);

    const tableData = sortedLogs.map(log => [
      log.date,
      log.exercise_name,
      `${log.duration} min`
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Date', 'Exercise', 'Duration']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] } // Emerald-500 to match theme
    });

    doc.save(`FitTrack_Report_${user.username}.pdf`);
  };

  const uniqueExercises = Array.from(new Set([
    ...recommendations.map(r => r.name),
    ...logs.map(l => l.exercise_name)
  ])).sort();

  const streak = calculateStreak(logs);

  if (!user || view === 'profile') {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-900 dark:text-zinc-100 transition-colors">
        <Card className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity size={32} />
            </div>
            <h1 className="text-2xl font-bold">Welcome to FitTrack</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Simple, inclusive exercise tracking for everyone.</p>
          </div>

          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl mb-6 transition-colors">
            <button 
              onClick={() => {
                setAuthMode('signup');
                setError('');
              }}
              className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", authMode === 'signup' ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300")}
            >
              Sign Up
            </button>
            <button 
              onClick={() => {
                setAuthMode('login');
                setError('');
              }}
              className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", authMode === 'login' ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300")}
            >
              Login
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Username</label>
              <input 
                required
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
              <input 
                required
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Enter your password"
              />
            </div>
            {authMode === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Age</label>
                  <input 
                    required
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Years"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Gender</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-all [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            )}
            {authMode === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Current Weight</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target Weight</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Optional"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Fitness Goal</label>
                  <select 
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-all [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                  >
                    <option value="maintain">Maintain Weight</option>
                    <option value="lose_weight">Lose Weight</option>
                    <option value="build_muscle">Build Muscle</option>
                  </select>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full mt-4">
              {authMode === 'signup' ? 'Create Profile' : 'Login'}
            </Button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <hr className="w-full border-zinc-200 dark:border-zinc-800" />
            <span className="px-3 text-xs text-zinc-400 uppercase tracking-wider">OR</span>
            <hr className="w-full border-zinc-200 dark:border-zinc-800" />
          </div>

          <Button 
            variant="outline" 
            onClick={handleGoogleSignIn} 
            className="w-full mt-6 flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 41.939 C -8.804 40.009 -11.514 38.989 -14.754 38.989 C -19.444 38.989 -23.494 41.689 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
              </g>
            </svg>
            Sign in with Google
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans pb-20 text-zinc-900 dark:text-zinc-100 transition-colors">
      {/* Header */}
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
              onClick={() => { setView('admin'); fetchAdminData(); }}
              className="p-2 text-zinc-400 hover:text-blue-500 transition-colors"
              title="Admin Dashboard"
            >
              <Users size={20} />
            </button>
          )}
          <button 
            onClick={() => setView('settings')}
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

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <datalist id="exercise-suggestions">
          {uniqueExercises.map((ex, i) => (
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp size={20} className="text-emerald-500" />
                      Activity Stats
                    </h2>
                    <div className="flex items-center gap-2">
                      <select 
                        value={statsRange}
                        onChange={(e) => handleStatsRangeChange(e.target.value as 'week' | 'month')}
                        className="text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 outline-none text-zinc-600 dark:text-zinc-300 transition-colors [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                      >
                        <option value="week">Last 7 days</option>
                        <option value="month">Last 30 days</option>
                      </select>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:inline">(minutes)</span>
                    </div>
                  </div>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                        <Tooltip 
                          cursor={{fill: isDark ? '#27272a' : '#f8fafc'}}
                          contentStyle={{backgroundColor: isDark ? '#18181b' : 'white', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: isDark ? 'white' : 'black'}}
                        />
                        <Bar dataKey="total_duration" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                
                <Card>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold flex items-center gap-2">
                      <TrendingUp size={20} className="text-blue-500" />
                      Weight Progress
                    </h2>
                  </div>
                  <div className="h-64 w-full">
                    {weightLogs.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weightLogs}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                          <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} width={40} />
                          <Tooltip 
                            cursor={{stroke: isDark ? '#27272a' : '#f8fafc', strokeWidth: 2}}
                            contentStyle={{backgroundColor: isDark ? '#18181b' : 'white', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: isDark ? 'white' : 'black'}}
                          />
                          {user?.target_weight && (
                            <ReferenceLine y={user.target_weight} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Target', position: 'top', fill: '#10b981', fontSize: 12, fontWeight: 500 }} />
                          )}
                          <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} activeDot={{r: 6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-sm text-zinc-400 italic">No weight logs yet. Log your weight to see progress!</div>
                    )}
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Dumbbell size={20} className="text-blue-500" />
                    Quick Actions
                  </h2>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setView('track')}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <PlusCircle size={20} />
                        <span className="font-medium">Log Activity</span>
                      </div>
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                      onClick={() => setView('suggest')}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <Activity size={20} />
                        <span className="font-medium">Get Suggestions</span>
                      </div>
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button 
                      onClick={() => setLogWeightModal(true)}
                      className="w-full flex items-center justify-between p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <PlusCircle size={20} />
                        <span className="font-medium">Log Weight</span>
                      </div>
                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </Card>

                {goal && (
                  <Card>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                      <Target size={20} className="text-orange-500" />
                      Weekly Goal
                    </h2>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">Progress</span>
                        <span className="font-medium">{goal.current_weekly_total} / {goal.target_goal} min</span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-orange-500 h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${Math.min((goal.current_weekly_total / goal.target_goal) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2 text-center">
                        {goal.current_weekly_total >= goal.target_goal ? "Goal reached! Amazing job! 🎉" : `Keep it up! ${goal.target_goal - goal.current_weekly_total} mins to go.`}
                      </p>
                    </div>
                  </Card>
                )}

                <Card>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Award size={20} className="text-purple-500" />
                    Achievements
                  </h2>
                  {achievements.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4 italic">Log activities to earn badges!</p>
                  ) : (
                    <div className="space-y-3">
                      {achievements.map(ach => (
                        <div key={ach.id} className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 transition-colors">
                          <div className="bg-white dark:bg-zinc-900 p-2 rounded-lg shadow-sm border border-zinc-100 dark:border-zinc-800">
                            {renderAchievementIcon(ach.icon)}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold">{ach.name}</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{ach.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>

            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <Calendar size={20} className="text-purple-500" />
                  Recent Logs
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800 transition-colors">
                    <Filter size={14} className="text-zinc-400 dark:text-zinc-500" />
                    <input 
                      type="date" 
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="bg-transparent text-zinc-600 dark:text-zinc-300 outline-none w-full sm:w-auto [color-scheme:light] dark:[color-scheme:dark]"
                      title="Start Date"
                    />
                    <span className="text-zinc-400 dark:text-zinc-500">-</span>
                    <input 
                      type="date" 
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="bg-transparent text-zinc-600 dark:text-zinc-300 outline-none w-full sm:w-auto [color-scheme:light] dark:[color-scheme:dark]"
                      title="End Date"
                    />
                    {(filterStartDate || filterEndDate) && (
                      <button 
                        onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
                        className="text-zinc-400 hover:text-zinc-600 transition-colors ml-1 font-bold text-lg leading-none"
                        title="Clear Filters"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <Button variant="outline" onClick={exportToPDF} className="px-3 py-1.5 text-sm flex items-center gap-2">
                    <Download size={16} /> Export PDF
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 transition-colors">
                      <th className="pb-3 cursor-pointer group hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors" onClick={() => handleSort('exercise_name')}>
                        <div className="flex items-center gap-1">Exercise {renderSortIcon('exercise_name')}</div>
                      </th>
                      <th className="pb-3 cursor-pointer group hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors" onClick={() => handleSort('duration')}>
                        <div className="flex items-center gap-1">Duration {renderSortIcon('duration')}</div>
                      </th>
                      <th className="pb-3 cursor-pointer group hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors" onClick={() => handleSort('date')}>
                        <div className="flex items-center gap-1">Date {renderSortIcon('date')}</div>
                      </th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 transition-colors">
                    {currentLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-zinc-500 dark:text-zinc-400 italic">
                          {(filterStartDate || filterEndDate) ? 'No activities found for this date range.' : 'No activities logged yet.'}
                        </td>
                      </tr>
                    ) : (
                      currentLogs.map((log) => (
                        <tr key={log.id} className="text-sm text-zinc-600 dark:text-zinc-300">
                          <td className="py-4 font-medium text-zinc-900 dark:text-zinc-100">{log.exercise_name}</td>
                          <td className="py-4 flex items-center gap-1">
                            <Clock size={14} />
                            {log.duration} min
                          </td>
                          <td className="py-4 text-zinc-400 dark:text-zinc-500">{log.date}</td>
                          <td className="py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditModal({ log, open: true })} className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors" title="Edit">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => handleDeleteLog(log.id)} className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 transition-colors">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, sortedLogs.length)} of {sortedLogs.length} logs
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setLogsPage(p => Math.max(1, p - 1))}
                      disabled={logsPage === 1}
                      className="px-3 py-1.5 text-sm"
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setLogsPage(p => Math.min(totalPages, p + 1))}
                      disabled={logsPage === totalPages}
                      className="px-3 py-1.5 text-sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </>
        )}

        {view === 'track' && (
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
                  <Button variant="outline" onClick={() => setView('dashboard')}>Cancel</Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {view === 'suggest' && (
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
        )}

        {view === 'settings' && (
          <div className="max-w-md mx-auto">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Account Settings</h2>
                <Button variant="outline" onClick={() => setView('dashboard')}>Back</Button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newAge = parseInt(formData.get('age') as string);
                const newGender = formData.get('gender') as string;
                const newPassword = formData.get('password') as string;
                const newAvatar = formData.get('avatar') as string;
                const newWeeklyGoal = parseInt(formData.get('weekly_goal') as string);
                const newWeight = parseFloat(formData.get('weight') as string);
                const newTargetWeight = parseFloat(formData.get('target_weight') as string);
                const newGoalType = formData.get('goal_type') as string;
                
                const updateData: any = { age: newAge, gender: newGender, avatar: newAvatar, weekly_goal: newWeeklyGoal, goal_type: newGoalType };
                if (newPassword) updateData.password = newPassword;
                if (!isNaN(newWeight)) updateData.weight = newWeight;
                if (!isNaN(newTargetWeight)) updateData.target_weight = newTargetWeight;

                const res = await api.updateProfile(updateData);
                if (res.ok) {
                  const updatedUser = await res.json();
                  setUser(updatedUser);
                  fetchUserData(updatedUser);
                  alert('Profile updated successfully!');
                } else {
                  alert('Failed to update profile');
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Username</label>
                  <input 
                    disabled
                    type="text" 
                    value={user.username}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 outline-none transition-colors"
                  />
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Username cannot be changed.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Age</label>
                  <input 
                    name="age"
                    required
                    type="number" 
                    defaultValue={user.age}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Weekly Goal (minutes)</label>
                  <input 
                    name="weekly_goal"
                    required
                    type="number" 
                    defaultValue={user.weekly_goal || 150}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Current Weight</label>
                  <input 
                    name="weight"
                    type="number" 
                    step="0.1"
                    defaultValue={user.weight || ''}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target Weight</label>
                  <input 
                    name="target_weight"
                    type="number" 
                    step="0.1"
                    defaultValue={user.target_weight || ''}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Gender</label>
                  <select 
                    name="gender"
                    defaultValue={user.gender}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Fitness Goal</label>
                  <select 
                    name="goal_type"
                    defaultValue={user.goal_type || 'maintain'}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                  >
                    <option value="maintain">Maintain Weight</option>
                    <option value="lose_weight">Lose Weight</option>
                    <option value="build_muscle">Build Muscle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Avatar URL (Optional)</label>
                  <input 
                    name="avatar"
                    type="url" 
                    defaultValue={user.avatar || ''}
                    placeholder="https://example.com/my-photo.jpg"
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">New Password</label>
                  <input 
                    name="password"
                    type="password" 
                    placeholder="Leave blank to keep current password"
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  />
                </div>
                <div className="pt-4 space-y-3">
                  <Button type="submit" className="w-full">Save Changes</Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={handleDeleteAccount}
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Delete Account
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {view === 'admin' && user.is_admin && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Users size={24} className="text-blue-500" />
                  Admin Dashboard
                </h2>
                <Button variant="outline" onClick={() => setView('dashboard')}>Back</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center transition-colors">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Total Registered Users</p>
                  <p className="text-5xl font-bold text-zinc-900 dark:text-zinc-100">
                    {totalUsers !== null ? totalUsers : '...'}
                  </p>
                </div>
                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800 transition-colors">
                  <h3 className="text-lg font-bold mb-4">Broadcast Announcement</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    await api.updateAnnouncement(adminAnnouncement);
                    setAdminAnnouncement('');
                    alert('Announcement broadcasted!');
                  }} className="space-y-3">
                    <textarea
                      value={adminAnnouncement}
                      onChange={e => setAdminAnnouncement(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                      placeholder="Type a message to all users..."
                      rows={3}
                      required
                    />
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">Broadcast</Button>
                      <Button type="button" variant="outline" onClick={async () => { await api.updateAnnouncement(''); alert('Announcement cleared'); }}>Clear</Button>
                    </div>
                  </form>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="text-lg font-bold mb-4">User Directory</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 transition-colors">
                      <th className="pb-3">User</th>
                      <th className="pb-3">Age</th>
                      <th className="pb-3">Gender</th>
                      <th className="pb-3">Goal</th>
                      <th className="pb-3 text-right">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 transition-colors">
                    {currentUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-500 dark:text-zinc-400 italic">No users found.</td>
                      </tr>
                    ) : (
                      currentUsers.map(u => (
                        <tr key={u.id} className="text-sm text-zinc-600 dark:text-zinc-300">
                          <td className="py-3 flex items-center gap-2">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.username} className="w-6 h-6 rounded-full object-cover border border-zinc-200 dark:border-zinc-700" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
                                <User size={12} />
                              </div>
                            )}
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{u.username}</span>
                          </td>
                          <td className="py-3">{u.age}</td>
                          <td className="py-3 capitalize">{u.gender}</td>
                          <td className="py-3">{u.weekly_goal}m</td>
                          <td className="py-3 text-right">
                            {u.is_admin ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded transition-colors">Admin</span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-1 rounded transition-colors">User</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalUsersPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 transition-colors">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, allUsers.length)} of {allUsers.length} users
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                      disabled={usersPage === 1}
                      className="px-3 py-1.5 text-sm"
                    >
                      Previous
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setUsersPage(p => Math.min(totalUsersPages, p + 1))}
                      disabled={usersPage === totalUsersPages}
                      className="px-3 py-1.5 text-sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

      </main>

      {/* Log Modal */}
      {logModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <h3 className="text-xl font-bold mb-2">Log Activity</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">How long did you do <strong>{logModal.exercise}</strong>?</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Duration (minutes)</label>
                <input 
                  autoFocus
                  type="number" 
                  defaultValue="30"
                  id="modal-duration"
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  className="flex-1"
                  onClick={() => {
                    const duration = parseInt((document.getElementById('modal-duration') as HTMLInputElement).value);
                    handleLogActivity(logModal.exercise, duration);
                  }}
                >
                  Log Now
                </Button>
                <Button variant="outline" onClick={() => setLogModal({ exercise: '', open: false })}>Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Log Weight Modal */}
      {logWeightModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <h3 className="text-xl font-bold mb-2">Log Weight</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">Keep track of your current weight.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Weight</label>
                <input 
                  autoFocus
                  type="number" 
                  step="0.1"
                  defaultValue={user?.weight || ''}
                  id="modal-weight"
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  className="flex-1"
                  onClick={async () => {
                    const weightVal = parseFloat((document.getElementById('modal-weight') as HTMLInputElement).value);
                    if (weightVal) {
                      await api.logWeight(weightVal);
                      if (user) fetchUserData({ ...user, weight: weightVal });
                      setLogWeightModal(false);
                    }
                  }}
                >
                  Save
                </Button>
                <Button variant="outline" onClick={() => setLogWeightModal(false)}>Cancel</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.open && editModal.log && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <h3 className="text-xl font-bold mb-6">Edit Activity</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdateLog(
                editModal.log!.id,
                formData.get('exercise') as string,
                parseInt(formData.get('duration') as string),
                formData.get('date') as string
              );
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Exercise Name</label>
                <input 
                  name="exercise"
                  list="exercise-suggestions"
                  required
                  type="text" 
                  defaultValue={editModal.log.exercise_name}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Duration (minutes)</label>
                <input 
                  name="duration"
                  required
                  type="number" 
                  defaultValue={editModal.log.duration}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Date</label>
                <input 
                  name="date"
                  required
                  type="date" 
                  defaultValue={editModal.log.date}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1">Update Log</Button>
                <Button variant="outline" onClick={() => setEditModal({ log: null, open: false })}>Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-black/5 dark:border-white/10 px-6 py-3 flex justify-around items-center sm:hidden transition-colors">
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
    </div>
  );
}
