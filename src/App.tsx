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
  Dumbbell
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
  Bar
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface UserProfile {
  id: number;
  username: string;
  age: number;
  gender: string;
}

interface Exercise {
  id: number;
  name: string;
  category: string;
}

interface ActivityLog {
  id: number;
  exercise_name: string;
  duration: number;
  date: string;
}

interface DailyStat {
  date: string;
  total_duration: number;
}

// --- Components ---

const Card = ({ children, className, onClick, ...props }: { children: React.ReactNode; className?: string; onClick?: () => void; [key: string]: any }) => (
  <div 
    {...props}
    onClick={onClick}
    className={cn("bg-white rounded-2xl border border-black/5 shadow-sm p-6", className)}
  >
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  className,
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
  type?: 'button' | 'submit';
}) => {
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-700",
    secondary: "bg-zinc-900 text-white hover:bg-zinc-800",
    outline: "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
  };

  return (
    <button 
      type={type}
      onClick={onClick}
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

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'profile' | 'dashboard' | 'track' | 'suggest'>('profile');
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('other');
  const [error, setError] = useState('');
  
  const [recommendations, setRecommendations] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<DailyStat[]>([]);
  
  // Modal state for logging from suggestions
  const [logModal, setLogModal] = useState<{ exercise: string; open: boolean }>({ exercise: '', open: false });

  const fetchUserData = useCallback(async (u: UserProfile) => {
    try {
      const [recRes, logRes, statRes] = await Promise.all([
        fetch(`/api/recommendations?age=${u.age}&gender=${u.gender}`),
        fetch(`/api/logs/${u.id}`),
        fetch(`/api/stats/${u.id}`)
      ]);
      
      if (recRes.ok) setRecommendations(await recRes.json());
      if (logRes.ok) setLogs(await logRes.json());
      if (statRes.ok) setStats(await statRes.json());
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  }, []);

  // Auth check on load
  useEffect(() => {
    const savedUser = localStorage.getItem('fittrack_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setView('dashboard');
      fetchUserData(parsed);
    }
  }, [fetchUserData]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (authMode === 'signup') {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, age: parseInt(age), gender })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem('fittrack_user', JSON.stringify(data));
        setView('dashboard');
        fetchUserData(data);
      } else {
        setError('Failed to create profile. Username might be taken.');
      }
    } else {
      const res = await fetch(`/api/user/${username}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        localStorage.setItem('fittrack_user', JSON.stringify(data));
        setView('dashboard');
        fetchUserData(data);
      } else {
        setError('User not found. Please check your username or sign up.');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fittrack_user');
    setUser(null);
    setView('profile');
    setUsername('');
    setAge('');
    setGender('other');
  };

  const handleLogActivity = async (exerciseName: string, duration: number) => {
    if (!user) return;
    const date = new Date().toISOString().split('T')[0];
    const res = await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id, exercise_name: exerciseName, duration, date })
    });
    if (res.ok) {
      fetchUserData(user);
      setLogModal({ exercise: '', open: false });
      setView('dashboard');
    }
  };

  if (!user || view === 'profile') {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4 font-sans">
        <Card className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity size={32} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900">Welcome to FitTrack</h1>
            <p className="text-zinc-500 mt-2">Simple, inclusive exercise tracking for everyone.</p>
          </div>

          <div className="flex bg-zinc-100 p-1 rounded-xl mb-6">
            <button 
              onClick={() => setAuthMode('signup')}
              className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", authMode === 'signup' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
            >
              Sign Up
            </button>
            <button 
              onClick={() => setAuthMode('login')}
              className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", authMode === 'login' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700")}
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
              <label className="block text-sm font-medium text-zinc-700 mb-1">Username</label>
              <input 
                required
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Enter your name"
              />
            </div>
            {authMode === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Age</label>
                  <input 
                    required
                    type="number" 
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Years"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Gender</label>
                  <select 
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all bg-white"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full mt-4">
              {authMode === 'signup' ? 'Create Profile' : 'Login'}
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-black/5 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
          <Activity size={24} />
          <span>FitTrack</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-zinc-900">{user.username}</p>
            <p className="text-xs text-zinc-500">{user.age}y · {user.gender}</p>
          </div>
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
        {view === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <TrendingUp size={20} className="text-emerald-500" />
                    Weekly Activity
                  </h2>
                  <span className="text-xs text-zinc-400">Last 7 days (minutes)</span>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                      />
                      <Bar dataKey="total_duration" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <Dumbbell size={20} className="text-blue-500" />
                  Quick Actions
                </h2>
                <div className="space-y-3">
                  <button 
                    onClick={() => setView('track')}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <PlusCircle size={20} />
                      <span className="font-medium">Log Activity</span>
                    </div>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => setView('suggest')}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Activity size={20} />
                      <span className="font-medium">Get Suggestions</span>
                    </div>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </Card>
            </div>

            <Card>
              <h2 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
                <Calendar size={20} className="text-purple-500" />
                Recent Logs
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                      <th className="pb-3">Exercise</th>
                      <th className="pb-3">Duration</th>
                      <th className="pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-zinc-500 italic">No activities logged yet.</td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id} className="text-sm text-zinc-600">
                          <td className="py-4 font-medium text-zinc-900">{log.exercise_name}</td>
                          <td className="py-4 flex items-center gap-1">
                            <Clock size={14} />
                            {log.duration} min
                          </td>
                          <td className="py-4 text-zinc-400">{log.date}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {view === 'track' && (
          <div className="max-w-md mx-auto">
            <Card>
              <h2 className="text-xl font-bold text-zinc-900 mb-6">Log Daily Activity</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleLogActivity(
                  formData.get('exercise') as string,
                  parseInt(formData.get('duration') as string)
                );
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Exercise Name</label>
                  <input 
                    name="exercise"
                    required
                    type="text" 
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. Morning Walk"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Duration (minutes)</label>
                  <input 
                    name="duration"
                    required
                    type="number" 
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none"
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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-zinc-900">Recommended for You</h2>
              <Button variant="outline" onClick={() => setView('dashboard')}>Back to Dashboard</Button>
            </div>
            <p className="text-zinc-500">Based on your profile ({user.age}y, {user.gender}), here are some safe and effective activities:</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => (
                <Card key={rec.id} className="hover:border-emerald-200 transition-colors cursor-pointer group" onClick={() => {
                  setLogModal({ exercise: rec.name, open: true });
                }}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Dumbbell size={24} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 bg-zinc-100 px-2 py-1 rounded">
                      {rec.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">{rec.name}</h3>
                  <p className="text-sm text-zinc-500">Perfect for your age group and fitness level.</p>
                  <div className="mt-4 flex items-center text-emerald-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    Log this activity <ChevronRight size={16} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Log Modal */}
      {logModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Log Activity</h3>
            <p className="text-zinc-500 mb-6">How long did you do <strong>{logModal.exercise}</strong>?</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Duration (minutes)</label>
                <input 
                  autoFocus
                  type="number" 
                  defaultValue="30"
                  id="modal-duration"
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-emerald-500 outline-none"
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

      {/* Bottom Nav (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 px-6 py-3 flex justify-around items-center sm:hidden">
        <button onClick={() => setView('dashboard')} className={cn("p-2", view === 'dashboard' ? "text-emerald-600" : "text-zinc-400")}>
          <TrendingUp size={24} />
        </button>
        <button onClick={() => setView('track')} className={cn("p-2", view === 'track' ? "text-emerald-600" : "text-zinc-400")}>
          <PlusCircle size={24} />
        </button>
        <button onClick={() => setView('suggest')} className={cn("p-2", view === 'suggest' ? "text-emerald-600" : "text-zinc-400")}>
          <Activity size={24} />
        </button>
      </nav>
    </div>
  );
}
