export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  age: number;
  gender: string;
  avatar?: string;
  weekly_goal: number;
  is_admin?: boolean;
  weight?: number;
  target_weight?: number;
  weight_unit?: string;
  goal_type?: string;
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

export interface WeightLog {
  id: string;
  weight: number;
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
import { getAnalytics } from 'firebase/analytics';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, deleteUser as deleteAuthUser, GoogleAuthProvider, signInWithPopup, connectAuthEmulator, sendEmailVerification, signOut, sendPasswordResetEmail, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc, getDocs, query, where, onSnapshot, getCountFromServer, enableIndexedDbPersistence, writeBatch, serverTimestamp, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, connectStorageEmulator, deleteObject } from 'firebase/storage';
import { evaluateAchievements } from './data/achievements';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

if (import.meta.env.DEV) {
  // Connect to local emulators during development
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
  console.log('Connected to Firebase Local Emulators');
} else {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firebase offline caching failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      console.warn('Firebase offline caching not supported by this browser.');
    }
  });
}

const googleProvider = new GoogleAuthProvider();

const mockResponse = (data?: any, ok = true, status = 200) => ({
  ok,
  status,
  json: async () => data
});

const SEED_EXERCISES: Exercise[] = [
  // Beginner - Cardio
  { id: '1',  name: 'Brisk Walking',           category: 'Cardio',       difficulty: 'Beginner' },
  { id: '4',  name: 'Chair Aerobics',           category: 'Cardio',       difficulty: 'Beginner' },
  { id: '12', name: 'Slow Jogging',             category: 'Cardio',       difficulty: 'Beginner' },
  { id: '13', name: 'Jump Rope',                category: 'Cardio',       difficulty: 'Beginner' },
  { id: '14', name: 'Cycling (Leisure)',        category: 'Cardio',       difficulty: 'Beginner' },
  { id: '15', name: 'Water Aerobics',           category: 'Cardio',       difficulty: 'Beginner' },
  { id: '38', name: 'Toe Taps',                 category: 'Cardio',       difficulty: 'Beginner' },
  { id: '39', name: 'Aquatic Walking',          category: 'Cardio',       difficulty: 'Beginner' },
  { id: '40', name: 'Hula Hooping',             category: 'Cardio',       difficulty: 'Beginner' },
  // Beginner - Flexibility and Balance
  { id: '2',  name: 'Gentle Yoga',              category: 'Flexibility',  difficulty: 'Beginner' },
  { id: '6',  name: 'Tai Chi',                  category: 'Balance',      difficulty: 'Beginner' },
  { id: '8',  name: 'Stretching Routine',       category: 'Flexibility',  difficulty: 'Beginner' },
  { id: '16', name: 'Foam Rolling',             category: 'Flexibility',  difficulty: 'Beginner' },
  { id: '17', name: 'Balance Board',            category: 'Balance',      difficulty: 'Beginner' },
  { id: '41', name: 'Light Stretching',         category: 'Flexibility',  difficulty: 'Beginner' },
  { id: '42', name: 'Arm Circles',              category: 'Flexibility',  difficulty: 'Beginner' },
  { id: '43', name: 'Standing Desk Exercises',  category: 'Flexibility',  difficulty: 'Beginner' },
  // Beginner - Strength
  { id: '18', name: 'Wall Push-Ups',            category: 'Strength',     difficulty: 'Beginner' },
  { id: '19', name: 'Seated Leg Raises',        category: 'Strength',     difficulty: 'Beginner' },
  { id: '20', name: 'Glute Bridges',            category: 'Strength',     difficulty: 'Beginner' },
  { id: '44', name: 'Wall Sits',                category: 'Strength',     difficulty: 'Beginner' },
  { id: '45', name: 'Heel Raises',              category: 'Strength',     difficulty: 'Beginner' },
  // Intermediate - Cardio
  { id: '3',  name: 'Swimming',                 category: 'Cardio',       difficulty: 'Intermediate' },
  { id: '9',  name: 'Dancing',                  category: 'Cardio',       difficulty: 'Intermediate' },
  { id: '21', name: 'Rowing Machine',           category: 'Cardio',       difficulty: 'Intermediate' },
  { id: '22', name: 'Stair Climbing',           category: 'Cardio',       difficulty: 'Intermediate' },
  { id: '23', name: 'Cycling (Moderate)',       category: 'Cardio',       difficulty: 'Intermediate' },
  { id: '24', name: 'Running',                  category: 'Cardio',       difficulty: 'Intermediate' },
  { id: '46', name: 'Zumba',                    category: 'Cardio',       difficulty: 'Intermediate' },
  { id: '47', name: 'Elliptical Machine',       category: 'Cardio',       difficulty: 'Intermediate' },
  { id: '48', name: 'Shadow Boxing',            category: 'Cardio',       difficulty: 'Intermediate' },
  { id: '49', name: 'Kickboxing Basics',        category: 'Cardio',       difficulty: 'Intermediate' },
  { id: '50', name: 'Step Aerobics',            category: 'Cardio',       difficulty: 'Intermediate' },
  { id: '56', name: 'Piloxing',                 category: 'Cardio',       difficulty: 'Intermediate' },
  // Intermediate - Strength
  { id: '5',  name: 'Resistance Band Training', category: 'Strength',     difficulty: 'Intermediate' },
  { id: '7',  name: 'Bodyweight Squats',        category: 'Strength',     difficulty: 'Intermediate' },
  { id: '10', name: 'Pilates',                  category: 'Strength',     difficulty: 'Intermediate' },
  { id: '25', name: 'Dumbbell Rows',            category: 'Strength',     difficulty: 'Intermediate' },
  { id: '26', name: 'Lunges',                   category: 'Strength',     difficulty: 'Intermediate' },
  { id: '27', name: 'Push-Ups',                 category: 'Strength',     difficulty: 'Intermediate' },
  { id: '28', name: 'Plank Hold',               category: 'Strength',     difficulty: 'Intermediate' },
  { id: '51', name: 'Kettlebell Swings',        category: 'Strength',     difficulty: 'Intermediate' },
  { id: '52', name: 'TRX Basics',               category: 'Strength',     difficulty: 'Intermediate' },
  { id: '53', name: 'Core Crunch Circuit',      category: 'Strength',     difficulty: 'Intermediate' },
  // Intermediate - HIIT and Sports
  { id: '29', name: 'HIIT Circuit',             category: 'HIIT',         difficulty: 'Intermediate' },
  { id: '30', name: 'Basketball',               category: 'Sports',       difficulty: 'Intermediate' },
  { id: '31', name: 'Tennis / Badminton',       category: 'Sports',       difficulty: 'Intermediate' },
  { id: '54', name: 'Burpees',                  category: 'HIIT',         difficulty: 'Intermediate' },
  { id: '55', name: 'Mountain Climbers',        category: 'HIIT',         difficulty: 'Intermediate' },
  // Advanced
  { id: '11', name: 'Heavy Lifting',            category: 'Strength',     difficulty: 'Advanced' },
  { id: '32', name: 'Sprinting Intervals',      category: 'Cardio',       difficulty: 'Advanced' },
  { id: '33', name: 'CrossFit WOD',             category: 'HIIT',         difficulty: 'Advanced' },
  { id: '34', name: 'Olympic Weightlifting',    category: 'Strength',     difficulty: 'Advanced' },
  { id: '35', name: 'Triathlon Training',       category: 'Cardio',       difficulty: 'Advanced' },
  { id: '36', name: 'Rock Climbing',            category: 'Sports',       difficulty: 'Advanced' },
  { id: '37', name: 'Advanced Yoga (Ashtanga)', category: 'Flexibility',  difficulty: 'Advanced' },
  { id: '57', name: 'Muscle-Ups',               category: 'Strength',     difficulty: 'Advanced' },
  { id: '58', name: 'Powerlifting',             category: 'Strength',     difficulty: 'Advanced' },
  { id: '59', name: 'Ironman Training',         category: 'Cardio',       difficulty: 'Advanced' },
  { id: '60', name: 'Advanced Calisthenics',    category: 'Strength',     difficulty: 'Advanced' },
  { id: '61', name: 'Bouldering',               category: 'Sports',       difficulty: 'Advanced' },
  { id: '62', name: 'Plyometric Push-ups',      category: 'Strength',     difficulty: 'Advanced' },
  { id: '63', name: 'Handstand Push-ups',       category: 'Strength',     difficulty: 'Advanced' },
  { id: '64', name: 'Sled Pushes',              category: 'Strength',     difficulty: 'Advanced' },
  { id: '65', name: 'Battle Ropes',             category: 'Strength',     difficulty: 'Advanced' },
  { id: '66', name: 'Parkour',                  category: 'Sports',       difficulty: 'Advanced' }
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

  uploadAvatar: async (file: File, userId: string, oldAvatarUrl?: string) => {
    try {
      if (oldAvatarUrl && oldAvatarUrl.includes('firebasestorage')) {
        try {
          const oldRef = ref(storage, oldAvatarUrl);
          await deleteObject(oldRef);
        } catch (delErr) {
          console.warn('Failed to delete old avatar:', delErr);
        }
      }

      const fileExtension = file.name.split('.').pop();
      const storageRef = ref(storage, `avatars/${userId}_${Date.now()}.${fileExtension}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return mockResponse({ url });
    } catch (e: any) {
      return mockResponse({ error: e.message || 'Failed to upload image' }, false, 500);
    }
  },

  signup: async (data: any) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await sendEmailVerification(cred.user);
      const userDoc = {
        id: cred.user.uid,
        username: data.username,
        email: data.email,
        age: data.age,
        gender: data.gender,
        avatar: data.avatar || null,
        weekly_goal: data.weekly_goal || 150,
        is_admin: false,
        weight: data.weight || null,
        target_weight: data.target_weight || null,
        weight_unit: data.weight_unit || 'lbs',
        goal_type: data.goal_type || 'maintain'
      };
      await setDoc(doc(db, 'users', cred.user.uid), userDoc);
      // Sign them out immediately so they are forced to verify and log in
      await signOut(auth);
      return mockResponse({ success: true });
    } catch (e: any) {
      return mockResponse({ error: e.message || 'Signup failed' }, false, 400);
    }
  },
    
  login: async (data: any) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
      
      if (!cred.user.emailVerified) {
        await signOut(auth);
        return mockResponse({ error: 'Please verify your email address before logging in.', needsVerification: true }, false, 403);
      }
      
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      return mockResponse({ user: userDoc.data(), token: 'firebase-token' });
    } catch (e: any) {
      return mockResponse({ error: e.message || 'Login failed' }, false, 401);
    }
  },
    
  resendVerification: async (data: any) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, data.email, data.password);
      if (!cred.user.emailVerified) {
        await sendEmailVerification(cred.user);
        await signOut(auth);
        return mockResponse({ success: true });
      }
      await signOut(auth);
      return mockResponse({ error: 'Email is already verified. You can log in.' }, false, 400);
    } catch (e: any) {
      return mockResponse({ error: e.message || 'Failed to resend verification email.' }, false, 400);
    }
  },

  resetPassword: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return mockResponse({ success: true });
    } catch (e: any) {
      return mockResponse({ error: e.message || 'Failed to send reset email.' }, false, 400);
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
          email: cred.user.email || '',
          age: 30, // Default age
          gender: 'other',
          avatar: cred.user.photoURL || null,
          weekly_goal: 150,
          is_admin: false,
          weight: null,
          target_weight: null,
          weight_unit: 'lbs',
          goal_type: 'maintain'
        };
        await setDoc(userRef, userDoc);
      }
      return mockResponse({ user: userDoc, token: 'firebase-token' });
    } catch (e: any) {
      return mockResponse({ error: e.message || 'Google Sign-In failed' }, false, 401);
    }
  },
    
  updateProfile: async (data: any) => {
    try {
      if (!auth.currentUser) throw new Error('Not auth');
      if (data.password) {
        if (data.oldPassword) {
          try {
            const cred = EmailAuthProvider.credential(auth.currentUser.email || '', data.oldPassword);
            await reauthenticateWithCredential(auth.currentUser, cred);
          } catch (err: any) {
            return mockResponse({ error: 'Incorrect current password.' }, false, 403);
          }
        }
        await updatePassword(auth.currentUser, data.password);
      }
      const updateData = { ...data };
      delete updateData.password;
      delete updateData.oldPassword;
      await updateDoc(doc(db, 'users', auth.currentUser.uid), updateData);
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      return mockResponse(userDoc.data());
    } catch (e: any) {
      return mockResponse({ error: e.message || 'Update failed' }, false, 500);
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
  
  getAllUsers: async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const users = snap.docs.map(d => ({ ...d.data() } as UserProfile));
      return mockResponse(users);
    } catch (e) {
      return mockResponse([], false, 500);
    }
  },
  
  getWeightLogs: async (userId: string) => {
    try {
      const snap = await getDocs(query(collection(db, 'weight_logs'), where('user_id', '==', userId)));
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() } as WeightLog)).sort((a, b) => a.date.localeCompare(b.date));
      return mockResponse(logs);
    } catch (e) {
      return mockResponse([], false, 500);
    }
  },
  
  getRecommendations: async (age: number, gender: string, goal_type?: string) => {
    let recs = [...SEED_EXERCISES];
    if (goal_type === 'lose_weight') {
      recs = recs.filter(e => e.category === 'Cardio' || e.category === 'Flexibility');
    } else if (goal_type === 'build_muscle') {
      recs = recs.filter(e => e.category === 'Strength');
    }
    
    // Shuffle the recommendations and display up to 12 at a time
    const shuffled = recs.sort(() => 0.5 - Math.random());
    return mockResponse(shuffled.slice(0, 12));
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
  
  getStats: async (logs: ActivityLog[], range: 'week' | 'month' = 'week') => {
    try {
      const days = range === 'month' ? 30 : 7;
      const d = new Date(); d.setDate(d.getDate() - days);
      const dateStr = d.toISOString().split('T')[0];
      
      const statsMap: Record<string, number> = {};
      
      logs.forEach(data => {
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
  
  getGoals: async (logs: ActivityLog[], targetGoal: number) => {
    try {
      const d = new Date(); d.setDate(d.getDate() - 7);
      const dateStr = d.toISOString().split('T')[0];
      
      const currentTotal = logs.reduce((sum, doc) => doc.date >= dateStr ? sum + doc.duration : sum, 0);
      
      return mockResponse({ current_weekly_total: currentTotal, target_goal: targetGoal });
    } catch (e) {
      return mockResponse({ current_weekly_total: 0, target_goal: targetGoal });
    }
  },
  
  getAchievements: async (logs: ActivityLog[]) => {
    try {
      if (!auth.currentUser) throw new Error('Not auth');
      const uid = auth.currentUser.uid;

      const ach = evaluateAchievements(logs);

      
      // Check against Firestore to see which badges are already saved
      const earnedSnap = await getDocs(collection(db, `users/${uid}/earned_badges`));
      const earnedIds = new Set(earnedSnap.docs.map(d => d.id));

      const newBadges = ach.filter(b => !earnedIds.has(b.id));

      // Save any newly unlocked badges
      if (newBadges.length > 0) {
        const batch = writeBatch(db);
        for (const badge of newBadges) {
          const badgeRef = doc(db, `users/${uid}/earned_badges`, badge.id);
          batch.set(badgeRef, { ...badge, earned_at: serverTimestamp() });
        }
        await batch.commit();
      }
      
      return mockResponse(ach);
    } catch (e) { return mockResponse([]); }
  },
  
  logActivity: async (data: any) => {
    try {
      if (!auth.currentUser) throw new Error('Not auth');
      
      const batch = writeBatch(db);
      const newLogRef = doc(collection(db, 'activity_logs'));
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      batch.set(newLogRef, data);
      batch.update(userRef, { last_logged_at: serverTimestamp() });
      await batch.commit();
      
      return mockResponse({ success: true });
    } catch (e) { return mockResponse({ error: 'Failed' }, false, 500); }
  },
    
  logWeight: async (weight: number) => {
    try {
      if (!auth.currentUser) throw new Error('Not auth');
      const dateStr = new Date().toISOString().split('T')[0];
      
      const batch = writeBatch(db);
      const userRef = doc(db, 'users', auth.currentUser.uid);
      batch.update(userRef, { weight });

      const q = query(collection(db, 'weight_logs'), where('user_id', '==', auth.currentUser.uid), where('date', '==', dateStr));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        batch.update(snap.docs[0].ref, { weight });
      } else {
        const newLogRef = doc(collection(db, 'weight_logs'));
        batch.set(newLogRef, { user_id: auth.currentUser.uid, weight, date: dateStr });
      }
      
      await batch.commit();
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