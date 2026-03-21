import React, { useState } from 'react';
import { Card, Button } from '../ui';
import { api, type UserProfile } from '../api';
import { Moon, Sun } from 'lucide-react';

interface ProfileViewProps {
  onLoginSuccess: (user: UserProfile, token: string) => void;
  isDark: boolean;
  toggleTheme: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export function ProfileView({ onLoginSuccess, isDark, toggleTheme, showToast }: ProfileViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const res = await api.login({ email, password });
      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.user, data.token);
      } else {
        const err = await res.json();
        showToast(err.error || 'Login failed', 'error');
      }
    } else {
      const res = await api.signup({ email, password, username, age: parseInt(age) || 30, gender });
      if (res.ok) {
        showToast('Signup successful! You can now log in.', 'success');
        setIsLogin(true);
      } else {
        const err = await res.json();
        showToast(err.error || 'Signup failed', 'error');
      }
    }
  };

  const handleGoogleLogin = async () => {
    const res = await api.loginWithGoogle();
    if (res.ok) {
      const data = await res.json();
      onLoginSuccess(data.user, data.token);
    } else {
      const err = await res.json();
      showToast(err.error || 'Google login failed', 'error');
    }
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
        <h2 className="text-2xl font-bold mb-6 text-center text-zinc-900 dark:text-zinc-100">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>

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
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <Button type="submit" className="w-full mt-6">
            {isLogin ? 'Log In' : 'Sign Up'}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-4 before:h-px before:flex-1 before:bg-zinc-200 dark:before:bg-zinc-800 after:h-px after:flex-1 after:bg-zinc-200 dark:after:bg-zinc-800">
          <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">OR</span>
        </div>

        <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={handleGoogleLogin}>
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
          Continue with Google
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
      </Card>
    </div>
  );
}