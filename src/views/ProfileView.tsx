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
      const res = await api.signup({ email, password, username });
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

        <Button variant="outline" className="w-full" onClick={handleGoogleLogin}>
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