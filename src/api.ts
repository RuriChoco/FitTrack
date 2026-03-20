export interface UserProfile {
  id: string;
  username: string;
  age: number;
  gender: string;
  avatar?: string;
  weekly_goal: number;
  is_admin?: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  difficulty?: string;
}

export interface ActivityLog {
  id: string;
  exercise_name: string;
  duration: number;
  date: string;
}

export interface DailyStat {
  date: string;
  total_duration: number;
}

export interface WeeklyGoal {
  current_weekly_total: number;
  target_goal: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
}

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, deleteUser as deleteAuthUser, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, query, where, onSnapshot, getCountFromServer } from 'firebase/firestore';

// TODO: Replace with your actual Firebase Project config!
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const mockResponse = (data?: any, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => data
});

const SEED_EXERCISES: Exercise[] = [
  { id: '1', name: 'Brisk Walking', category: 'Cardio', difficulty: 'Beginner' },
  { id: '2', name: 'Gentle Yoga', category: 'Flexibility', difficulty: 'Beginner' },
  { id: '3', name: 'Swimming', category: 'Cardio', difficulty: 'Intermediate' },
  { id: '4', name: 'Chair Aerobics', category: 'Cardio', difficulty: 'Beginner' },
  { id: '5', name: 'Resistance Band Training', category: 'Strength', difficulty: 'Intermediate' },
  { id: '6', name: 'Tai Chi', category: 'Balance', difficulty: 'Beginner' },
  { id: '7', name: 'Bodyweight Squats', category: 'Strength', difficulty: 'Intermediate' },
  { id: '8', name: 'Stretching Routine', category: 'Flexibility', difficulty: 'Beginner' },
  { id: '9', name: 'Dancing', category: 'Cardio', difficulty: 'Intermediate' },
  { id: '10', name: 'Pilates', category: 'Strength', difficulty: 'Intermediate' },
  { id: '11', name: 'Heavy Lifting', category: 'Strength', difficulty: 'Advanced' },
];

