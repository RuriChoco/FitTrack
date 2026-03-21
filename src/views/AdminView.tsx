import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui';
import { Users, Search, User } from 'lucide-react';
import { api, type UserProfile } from '../api';

interface AdminViewProps {
  user: UserProfile;
  setView: (view: any) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function AdminView({ user, setView, showToast }: AdminViewProps) {
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(5);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [adminAnnouncement, setAdminAnnouncement] = useState('');

  useEffect(() => {
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
    fetchAdminData();
  }, []);

  const filteredUsers = allUsers.filter(u => 
    u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
    (u.email && u.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  const totalUsersPages = Math.ceil(filteredUsers.length / usersPerPage);
  
  useEffect(() => {
    if (usersPage > totalUsersPages && totalUsersPages > 0) {
      setUsersPage(totalUsersPages);
    }
  }, [filteredUsers.length, totalUsersPages, usersPage]);

  const indexOfLastUser = usersPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  if (!user.is_admin) return null;

  return (
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
              showToast('Announcement broadcasted!', 'success');
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
                <Button type="button" variant="outline" onClick={async () => { await api.updateAnnouncement(''); showToast('Announcement cleared', 'success'); }}>Clear</Button>
              </div>
            </form>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <h3 className="text-lg font-bold">User Directory</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={userSearchQuery}
              onChange={(e) => { setUserSearchQuery(e.target.value); setUsersPage(1); }}
              className="pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-colors w-full sm:w-64"
            />
          </div>
        </div>
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
        {filteredUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 transition-colors gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} users
              </span>
              <select 
                value={usersPerPage}
                onChange={(e) => { setUsersPerPage(Number(e.target.value)); setUsersPage(1); }}
                className="text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 outline-none text-zinc-600 dark:text-zinc-300 transition-colors [&>option]:bg-white dark:[&>option]:bg-zinc-900"
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
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
  );
}
