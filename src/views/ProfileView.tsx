import React, { useState, useEffect } from 'react';
import { Card, Button } from '../ui';
import { api, type UserProfile } from '../api';
import { Moon, Sun, Eye, EyeOff, Activity, Mail, Loader2 } from 'lucide-react';
import { cn, getPasswordStrength } from '../utils';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileViewProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
  isDark: boolean;
  toggleTheme: () => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export function ProfileView({ onLoginSuccess, isDark, toggleTheme, showToast }: ProfileViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showForgotModal && !isResetting) {
        setShowForgotModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showForgotModal, isResetting]);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setIsResetting(true);
    const res = await api.resetPassword(resetEmail);
    if (res.ok) {
      showToast('Password reset email sent!', 'success');
      setShowForgotModal(false);
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to send reset email', 'error');
    }
    setIsResetting(false);
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    const res = await api.resendVerification({ email, password });
    if (res.ok) {
      showToast('Verification email resent! Please check your inbox.', 'success');
    } else {
      const err = await res.json();
      showToast(err.error || 'Failed to resend verification email', 'error');
    }
    setIsResending(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    setIsSubmitting(true);
    if (isLogin) {
      const res = await api.login({ email, password });
      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.user, data.token);
      } else {
        const err = await res.json();
        if (err.needsVerification) {
          setNeedsVerification(true);
        }
        showToast(err.error || 'Login failed', 'error');
      }
    } else {
      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        setIsSubmitting(false);
        return;
      }
      if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
        showToast('Password must be at least 8 characters long, and contain at least 1 uppercase letter, 1 number, and 1 special character.', 'error');
        setIsSubmitting(false);
        return;
      }
      const res = await api.signup({ email, password, username, age: parseInt(age) || 30, gender });
      if (res.ok) {
        showToast('Signup successful! Please check your email to verify your account.', 'success');
        setIsLogin(true);
        setNeedsVerification(true);
      } else {
        const err = await res.json();
        showToast(err.error || 'Signup failed', 'error');
      }
    }
    setIsSubmitting(false);
  };

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <button 
        onClick={toggleTheme} 
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-900 dark:text-zinc-100"
      >
        {isDark ? <Sun size={24} /> : <Moon size={24} />}
      </button>

      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-2xl text-emerald-600 dark:text-emerald-400 mb-4">
            <Activity size={32} />
          </div>
          <h2 className="text-2xl font-bold text-center text-zinc-900 dark:text-zinc-100">
            {isLogin ? 'FitTrack' : 'Create an Account'}
          </h2>
        </div>

        {needsVerification ? (
          <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-full inline-block text-emerald-600 dark:text-emerald-400 mb-2">
              <Mail size={48} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Verify your email</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              We've sent a verification link to <span className="font-semibold text-zinc-900 dark:text-zinc-100">{email}</span>. 
              Please verify your email address to continue.
            </p>
            <div className="pt-4 space-y-3">
              <Button onClick={handleResendVerification} disabled={isResending} className="w-full flex items-center justify-center gap-2">
                {isResending && <Loader2 size={16} className="animate-spin" />}
                {isResending ? 'Sending...' : 'Resend Email'}
              </Button>
              <Button variant="outline" onClick={() => setNeedsVerification(false)} className="w-full">
                Back to Login
              </Button>
            </div>
          </div>
        ) : (
          <>
        <form onSubmit={handleSubmit} className="space-y-4 text-zinc-900 dark:text-zinc-100">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Age</label>
                  <input
                    required
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              name="email"
              required
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium">Password</label>
              {isLogin && (
                <button type="button" onClick={() => { setResetEmail(email); setShowForgotModal(true); }} className="text-xs text-emerald-600 dark:text-emerald-500 hover:underline">
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                required
                type={showPassword ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {!isLogin && password.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex gap-1 h-1.5 w-full">
                  {[1, 2, 3, 4].map(num => (
                    <div key={num} className={cn("flex-1 rounded-full", getPasswordStrength(password).score >= num ? getPasswordStrength(password).color : 'bg-zinc-200 dark:bg-zinc-700')} />
                  ))}
                </div>
                <p className={cn("text-xs", getPasswordStrength(password).textColor)}>{getPasswordStrength(password).label} Password</p>
              </div>
            )}
            {!isLogin && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character.</p>
            )}
          </div>

          {!isLogin && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  required
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full mt-6 flex items-center justify-center gap-2" disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={20} className="animate-spin" />}
            {isSubmitting ? (isLogin ? 'Logging In...' : 'Signing Up...') : (isLogin ? 'Log In' : 'Sign Up')}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-zinc-200 dark:before:bg-zinc-800 after:h-px after:flex-1 after:bg-zinc-200 dark:after:bg-zinc-800">
          <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">OR</span>
        </div>

        <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={handleGoogleLogin} disabled={isGoogleLoading}>
          {isGoogleLoading ? (
            <Loader2 size={20} className="animate-spin text-zinc-500" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
        </Button>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)} 
            className="text-emerald-600 font-medium hover:underline"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
          </>
        )}
      </Card>

      <AnimatePresence>
        {showForgotModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[200]"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isResetting) setShowForgotModal(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-sm"
            >
              <Card className="w-full">
            <h3 className="text-xl font-bold mb-2 text-zinc-900 dark:text-zinc-100">Reset Password</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">Enter your email address and we'll send you a link to reset your password.</p>
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-zinc-900 dark:text-zinc-100">Email</label>
                <input 
                  autoFocus
                  required
                  type="email" 
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 flex items-center justify-center gap-2" disabled={isResetting}>
                  {isResetting && <Loader2 size={16} className="animate-spin" />}
                  {isResetting ? 'Sending...' : 'Send Link'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForgotModal(false)} disabled={isResetting}>Cancel</Button>
              </div>
            </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}