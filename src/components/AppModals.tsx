import React from 'react';
import { Card, Button } from '../ui';
import { cn } from '../utils';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { api, type ActivityLog, type UserProfile, type WeightLog } from '../api';

interface AppModalsProps {
  user: UserProfile | null;
  logModal: { exercise: string; open: boolean };
  setLogModal: (m: { exercise: string; open: boolean }) => void;
  logWeightModal: boolean;
  setLogWeightModal: (b: boolean) => void;
  editModal: { log: ActivityLog | null; open: boolean };
  setEditModal: (m: { log: ActivityLog | null; open: boolean }) => void;
  toast: { message: string, type: 'success' | 'error' } | null;
  confirmDialog: { isOpen: boolean, title: string, message: string, onConfirm: () => void } | null;
  setConfirmDialog: (m: any) => void;
  handleLogActivity: (exercise: string, duration: number) => void;
  handleUpdateLog: (id: string, ex: string, dur: number, date: string) => void;
  showToast: (m: string, t: 'success' | 'error') => void;
  setWeightLogs: React.Dispatch<React.SetStateAction<WeightLog[]>>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  fetchUserData: (u: UserProfile) => void;
}

export function AppModals({
  user, logModal, setLogModal, logWeightModal, setLogWeightModal,
  editModal, setEditModal, toast, confirmDialog, setConfirmDialog,
  handleLogActivity, handleUpdateLog, showToast, setWeightLogs,
  setUser, fetchUserData
}: AppModalsProps) {
  return (
    <>
      {logModal.open && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <h3 className="text-xl font-bold mb-2">Log Activity</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              {logModal.exercise ? <>How long did you do <strong>{logModal.exercise}</strong>?</> : 'What did you do today?'}
            </p>
            <div className="space-y-4">
              {!logModal.exercise && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Exercise / Activity</label>
                  <input
                    autoFocus
                    type="text"
                    id="modal-exercise"
                    list="exercise-suggestions"
                    placeholder="e.g. Running, Yoga, Swimming..."
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Duration (minutes)</label>
                <input 
                  autoFocus={!!logModal.exercise}
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
                    const exerciseInput = document.getElementById('modal-exercise') as HTMLInputElement | null;
                    const exercise = logModal.exercise || exerciseInput?.value?.trim() || '';
                    if (!exercise) { exerciseInput?.focus(); return; }
                    handleLogActivity(exercise, duration);
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


      {logWeightModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <h3 className="text-xl font-bold mb-2">Log Weight</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">Keep track of your current weight.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Weight ({user?.weight_unit || 'lbs'})</label>
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
                        setLogWeightModal(false);
                        showToast('Weight logged successfully!', 'success');

                        const dateStr = new Date().toISOString().split('T')[0];
                        setWeightLogs(prev => {
                          const newLogs = [...prev];
                          const existingIdx = newLogs.findIndex(l => l.date === dateStr);
                          if (existingIdx >= 0) newLogs[existingIdx] = { ...newLogs[existingIdx], weight: weightVal };
                          else newLogs.push({ id: 'temp-' + Date.now(), weight: weightVal, date: dateStr, user_id: user?.id || '' });
                          return newLogs.sort((a, b) => a.date.localeCompare(b.date));
                        });
                        setUser(prev => prev ? { ...prev, weight: weightVal } : null);

                        await api.logWeight(weightVal);
                        if (user) fetchUserData({ ...user, weight: weightVal });
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
                <Button type="button" variant="outline" onClick={() => setEditModal({ log: null, open: false })}>Cancel</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={cn(
            "px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium",
            toast.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/50" : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/50"
          )}>
            {toast.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {toast.message}
          </div>
        </div>
      )}

      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <Card className="w-full max-w-sm">
            <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">{confirmDialog.title}</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <Button className={cn("flex-1", confirmDialog.title.includes('Delete') ? "bg-red-600 hover:bg-red-700 text-white" : "")} onClick={confirmDialog.onConfirm}>Confirm</Button>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
