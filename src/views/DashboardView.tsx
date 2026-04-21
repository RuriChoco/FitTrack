import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ReferenceLine
} from 'recharts';
import { Plus, Target, Trophy, Flame, Search, Filter, Pencil, Trash2, Clock, Activity, X, Award, Star, Medal, CheckCircle2, Sparkles, Dumbbell, Zap, Wind, ActivitySquare, StretchHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, Button } from '../ui';
import { type UserProfile, type ActivityLog, type DailyStat, type WeeklyGoal, type Achievement, type WeightLog, type Exercise } from '../api';
import { motion } from 'motion/react';
import { calculateBMI, getBMICategory, cn } from '../utils';

interface DashboardViewProps {
  user: UserProfile;
  stats: DailyStat[];
  logs: ActivityLog[];
  weightLogs: WeightLog[];
  goal: WeeklyGoal | null;
  achievements: Achievement[];
  setView: (view: any) => void;
  setLogModal: (modal: any) => void;
  setLogWeightModal: (open: boolean) => void;
  setEditModal: (modal: any) => void;
  handleDeleteLog: (id: string) => void;
  handleStatsRangeChange: (range: 'week' | 'month') => void;
  statsRange: 'week' | 'month';
  isDark: boolean;
  recommendations: Exercise[];
}

