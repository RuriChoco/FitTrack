import React, { useState, useRef } from 'react';
import { Card, Button } from '../ui';
import { Upload, Eye, EyeOff, Loader2 } from 'lucide-react';
import { api, type UserProfile } from '../api';
import { cn, getPasswordStrength, PREDEFINED_AVATARS } from '../utils';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface SettingsViewProps {
  user: UserProfile;
  setUser: (user: UserProfile) => void;
  fetchUserData: (user: UserProfile) => void;
  setView: (view: any) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
  onAccountDeleted: () => void;
}

export function SettingsView({ user, setUser, fetchUserData, setView, showToast, onAccountDeleted }: SettingsViewProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [editAvatar, setEditAvatar] = useState(user.avatar || PREDEFINED_AVATARS[0]);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<{file: File, url: string} | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [settingsNewPassword, setSettingsNewPassword] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void} | null>(null);

  const customAvatarSource = !PREDEFINED_AVATARS.includes(editAvatar) 
    ? editAvatar 
    : (user.avatar && !PREDEFINED_AVATARS.includes(user.avatar) ? user.avatar : null);

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(crop);
  };

  const getCroppedImg = async (image: HTMLImageElement, crop: PixelCrop, fileName: string): Promise<File> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const pixelRatio = window.devicePixelRatio;
    canvas.width = Math.floor(crop.width * scaleX * pixelRatio);
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(new File([blob], fileName, { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.95);
    });
  };

  const handleDeleteAccount = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Account',
      message: 'Are you sure you want to completely delete your account? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmDialog(null);
        showToast('Account deleted successfully', 'success');
        
        onAccountDeleted();

        const res = await api.deleteProfile();
        if (!res.ok) {
          showToast('Failed to delete account', 'error');
        }
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Account Settings</h2>
        <Button variant="outline" onClick={() => setView('dashboard')}>Back to Dashboard</Button>
      </div>
      
      <form onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newAge = parseInt(formData.get('age') as string);
        const newGender = formData.get('gender') as string;
        const oldPassword = formData.get('old_password') as string;
        const newPassword = formData.get('password') as string;
        const confirmPassword = formData.get('confirm_password') as string;
        const newAvatar = formData.get('avatar') as string;
        const newWeeklyGoal = parseInt(formData.get('weekly_goal') as string);
        const newWeight = parseFloat(formData.get('weight') as string);
        const newTargetWeight = parseFloat(formData.get('target_weight') as string);
        const newGoalType = formData.get('goal_type') as string;
        const newWeightUnit = formData.get('weight_unit') as string;
        
        const updateData: any = { age: newAge, gender: newGender, avatar: newAvatar, weekly_goal: newWeeklyGoal, goal_type: newGoalType, weight_unit: newWeightUnit };
        if (newPassword) {
          if (!oldPassword) {
            showToast('Please enter your current password to change it.', 'error');
            return;
          }
          if (newPassword !== confirmPassword) {
            showToast('New passwords do not match.', 'error');
            return;
          }
          if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
            showToast('New password must be at least 8 characters long, and contain at least 1 uppercase letter, 1 number, and 1 special character.', 'error');
            return;
          }
          updateData.password = newPassword;
          updateData.oldPassword = oldPassword;
        }
        if (!isNaN(newWeight)) updateData.weight = newWeight;
        if (!isNaN(newTargetWeight)) updateData.target_weight = newTargetWeight;

        const res = await api.updateProfile(updateData);
        if (res.ok) {
          const updatedUser = await res.json();
          setUser(updatedUser);
          fetchUserData(updatedUser);
          showToast('Profile updated successfully!', 'success');
          (e.target as HTMLFormElement).reset();
          setSettingsNewPassword('');
        } else {
          const data = await res.json();
          showToast(data.error || 'Failed to update profile', 'error');
        }
      }} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-bold mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-2">Profile Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Username</label>
                  <input 
                    disabled
                    type="text" 
                    value={user.username}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                  <input 
                    disabled
                    type="text" 
                    value={user.email || ''}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 outline-none transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-bold mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-2">Fitness & Goals</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Weekly Goal (min)</label>
                  <input 
                    name="weekly_goal"
                    required
                    type="number" 
                    defaultValue={user.weekly_goal || 150}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  />
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
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Unit</label>
                  <select 
                    name="weight_unit"
                    defaultValue={user.weight_unit || 'lbs'}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                  >
                    <option value="lbs">lbs</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-lg font-bold mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-2">Profile Picture</h3>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">Choose an Avatar</label>
              <div className="flex flex-wrap gap-3">
                {customAvatarSource && (
                  <button
                    type="button"
                    onClick={() => setEditAvatar(customAvatarSource)}
                    className={cn(
                      "w-12 h-12 rounded-full overflow-hidden border-2 transition-all",
                      editAvatar === customAvatarSource ? "border-emerald-500 shadow-md scale-110" : "border-transparent opacity-50 hover:opacity-100 hover:scale-105"
                    )}
                  >
                    <img src={customAvatarSource} alt="Custom avatar" className="w-full h-full object-cover bg-emerald-50 dark:bg-emerald-900/30" />
                  </button>
                )}
                {PREDEFINED_AVATARS.map(url => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setEditAvatar(url)}
                    className={cn(
                      "w-12 h-12 rounded-full overflow-hidden border-2 transition-all",
                      editAvatar === url ? "border-emerald-500 shadow-md scale-110" : "border-transparent opacity-50 hover:opacity-100 hover:scale-105"
                    )}
                  >
                    <img src={url} alt="Avatar option" className="w-full h-full object-cover bg-emerald-50 dark:bg-emerald-900/30" />
                  </button>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <span className="text-sm text-zinc-500 dark:text-zinc-400">Or upload a custom image:</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  id="avatar-upload"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !user) return;
                    
                    if (file.size > 2 * 1024 * 1024) {
                      alert("Image must be less than 2MB");
                      e.target.value = '';
                      return;
                    }

                    const url = URL.createObjectURL(file);
                    setAvatarPreview({ file, url });
                    e.target.value = '';
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex items-center gap-2 text-sm py-1.5 px-3"
                  disabled={isUploadingAvatar}
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                >
                  <Upload size={16} />
                  {isUploadingAvatar ? 'Uploading...' : 'Upload Custom Image'}
                </Button>
              </div>
              <input type="hidden" name="avatar" value={editAvatar} />
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-bold mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-2">Security & Actions</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Current Password</label>
                <input 
                  name="old_password"
                  type="password" 
                  placeholder="Enter current password"
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">New Password</label>
                <div className="relative">
                  <input 
                    name="password"
                    type={showPassword ? "text" : "password"} 
                    value={settingsNewPassword}
                    onChange={(e) => setSettingsNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full px-4 py-2 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {settingsNewPassword.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    <div className="flex gap-1 h-1.5 w-full">
                      {[1, 2, 3, 4].map(num => (
                        <div key={num} className={cn("flex-1 rounded-full", getPasswordStrength(settingsNewPassword).score >= num ? getPasswordStrength(settingsNewPassword).color : 'bg-zinc-200 dark:bg-zinc-700')} />
                      ))}
                    </div>
                    <p className={cn("text-xs", getPasswordStrength(settingsNewPassword).textColor)}>{getPasswordStrength(settingsNewPassword).label} Password</p>
                  </div>
                )}
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Confirm New Password</label>
                <input 
                  name="confirm_password"
                  type="password" 
                  placeholder="Confirm new password"
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-3">
                <Button type="submit" className="flex-1">Save Changes</Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleDeleteAccount}
                  className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/30 dark:border-red-900/50"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </form>

      {avatarPreview && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <Card className="w-full max-w-sm text-center flex flex-col max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4 shrink-0">Crop Profile Picture</h3>
            <div className="flex-1 overflow-y-auto mb-6 flex justify-center items-center bg-zinc-100 dark:bg-zinc-900/50 rounded-xl relative">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img 
                  ref={imgRef}
                  src={avatarPreview.url} 
                  alt="Avatar Preview" 
                  onLoad={onImageLoad}
                  className="max-h-[50vh] object-contain"
                />
              </ReactCrop>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 shrink-0">Adjust the circular frame to crop your new avatar.</p>
            <div className="flex gap-3 shrink-0">
              <Button 
                className="flex-1"
                disabled={!completedCrop || isUploadingAvatar}
                onClick={async () => {
                  if (!user || !completedCrop || !imgRef.current) return;
                  setIsUploadingAvatar(true);
                  
                  try {
                    const croppedFile = await getCroppedImg(imgRef.current, completedCrop, avatarPreview.file.name);
                    const res = await api.uploadAvatar(croppedFile, user.id, user.avatar);
                    if (res.ok) {
                      const data = await res.json();
                      setEditAvatar(data.url);
                      showToast('Avatar updated successfully!', 'success');
                      setAvatarPreview(null);
                    } else {
                      showToast("Failed to upload avatar", 'error');
                    }
                  } catch (err) {
                    showToast("Error processing image crop", 'error');
                  } finally {
                    setIsUploadingAvatar(false);
                    URL.revokeObjectURL(avatarPreview.url);
                  }
                }}
              >
                Upload
              </Button>
              <Button variant="outline" onClick={() => { URL.revokeObjectURL(avatarPreview.url); setAvatarPreview(null); }}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {isUploadingAvatar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-[100] text-white">
          <Loader2 size={48} className="animate-spin text-emerald-500 mb-4" />
          <h3 className="text-xl font-bold">Uploading...</h3>
          <p className="text-white/80 mt-2 text-sm">Please wait while we save your new avatar.</p>
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
    </div>
  );
}
