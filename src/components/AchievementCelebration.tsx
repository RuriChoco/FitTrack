import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Medal, Award, CheckCircle2, X } from 'lucide-react';
import { type Achievement } from '../api';
import { Button } from '../ui';

interface AchievementCelebrationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementCelebration({ achievement, onClose }: AchievementCelebrationProps) {
  if (!achievement) return null;

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Star': return <Star className="text-amber-400" size={64} strokeWidth={2.5} />;
      case 'Medal': return <Medal className="text-slate-400" size={64} strokeWidth={2.5} />;
      case 'Award': return <Award className="text-emerald-400" size={64} strokeWidth={2.5} />;
      case 'Trophy': return <Trophy className="text-amber-500" size={64} strokeWidth={2.5} />;
      default: return <Award className="text-emerald-400" size={64} strokeWidth={2.5} />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      >
        {/* Particle Effects (Simple CSS) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: '50%', 
                y: '50%', 
                scale: 0,
                opacity: 1
              }}
              animate={{ 
                x: `${Math.random() * 100}%`, 
                y: `${Math.random() * 100}%`, 
                scale: Math.random() * 2,
                opacity: 0
              }}
              transition={{ 
                duration: 2 + Math.random() * 2, 
                repeat: Infinity,
                ease: "easeOut" 
              }}
              className="absolute w-2 h-2 rounded-full bg-emerald-400"
            />
          ))}
        </div>

        <motion.div
          initial={{ scale: 0.5, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.5, y: 50, opacity: 0 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300 }}
          className="relative w-full max-w-sm bg-zinc-900 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center overflow-hidden"
        >
          {/* Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

          <motion.div
            initial={{ rotate: -20, scale: 0.5 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 12 }}
            className="mb-6 relative"
          >
            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
            <div className="relative bg-zinc-800 p-6 rounded-full border border-white/5">
              {renderIcon(achievement.icon)}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <span className="text-emerald-500 font-black text-xs uppercase tracking-[0.3em] mb-2 block">
              Achievement Unlocked
            </span>
            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
              {achievement.name}
            </h2>
            <p className="text-zinc-400 font-medium mb-8">
              {achievement.description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="w-full"
          >
            <Button 
              className="w-full h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-lg shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group"
              onClick={onClose}
            >
              Awesome! <CheckCircle2 size={20} className="group-hover:scale-125 transition-transform" />
            </Button>
          </motion.div>

          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
