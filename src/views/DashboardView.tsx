import React, { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ReferenceLine
} from 'recharts';
import { Plus, Target, Trophy, Flame, Search, Filter, Pencil, Trash2, Clock, Activity, X, Award, Star, Medal } from 'lucide-react';
import { Card, Button } from '../ui';
import { type UserProfile, type ActivityLog, type DailyStat, type WeeklyGoal, type Achievement, type WeightLog } from '../api';

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
}

export const DashboardView = ({
  user, stats, logs, weightLogs, goal, achievements, setView,
  setLogModal, setLogWeightModal, setEditModal, handleDeleteLog,
  handleStatsRangeChange, statsRange, isDark
}: DashboardViewProps) => {
  const [logsPage, setLogsPage] = useState(1);
  const [logsPerPage, setLogsPerPage] = useState(5);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [logSearchQuery, setLogSearchQuery] = useState('');

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

  return (
    <div className="space-y-6">
      {/* Welcome & Weekly Goal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-3 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-none">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">Welcome back, {user.username}!</h2>
              <p className="opacity-90">You've logged {logs.length} activities so far.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setLogModal({ exercise: '', open: true })} className="bg-white/20 hover:bg-white/30 text-white border-none flex items-center gap-2">
                <Plus size={18} /> Activity
              </Button>
              <Button variant="secondary" onClick={() => setLogWeightModal(true)} className="bg-white/20 hover:bg-white/30 text-white border-none flex items-center gap-2">
                <Plus size={18} /> Weight
              </Button>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2 font-medium">
              <span>Weekly Goal: {goal?.current_weekly_total || 0} / {user.weekly_goal} min</span>
              <span>{Math.min(100, Math.round(((goal?.current_weekly_total || 0) / user.weekly_goal) * 100))}%</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-white h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min(100, ((goal?.current_weekly_total || 0) / user.weekly_goal) * 100)}%` }} 
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Recharts Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2"><Flame className="text-orange-500" /> Activity</h3>
            <select 
              value={statsRange} 
              onChange={(e) => handleStatsRangeChange(e.target.value as 'week' | 'month')}
              className="text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 outline-none text-zinc-600 dark:text-zinc-300"
            >
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>
          <div className="h-64 w-full min-h-[16rem]">
            <ResponsiveContainer width="99%" height="100%" minWidth={0}>
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
          </div>
        </Card>

        <Card>
          <h3 className="font-bold flex items-center gap-2 mb-6"><Target className="text-blue-500" /> Weight Progress</h3>
          <div className="h-64 w-full min-h-[16rem]">
            {weightLogs.length > 0 ? (
              <ResponsiveContainer width="99%" height="100%" minWidth={0}>
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
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                <Activity size={48} className="mb-4 opacity-20" />
                <p>No weight logs yet.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Activity Logs Table */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-lg font-bold">Recent Logs</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input type="text" placeholder="Search exercises..." value={logSearchQuery} onChange={(e) => { setLogSearchQuery(e.target.value); setLogsPage(1); }} className="pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-colors w-full sm:w-48 text-zinc-600 dark:text-zinc-300" />
            </div>
            <div className="flex items-center gap-2 text-sm bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800 transition-colors">
              <Filter size={14} className="text-zinc-400 dark:text-zinc-500" />
              <input type="date" value={filterStartDate} onChange={(e) => { setFilterStartDate(e.target.value); setLogsPage(1); }} className="bg-transparent text-zinc-600 dark:text-zinc-300 outline-none w-full sm:w-auto [color-scheme:light] dark:[color-scheme:dark]" title="Start Date" />
              <span className="text-zinc-400">-</span>
              <input type="date" value={filterEndDate} onChange={(e) => { setFilterEndDate(e.target.value); setLogsPage(1); }} className="bg-transparent text-zinc-600 dark:text-zinc-300 outline-none w-full sm:w-auto [color-scheme:light] dark:[color-scheme:dark]" title="End Date" />
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
              <select value={logsPerPage} onChange={(e) => { setLogsPerPage(Number(e.target.value)); setLogsPage(1); }} className="text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 outline-none text-zinc-600 dark:text-zinc-300 transition-colors [&>option]:bg-white dark:[&>option]:bg-zinc-900"><option value={5}>5 / page</option><option value={10}>10 / page</option><option value={20}>20 / page</option><option value={50}>50 / page</option></select>
            </div>
            <div className="flex gap-2"><Button variant="outline" onClick={() => setLogsPage(p => Math.max(1, p - 1))} disabled={logsPage === 1} className="px-3 py-1.5 text-sm">Previous</Button><Button variant="outline" onClick={() => setLogsPage(p => Math.min(totalPages, p + 1))} disabled={logsPage >= totalPages} className="px-3 py-1.5 text-sm">Next</Button></div>
          </div>
        )}
      </Card>

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
    </div>
  );
};