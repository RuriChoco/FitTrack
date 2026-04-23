const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Firebase Admin Initialization
// Using environment variables for security
try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
    console.log('Firebase Admin initialized successfully');
} catch (error) {
    console.error('Firebase Admin initialization error:', error.message);
}

const db = admin.firestore();

// --- API Routes ---

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 1. Get Recommendations (Deterministic Algorithm)
app.get('/api/recommendations', async (req, res) => {
    const { age, gender } = req.query;

    if (!age || !gender) {
        return res.status(400).json({ error: 'Age and gender are required' });
    }

    try {
        const userAge = parseInt(age);
        const exercisesRef = db.collection('exercises');
        
        // Deterministic filtering logic
        const snapshot = await exercisesRef
            .where('minAge', '<=', userAge)
            .where('maxAge', '>=', userAge)
            .get();

        if (snapshot.empty) {
            return res.json([]);
        }

        let exercises = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            // Filter by gender manually if multiple where clauses on different fields are limited without index
            if (data.targetGender === gender || data.targetGender === 'All') {
                exercises.push({ id: doc.id, ...data });
            }
        });

        res.json(exercises);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 2. Log Activity
app.post('/api/logs', async (req, res) => {
    const { userId, exerciseId, exerciseName, duration, status } = req.body;

    if (!userId || !exerciseId || !duration) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const logRef = db.collection('activity_logs').doc();
        const logData = {
            userId,
            exerciseId,
            exerciseName,
            duration: parseInt(duration),
            status: status || 'Completed',
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };

        await logRef.set(logData);
        res.status(201).json({ id: logRef.id, ...logData });
    } catch (error) {
        console.error('Error logging activity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Get Dashboard Stats (Last 7 Days)
app.get('/api/stats/:userId', async (req, res) => {
    const { userId } = req.params;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    try {
        const logsRef = db.collection('activity_logs');
        const snapshot = await logsRef
            .where('userId', '==', userId)
            .where('timestamp', '>=', sevenDaysAgo)
            .orderBy('timestamp', 'desc')
            .get();

        const logs = [];
        snapshot.forEach(doc => {
            logs.push({ id: doc.id, ...doc.data() });
        });

        res.json(logs);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