export const api = {
  subscribeToAnnouncement: (callback: (data: { message: string, date: string } | null) => void) => {
    return onSnapshot(doc(db, 'app_data', 'announcement'), (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as { message: string, date: string });
      } else {
        callback(null);
      }
    });
  },

  updateAnnouncement: async (message: string) => {
    try {
      if (!auth.currentUser) throw new Error('Not auth');
      await setDoc(doc(db, 'app_data', 'announcement'), {
        message,
        date: new Date().toISOString()
      });
      return mockResponse({ success: true });
    } catch (e) { return mockResponse({ error: 'Failed' }, false, 500); }
  },

  subscribeToActivityLogs: (userId: string, callback: () => void) => {
    const q = query(collection(db, 'activity_logs'), where('user_id', '==', userId));
    return onSnapshot(q, () => {
      callback();
    });
  },

  signup: async (data: any) => {
    try {
      const email = `${data.username}@fittrack.local`;
      const cred = await createUserWithEmailAndPassword(auth, email, data.password);
      const userDoc = {
        id: cred.user.uid,
        username: data.username,
        age: data.age,
        gender: data.gender,
        avatar: data.avatar || null,
        weekly_goal: data.weekly_goal || 150,
        is_admin: false
      };
      await setDoc(doc(db, 'users', cred.user.uid), userDoc);
      return mockResponse({ user: userDoc, token: 'firebase-token' });
    } catch (e) {
      return mockResponse({ error: 'Signup failed' }, false, 400);
    }
  },
    
  login: async (data: any) => {
    try {
      const email = `${data.username}@fittrack.local`;
      const cred = await signInWithEmailAndPassword(auth, email, data.password);
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      return mockResponse({ user: userDoc.data(), token: 'firebase-token' });
    } catch (e) {
      return mockResponse({ error: 'Login failed' }, false, 401);
    }
  },
    
  loginWithGoogle: async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const userRef = doc(db, 'users', cred.user.uid);
      const userSnap = await getDoc(userRef);
      
      let userDoc;
      if (userSnap.exists()) {
        userDoc = userSnap.data();
      } else {
        userDoc = {
          id: cred.user.uid,
          username: cred.user.displayName || cred.user.email?.split('@')[0] || 'User',
          age: 30, // Default age
          gender: 'other',
          avatar: cred.user.photoURL || null,
          weekly_goal: 150,
          is_admin: false
        };
        await setDoc(userRef, userDoc);
      }
      return mockResponse({ user: userDoc, token: 'firebase-token' });
    } catch (e) {
      return mockResponse({ error: 'Google Sign-In failed' }, false, 401);
    }
  },
    
  updateProfile: async (data: any) => {
    try {
      if (!auth.currentUser) throw new Error('Not auth');
      if (data.password) await updatePassword(auth.currentUser, data.password);
      const updateData = { ...data };
      delete updateData.password;
      await updateDoc(doc(db, 'users', auth.currentUser.uid), updateData);
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      return mockResponse(userDoc.data());
    } catch (e) {
      return mockResponse({ error: 'Update failed' }, false, 500);
    }
  },
    
  deleteProfile: async () => {
    try {
      if (!auth.currentUser) throw new Error('Not auth');
      const uid = auth.currentUser.uid;
      const logsSnap = await getDocs(query(collection(db, 'activity_logs'), where('user_id', '==', uid)));
      await Promise.all(logsSnap.docs.map(d => deleteDoc(d.ref)));
      await deleteDoc(doc(db, 'users', uid));
      await deleteAuthUser(auth.currentUser);
      return mockResponse({ success: true });
    } catch (e) {
      return mockResponse({ error: 'Delete failed' }, false, 500);
    }
  },
    
  getMe: async () => {
    try {
      await auth.authStateReady();
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        return mockResponse(userDoc.data());
      }
      return mockResponse({ error: 'Not auth' }, false, 401);
    } catch (e) {
      return mockResponse({ error: 'Not auth' }, false, 401);
    }
  },

  getTotalUsers: async () => {
    try {
      const snapshot = await getCountFromServer(collection(db, 'users'));
      return mockResponse({ count: snapshot.data().count });
    } catch (e) {
      return mockResponse({ count: 0 }, false, 500);
    }
  },
  
  getRecommendations: async (age: number, gender: string) => {
    return mockResponse(SEED_EXERCISES.slice(0, 5));
  },
  
  getLogs: async (userId: string) => {
    try {
      const snap = await getDocs(query(collection(db, 'activity_logs'), where('user_id', '==', userId)));
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog)).sort((a, b) => b.date.localeCompare(a.date));
      return mockResponse(logs);
    } catch (e) {
      return mockResponse([], false, 500);
    }
  },
  
  getStats: async (userId: string, range: 'week' | 'month' = 'week') => {
    try {
      const days = range === 'month' ? 30 : 7;
      const d = new Date(); d.setDate(d.getDate() - days);
      const dateStr = d.toISOString().split('T')[0];
      
      const snap = await getDocs(query(collection(db, 'activity_logs'), where('user_id', '==', userId)));
      const statsMap: Record<string, number> = {};
      
      snap.docs.forEach(doc => {
        const data = doc.data() as ActivityLog;
        if (data.date >= dateStr) {
          statsMap[data.date] = (statsMap[data.date] || 0) + data.duration;
        }
      });
      
      const stats = Object.keys(statsMap).sort().map(date => ({ date, total_duration: statsMap[date] }));
      return mockResponse(stats);
    } catch (e) {
      return mockResponse([], false, 500);
    }
  },
  
  getGoals: async () => {
    try {
      if (!auth.currentUser) throw new Error('Not auth');
      const uid = auth.currentUser.uid;
      const userDoc = await getDoc(doc(db, 'users', uid));
      const targetGoal = userDoc.data()?.weekly_goal || 150;
      
      const d = new Date(); d.setDate(d.getDate() - 7);
      const dateStr = d.toISOString().split('T')[0];
      
      const snap = await getDocs(query(collection(db, 'activity_logs'), where('user_id', '==', uid)));
      const currentTotal = snap.docs.reduce((sum, doc) => doc.data().date >= dateStr ? sum + doc.data().duration : sum, 0);
      
      return mockResponse({ current_weekly_total: currentTotal, target_goal: targetGoal });
    } catch (e) {
      return mockResponse({ current_weekly_total: 0, target_goal: 150 });
    }
  },
  
  getAchievements: async () => {
    try {
      if (!auth.currentUser) throw new Error('Not auth');
      const snap = await getDocs(query(collection(db, 'activity_logs'), where('user_id', '==', auth.currentUser.uid)));
      
      const count = snap.docs.length;
      const dur = snap.docs.reduce((sum, doc) => sum + doc.data().duration, 0);
      const ach = [];
      
      if (count >= 1) ach.push({ id: 'first_step', name: 'First Step', description: 'Logged your first activity', icon: 'Star' });
      if (count >= 5) ach.push({ id: 'getting_serious', name: 'Getting Serious', description: 'Logged 5 total activities', icon: 'Medal' });
      if (dur >= 100) ach.push({ id: 'century_club', name: 'Century Club', description: 'Reached 100 active minutes', icon: 'Award' });
      if (dur >= 500) ach.push({ id: 'marathoner', name: 'Marathoner', description: 'Reached 500 active minutes', icon: 'Trophy' });
      
      return mockResponse(ach);
    } catch (e) { return mockResponse([]); }
  },
  
  logActivity: async (data: any) => {
    try {
      await addDoc(collection(db, 'activity_logs'), data);
      return mockResponse({ success: true });
    } catch (e) { return mockResponse({ error: 'Failed' }, false, 500); }
  },
    
  updateLog: async (logId: string, data: any) => {
    try {
      await updateDoc(doc(db, 'activity_logs', logId), data);
      return mockResponse({ success: true });
    } catch (e) { return mockResponse({ error: 'Failed' }, false, 500); }
  },
    
  deleteLog: async (logId: string) => {
    try {
      await deleteDoc(doc(db, 'activity_logs', logId));
      return mockResponse({ success: true });
    } catch (e) { return mockResponse({ error: 'Failed' }, false, 500); }
  }
};