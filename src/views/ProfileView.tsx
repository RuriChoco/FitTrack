import React, { useState } from 'react';
import { Button } from '../ui';
import { api, type UserProfile } from '../api';
import { Activity, Loader2, Sparkles, Zap, Heart } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileViewProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
  isDark: boolean;
  toggleTheme: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function ProfileView({ onLoginSuccess, showToast }: ProfileViewProps) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const res = await api.loginWithGoogle();
    if (res.ok) {
      const data = await res.json();
      onLoginSuccess(data.user, data.token);
    } else {
      const err = await res.json();
      showToast(err.error || 'Google login failed', 'error');
    }
    setIsGoogleLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-400/20 dark:bg-emerald-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-400/10 dark:bg-teal-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-white/20 dark:border-white/10 p-10 rounded-[2.5rem] shadow-2xl flex flex-col items-center">
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-8"
          >
            <Activity size={40} className="text-white" strokeWidth={2.5} />
          </motion.div>

          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white mb-2 text-center">
            Exercise Tracking System
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-center mb-10 font-medium px-4">
            Track your progress, achieve your goals, and transform your life.
          </p>

          <div className="w-full space-y-4">
            <Button 
              className="w-full h-14 text-base font-bold flex items-center justify-center gap-3 bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 shadow-sm hover:shadow transition-all group dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-100 dark:border-zinc-700" 
              onClick={handleGoogleLogin} 
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 size={24} className="animate-spin text-zinc-500" />
              ) : (
                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
            </Button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-zinc-400 dark:text-zinc-500">
            <div className="flex flex-col items-center gap-1"><Sparkles size={18} /><span className="text-[10px] uppercase font-bold tracking-widest">Smart</span></div>
            <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="flex flex-col items-center gap-1"><Zap size={18} /><span className="text-[10px] uppercase font-bold tracking-widest">Fast</span></div>
            <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <div className="flex flex-col items-center gap-1"><Heart size={18} /><span className="text-[10px] uppercase font-bold tracking-widest">Healthy</span></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}