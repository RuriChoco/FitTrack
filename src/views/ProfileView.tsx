import React, { useState } from 'react';
import { Activity, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { api, type UserProfile } from '../api';
import { Card, Button } from '../ui';
import { cn, getPasswordStrength } from '../utils';

interface ProfileViewProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
  isDark: boolean;
  toggleTheme: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export function ProfileView({ onLoginSuccess, isDark, toggleTheme, showToast }: ProfileViewProps) {
  const [authMode, setAuthMode] = useState<'signup' | 'login' | 'forgot_password'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('other');
  const [weight, setWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('lbs');
  const [goalType, setGoalType] = useState('maintain');
  const [error, setError] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (authMode === 'forgot_password') {
      const res = await api.resetPassword(email);
      if (res.ok) {
        showToast('Password reset email sent! Please check your inbox.', 'success');
        setAuthMode('login');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to send reset email.');
      }
      return;
    }
    
    if (authMode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        setError('Password must be at least 8 characters long with 1 uppercase letter and 1 number.');
        return;
      }
      const res = await api.signup({ 
        email,
        username, 
        password, 
        age: parseInt(age), 
        gender,
        weight: weight ? parseFloat(weight) : undefined,
        target_weight: targetWeight ? parseFloat(targetWeight) : undefined,
        weight_unit: weightUnit,
        goal_type: goalType
      });
      if (res.ok) {
        showToast('Signup successful! Please check your email inbox to verify your account before logging in.', 'success');
        setAuthMode('login');
        setPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create profile. Email or Username might be taken.');
      }
    } else {
      const res = await api.login({ email, password });
      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.user, data.token);
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid email or password. Please try again.');
        if (data.needsVerification) {
          setNeedsVerification(true);
        } else {
          setNeedsVerification(false);
        }
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const res = await api.loginWithGoogle();
    if (res.ok) {
      const data = await res.json();
      onLoginSuccess(data.user, data.token);
    } else {
      const data = await res.json();
      setError(data.error || 'Google Sign-In failed.');
    }
  };

  const handleResendVerification = async () => {
    setError('');
    const res = await api.resendVerification({ email, password });
    if (res.ok) {
      showToast('Verification email sent! Please check your inbox.', 'success');
      setNeedsVerification(false);
    } else {
      const data = await res.json();
      setError(data.error || 'Failed to resend verification email.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-900 dark:text-zinc-100 transition-colors relative">
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-2.5 text-zinc-500 hover:text-emerald-500 dark:text-zinc-400 transition-colors bg-white dark:bg-zinc-900 rounded-full shadow-sm border border-black/5 dark:border-white/10 z-10"
        title="Toggle Theme"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>
      <Card className={cn("w-full transition-all duration-300", authMode === 'signup' ? "max-w-2xl" : "max-w-md")}>
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
              setAuthMode('login');
              setError('');
              setNeedsVerification(false);
            }}
            className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", (authMode === 'login' || authMode === 'forgot_password') ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300")}
          >
            Login
          </button>
          <button 
            onClick={() => {
              setAuthMode('signup');
              setError('');
              setNeedsVerification(false);
            }}
            className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-all", authMode === 'signup' ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300")}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="Enter your email"
            />
          </div>
          {authMode === 'signup' && (
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
          )}
          {authMode !== 'forgot_password' && (
            <div className={cn("grid gap-4", authMode === 'signup' ? "sm:grid-cols-2" : "grid-cols-1")}>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
                <div className="relative">
                  <input 
                    required
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {authMode === 'login' && (
                  <div className="flex justify-end mt-2">
                    <button 
                      type="button" 
                      onClick={() => { setAuthMode('forgot_password'); setError(''); }} 
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline transition-all"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                {authMode === 'signup' && password.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    <div className="flex gap-1 h-1.5 w-full">
                      {[1, 2, 3, 4].map(num => (
                        <div key={num} className={cn("flex-1 rounded-full", getPasswordStrength(password).score >= num ? getPasswordStrength(password).color : 'bg-zinc-200 dark:bg-zinc-700')} />
                      ))}
                    </div>
                    <p className={cn("text-xs", getPasswordStrength(password).textColor)}>{getPasswordStrength(password).label} Password</p>
                  </div>
                )}
                {authMode === 'signup' && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Must be at least 8 characters with 1 uppercase letter and 1 number.</p>
                )}
              </div>
              {authMode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <input 
                      required
                      type={showConfirmPassword ? "text" : "password"} 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-2 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="Confirm your password"
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
            </div>
          )}
          {authMode === 'signup' && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Weight</label>
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
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Target</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Weight Unit</label>
                  <select 
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none transition-all [&>option]:bg-white dark:[&>option]:bg-zinc-900"
                  >
                    <option value="lbs">Pounds (lbs)</option>
                    <option value="kg">Kilograms (kg)</option>
                  </select>
                </div>
                <div>
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
            </>
          )}
          <Button type="submit" className="w-full mt-4">
            {authMode === 'signup' ? 'Create Profile' : authMode === 'forgot_password' ? 'Send Reset Link' : 'Login'}
          </Button>
          
          {authMode === 'forgot_password' && (
            <button 
              type="button" 
              onClick={() => { setAuthMode('login'); setError(''); }}
              className="w-full mt-3 text-sm text-zinc-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Back to Login
            </button>
          )}
          
          {authMode === 'login' && needsVerification && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleResendVerification} 
              className="w-full mt-2"
            >
              Resend Verification Email
            </Button>
          )}
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
