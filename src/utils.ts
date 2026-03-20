import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { type ActivityLog } from './api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const calculateStreak = (logsList: ActivityLog[]) => {
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

export const getPasswordStrength = (pass: string) => {
  let score = 0;
  if (!pass) return { score: 0, label: '', color: 'bg-zinc-200', textColor: 'text-zinc-500' };
  if (pass.length >= 8) score += 1;
  if (/[A-Z]/.test(pass)) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (pass.length < 6) score = 1;

  switch (score) {
    case 1: return { score: 1, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' };
    case 2: return { score: 2, label: 'Fair', color: 'bg-amber-500', textColor: 'text-amber-500' };
    case 3: return { score: 3, label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-500' };
    case 4: return { score: 4, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-500' };
    default: return { score: 1, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500' };
  }
};

export const PREDEFINED_AVATARS = [
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Aneka',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Jude',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Eden',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Amaya',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Leo',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Nala',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Oliver',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Mia',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Lily',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Sophia',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Chloe',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Zoe',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Grace',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Avery',
  'https://api.dicebear.com/9.x/avataaars/svg?seed=Luna'
];