export const DashboardView = ({
  user, stats, logs, weightLogs, goal, achievements, setView,
  setLogModal, setLogWeightModal, setEditModal, handleDeleteLog,
  handleStatsRangeChange, statsRange, isDark, recommendations
}: DashboardViewProps) => {
  const [logsPage, setLogsPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(5);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const carouselRef = React.useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const renderAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'Star': return <Star size={20} />;
      case 'Medal': return <Medal size={20} />;
      case 'Award': return <Award size={20} />;
      case 'Trophy': return <Trophy size={20} />;
      case 'Flame': return <Flame size={20} />;
      default: return <Award size={20} />;
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterStartDate && log.date < filterStartDate) return false;
    if (filterEndDate && log.date > filterEndDate) return false;
    if (logSearchQuery && !log.exercise_name.toLowerCase().includes(logSearchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);
  const indexOfLastLog = logsPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const today = new Date();
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - 6 + i);
    return d.toISOString().split('T')[0];
  });

  const dayChecklist = last7Days.map(d => {
    const dayLogs = logs.filter(l => l.date === d);
    const totalMin = dayLogs.reduce((sum, l) => sum + l.duration, 0);
    const dayName = new Date(d).toLocaleDateString('en-US', { weekday: 'short' });
    return { date: d, dayName, totalMin };
  });

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { staggerChildren: 0.1 }
        }
      }}
    >
      {/* Welcome & Weekly Goal */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-3 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1 italic">Welcome back, {user.username}!</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 opacity-90 text-sm">
                <p>You've logged {logs.length} activities so far.</p>
                {user.weight && user.height && (
                  <>
                    <span className="hidden sm:inline-opacity-40">•</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">BMI: {calculateBMI(user.weight, user.weight_unit, user.height, user.height_unit)}</span>
                      <span className={cn("text-[10px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded-md bg-white/20", getBMICategory(calculateBMI(user.weight, user.weight_unit, user.height, user.height_unit)).color.replace('text-', 'text-white border-'))}>
                        {getBMICategory(calculateBMI(user.weight, user.weight_unit, user.height, user.height_unit)).label}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setLogModal({ exercise: '', open: true })} className="bg-white/20 hover:bg-white/30 text-white border-none flex items-center gap-2 group">
                <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Activity
              </Button>
              <Button variant="secondary" onClick={() => setLogWeightModal(true)} className="bg-white/20 hover:bg-white/30 text-white border-none flex items-center gap-2 group">
                <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Weight
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Weekly Progress Tracker */}
      <motion.div variants={itemVariants}>
        <Card className="border-emerald-100 dark:border-emerald-900/30">
          <h3 className="font-bold flex items-center gap-2 mb-6"><Target className="text-emerald-500" /> Weekly Progress Tracker</h3>
          
          <div className="flex flex-col md:flex-row gap-8 items-center">
            {/* 7-Day Checklist */}
            <div className="flex-1 w-full flex justify-between items-center bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              {dayChecklist.map((d, i) => (
                <div key={d.date} className="flex flex-col items-center gap-2">
                  <div 
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      d.totalMin > 0 
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' 
                        : d.date === today.toISOString().split('T')[0]
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500'
                          : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {d.totalMin > 0 ? <CheckCircle2 size={18} /> : d.dayName.charAt(0)}
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium opacity-70">{d.dayName}</span>
                </div>
              ))}
            </div>

            {/* Milestone Progress Bar */}
            <div className="flex-1 w-full relative">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Weekly Goal</p>
                  <h4 className="text-xl font-black">
                    {goal?.current_weekly_total || 0} <span className="text-sm font-normal opacity-70">/ {user.weekly_goal} min</span>
                  </h4>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold mb-1 text-emerald-600 dark:text-emerald-400">
                    {Math.round(((goal?.current_weekly_total || 0) / user.weekly_goal) * 100)}%
                  </p>
                  <p className="text-[10px] font-medium opacity-80 uppercase tracking-tight">
                    {((goal?.current_weekly_total || 0) / user.weekly_goal) >= 1 ? "Goal Smashed! 🎉" : 
                     ((goal?.current_weekly_total || 0) / user.weekly_goal) >= 0.75 ? "Almost there, finish strong! 💪" :
                     ((goal?.current_weekly_total || 0) / user.weekly_goal) >= 0.5 ? "Halfway point! Keep it up! ✨" :
                     ((goal?.current_weekly_total || 0) / user.weekly_goal) > 0 ? "Great start! Every minute counts. 🏃" : "Ready for your first session? ⚡"}
                  </p>
                </div>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-4 overflow-hidden p-1 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((goal?.current_weekly_total || 0) / user.weekly_goal) * 100)}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full relative"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]" />
                </motion.div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recommended for You Carousel */}
      {recommendations && recommendations.length > 0 && (
        <motion.div variants={itemVariants} className="relative">
          <div className="flex items-center justify-between mb-4 mt-2 px-1">
            <h3 className="font-bold flex items-center gap-2"><Sparkles className="text-amber-500" /> Recommended for You</h3>
            <div className="hidden sm:flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border-none transition-transform active:scale-95" onClick={() => scrollCarousel('left')}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 border-none transition-transform active:scale-95" onClick={() => scrollCarousel('right')}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
          
          <div className="relative group/carousel">
            {/* Fade edge indicators for mobile */}
            <div className="absolute left-0 top-0 bottom-6 w-6 bg-gradient-to-r from-zinc-50 dark:from-zinc-950 to-transparent z-10 pointer-events-none md:hidden" />
            <div className="absolute right-0 top-0 bottom-6 w-6 bg-gradient-to-l from-zinc-50 dark:from-zinc-950 to-transparent z-10 pointer-events-none md:hidden" />

            <div 
              ref={carouselRef}
              className="flex overflow-x-auto pb-6 gap-4 snap-x snap-mandatory hide-scrollbar -mx-2 px-2 sm:mx-0 sm:px-0 scroll-smooth"
            >
            {recommendations.slice(0, 6).map((rec, idx) => {
              const bgGradient = rec.category === 'Cardio' ? 'from-blue-500 to-cyan-400' :
                                rec.category === 'Strength' ? 'from-rose-500 to-orange-400' :
                                rec.category === 'Flexibility' ? 'from-violet-500 to-purple-400' :
                                rec.category === 'HIIT' ? 'from-amber-500 to-yellow-400' :
                                'from-emerald-500 to-teal-400';
              
              const CategoryIcon = rec.category === 'Cardio' ? ActivitySquare :
                                   rec.category === 'Strength' ? Dumbbell :
                                   rec.category === 'Flexibility' ? StretchHorizontal :
                                   rec.category === 'HIIT' ? Zap : Wind;

              return (
                <motion.div 
                  key={rec.id}
                  whileHover={{ scale: 1.02, y: -4 }}
                  className={`min-w-[240px] md:min-w-[280px] snap-center shrink-0 rounded-3xl bg-gradient-to-br ${bgGradient} text-white p-6 shadow-xl shadow-black/5 dark:shadow-black/20 relative overflow-hidden group cursor-pointer border border-white/10`}
                  onClick={() => setLogModal({ exercise: rec.name, open: true })}
                >
                  <div className="absolute -top-4 -right-4 p-4 opacity-20 group-hover:opacity-30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 pointer-events-none">
                    <CategoryIcon size={100} strokeWidth={1.5} />
                  </div>
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-8">
                      <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 bg-white/20 rounded-full backdrop-blur-md shadow-sm">
                        {rec.difficulty}
                      </span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md shadow-sm border-none" onClick={(e) => { e.stopPropagation(); setLogModal({ exercise: rec.name, open: true }); }}>
                        <Plus size={16} strokeWidth={3} />
                      </Button>
                    </div>
                    <div>
                      <h4 className="text-xl font-black mb-1 leading-tight tracking-tight drop-shadow-sm line-clamp-2">{rec.name}</h4>
                      <p className="text-sm font-semibold opacity-90 drop-shadow-sm flex items-center gap-1.5">
                        <CategoryIcon size={14} /> {rec.category}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Recharts Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants} className="h-full">
          <Card className="h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2"><Flame className="text-orange-500" /> Activity</h3>
            <select 
              id="dashboardStatsRange"
              name="statsRange"
              value={statsRange} 
              onChange={(e) => handleStatsRangeChange(e.target.value as 'week' | 'month')}
              className="text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 outline-none text-zinc-600 dark:text-zinc-300"
            >
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>
          <div className="h-64 w-full min-h-[16rem]">
            {logs.length > 0 ? (
              isMounted && (
                <ResponsiveContainer width="100%" height={256}>
                  <BarChart data={stats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                    <Tooltip 
                      isAnimationActive={true}
                      animationDuration={150}
                      animationEasing="ease-out"
                      cursor={{fill: isDark ? '#27272a' : '#f8fafc'}}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-700">
                              <p className="text-sm font-bold mb-1 text-zinc-900 dark:text-zinc-100">{label}</p>
                              <p className="text-emerald-600 dark:text-emerald-400 font-medium text-sm flex items-center gap-1">
                                <Clock size={14} />
                                {payload[0].value} Active Minutes
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="total_duration" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} animationDuration={400} animationBegin={0} animationEasing="ease-in-out" />
                  </BarChart>
                </ResponsiveContainer>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                <Flame size={48} className="mb-4 opacity-20" />
                <p>No activity logged yet.</p>
              </div>
            )}
          </div>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants} className="h-full">
          <Card className="h-full">
          <h3 className="font-bold flex items-center gap-2 mb-6"><Target className="text-blue-500" /> Weight Progress</h3>
          <div className="h-64 w-full min-h-[16rem]">
            {weightLogs.length > 0 ? (
              isMounted && (
                <ResponsiveContainer width="100%" height={256}>
                  <LineChart data={weightLogs}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                    <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} width={40} />
                    <Tooltip 
                      isAnimationActive={true}
                      animationDuration={150}
                      animationEasing="ease-out"
                      cursor={{stroke: isDark ? '#27272a' : '#f8fafc', strokeWidth: 2}}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const currentWeight = payload[0].value as number;
                          const target = user?.target_weight;
                          const diff = target ? (currentWeight - target).toFixed(1) : null;
                          return (
                            <div className="bg-white dark:bg-zinc-800 p-3 rounded-xl shadow-xl border border-zinc-100 dark:border-zinc-700">
                              <p className="text-sm font-bold mb-1 text-zinc-900 dark:text-zinc-100">{label}</p>
                              <p className="text-blue-600 dark:text-blue-400 font-medium text-sm flex items-center gap-1">
                                <Activity size={14} />
                                {currentWeight} {user?.weight_unit || 'lbs'}
                              </p>
                              {target && (
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                                  {Number(diff) > 0 ? `${diff} ${user?.weight_unit || 'lbs'} to lose` : Number(diff) < 0 ? `${Math.abs(Number(diff))} ${user?.weight_unit || 'lbs'} to gain` : 'Target reached! 🎉'}
                                </p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {user?.target_weight && <ReferenceLine y={user.target_weight} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Target', position: 'top', fill: '#10b981', fontSize: 12, fontWeight: 500 }} />}
                    <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6'}} activeDot={{r: 6}} animationDuration={400} animationBegin={0} animationEasing="ease-in-out" />
                  </LineChart>
                </ResponsiveContainer>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                <Activity size={48} className="mb-4 opacity-20" />
                <p>No weight logs yet.</p>
              </div>
            )}
          </div>
          </Card>
        </motion.div>
      </div>

      {/* Activity Logs Table */}
      <motion.div variants={itemVariants}>
        <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-lg font-bold">Recent Logs</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input id="dashboardSearchExercises" name="searchExercises" type="text" placeholder="Search exercises..." value={logSearchQuery} onChange={(e) => { setLogSearchQuery(e.target.value); setLogsPage(1); }} className="pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-colors w-full sm:w-48 text-zinc-600 dark:text-zinc-300" />
            </div>
            <div className="flex items-center gap-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800 transition-colors">
              <Filter size={14} className="text-zinc-400 dark:text-zinc-500" />
              <input id="dashboardStartDate" name="startDate" type="date" value={filterStartDate} onChange={(e) => { setFilterStartDate(e.target.value); setLogsPage(1); }} className="bg-transparent text-zinc-600 dark:text-zinc-300 outline-none w-full sm:w-auto [color-scheme:light] dark:[color-scheme:dark]" title="Start Date" />
              <span className="text-zinc-400">-</span>
              <input id="dashboardEndDate" name="endDate" type="date" value={filterEndDate} onChange={(e) => { setFilterEndDate(e.target.value); setLogsPage(1); }} className="bg-transparent text-zinc-600 dark:text-zinc-300 outline-none w-full sm:w-auto [color-scheme:light] dark:[color-scheme:dark]" title="End Date" />
              {(filterStartDate || filterEndDate || logSearchQuery) && (
                <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setLogSearchQuery(''); setLogsPage(1); }} className="text-zinc-400 hover:text-zinc-600 transition-colors ml-1 font-bold text-lg leading-none" title="Clear Filters"><X size={16} /></button>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-sm text-zinc-500 dark:text-zinc-400"><th className="pb-3 font-medium">Date</th><th className="pb-3 font-medium">Exercise</th><th className="pb-3 font-medium">Duration</th><th className="pb-3 font-medium text-right">Actions</th></tr>
            </thead>
            <tbody className="text-sm">
              {currentLogs.length === 0 ? <tr><td colSpan={4} className="py-8 text-center text-zinc-500 dark:text-zinc-400 italic">{(filterStartDate || filterEndDate || logSearchQuery) ? 'No activities found matching your filters.' : 'No activities logged yet.'}</td></tr> : currentLogs.map((log: ActivityLog) => (
                <tr key={log.id} className="border-b border-zinc-50 dark:border-zinc-800/50 last:border-0 group">
                  <td className="py-3 text-zinc-600 dark:text-zinc-400">{new Date(log.date).toLocaleDateString()}</td><td className="py-3 font-medium">{log.exercise_name}</td>
                  <td className="py-3"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-medium"><Clock size={12} />{log.duration} min</span></td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditModal({ log, open: true })} className="p-1.5 text-zinc-400 hover:text-blue-500 transition-colors" title="Edit"><Pencil size={16} /></button>
                      <button onClick={() => handleDeleteLog(log.id)} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLogs.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 transition-colors gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, filteredLogs.length)} of {filteredLogs.length} logs</span>
              <select id="dashboardLogsPerPage" name="logsPerPage" value={logsPerPage} onChange={(e) => { setLogsPerPage(Number(e.target.value)); setLogsPage(1); }} className="text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 outline-none text-zinc-600 dark:text-zinc-300 transition-colors [&>option]:bg-white dark:[&>option]:bg-zinc-900"><option value={5}>5 / page</option><option value={10}>10 / page</option><option value={20}>20 / page</option><option value={50}>50 / page</option></select>
            </div>
            <div className="flex gap-2"><Button variant="outline" onClick={() => setLogsPage(p => Math.max(1, p - 1))} disabled={logsPage === 1} className="px-3 py-1.5 text-sm">Previous</Button><Button variant="outline" onClick={() => setLogsPage(p => Math.min(totalPages, p + 1))} disabled={logsPage >= totalPages} className="px-3 py-1.5 text-sm">Next</Button></div>
          </div>
        )}
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Trophy className="text-amber-500" /> Achievements</h2>
          <Button variant="outline" className="px-3 py-1.5 text-sm" onClick={() => setView('achievements')}>View All</Button>
        </div>
        {achievements.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4 italic">Log activities to earn badges!</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map(ach => (
              <div key={ach.id} className="p-4 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 shadow-sm border border-amber-200 dark:border-amber-700/50">{renderAchievementIcon(ach.icon)}</div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{ach.name}</h4><p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{ach.description}</p>
              </div>
            ))}
          </div>
        )}
        </Card>
      </motion.div>
    </motion.div>
  );
};