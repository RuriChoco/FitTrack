const admin = require('firebase-admin');
require('dotenv').config();

// Re-use initialization logic from server or standalone here
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
    });
}

const db = admin.firestore();

const sampleExercises = [
    {
        name: "Brisk Walking",
        description: "A low-impact cardio exercise suitable for all ages.",
        minAge: 18,
        maxAge: 80,
        targetGender: "All",
        durationMinutes: 30,
        difficulty: "Beginner"
    },
    {
        name: "Yoga for Flexibility",
        description: "Focuses on stretching and core strength. Good for maintaining mobility.",
        minAge: 20,
        maxAge: 70,
        targetGender: "Female",
        durationMinutes: 45,
        difficulty: "Beginner"
    },
    {
        name: "Light Strength Training",
        description: "Using light weights to maintain muscle mass.",
        minAge: 30,
        maxAge: 60,
        targetGender: "Male",
        durationMinutes: 40,
        difficulty: "Intermediate"
    },
    {
        name: "Senior Chair Aerobics",
        description: "Gentle exercises performed while seated. Safe for elderly users.",
        minAge: 65,
        maxAge: 95,
        targetGender: "All",
        durationMinutes: 20,
        difficulty: "Beginner"
    }
];

async function seed() {
    console.log('Seeding exercises...');
    const exercisesRef = db.collection('exercises');

    for (const exercise of sampleExercises) {
        await exercisesRef.add(exercise);
        console.log(`Added: ${exercise.name}`);
    }
    console.log('Seeding complete!');
}

seed().catch(console.error);
