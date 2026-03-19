import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database('exercise_tracker.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    age INTEGER,
    gender TEXT
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    min_age INTEGER,
    max_age INTEGER,
    gender_target TEXT
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    exercise_name TEXT,
    duration INTEGER,
    date TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Seed some exercises if empty
const exerciseCount = db.prepare('SELECT COUNT(*) as count FROM exercises').get() as { count: number };
if (exerciseCount.count === 0) {
  const insert = db.prepare('INSERT INTO exercises (name, category, min_age, max_age, gender_target) VALUES (?, ?, ?, ?, ?)');
  const seedData = [
    ['Brisk Walking', 'Cardio', 0, 100, 'all'],
    ['Gentle Yoga', 'Flexibility', 0, 100, 'all'],
    ['Swimming', 'Cardio', 5, 80, 'all'],
    ['Chair Aerobics', 'Cardio', 60, 100, 'all'],
    ['Resistance Band Training', 'Strength', 18, 70, 'all'],
    ['Tai Chi', 'Balance', 50, 100, 'all'],
    ['Bodyweight Squats', 'Strength', 15, 60, 'all'],
    ['Stretching Routine', 'Flexibility', 0, 100, 'all'],
    ['Dancing', 'Cardio', 5, 70, 'all'],
    ['Pilates', 'Strength', 18, 65, 'female'],
    ['Heavy Lifting', 'Strength', 18, 50, 'male'],
  ];
  seedData.forEach(row => insert.run(...row));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post('/api/profile', (req, res) => {
    const { username, age, gender } = req.body;
    try {
      const info = db.prepare('INSERT OR REPLACE INTO users (username, age, gender) VALUES (?, ?, ?)').run(username, age, gender);
      res.json({ id: info.lastInsertRowid, username, age, gender });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save profile' });
    }
  });

  app.get('/api/user/:username', (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.params.username);
    if (user) res.json(user);
    else res.status(404).json({ error: 'User not found' });
  });

  app.get('/api/recommendations', (req, res) => {
    const { age, gender } = req.query;
    const userAge = parseInt(age as string);
    const userGender = gender as string;

    const recommendations = db.prepare(`
      SELECT * FROM exercises 
      WHERE (min_age <= ? AND max_age >= ?) 
      AND (gender_target = 'all' OR gender_target = ?)
      LIMIT 5
    `).all(userAge, userAge, userGender);

    res.json(recommendations);
  });

  app.post('/api/logs', (req, res) => {
    const { user_id, exercise_name, duration, date } = req.body;
    try {
      db.prepare('INSERT INTO activity_logs (user_id, exercise_name, duration, date) VALUES (?, ?, ?, ?)').run(user_id, exercise_name, duration, date);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to log activity' });
    }
  });

  app.get('/api/logs/:user_id', (req, res) => {
    const logs = db.prepare('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY date DESC').all(req.params.user_id);
    res.json(logs);
  });

  app.get('/api/stats/:user_id', (req, res) => {
    const stats = db.prepare(`
      SELECT date, SUM(duration) as total_duration 
      FROM activity_logs 
      WHERE user_id = ? 
      GROUP BY date 
      ORDER BY date ASC 
      LIMIT 7
    `).all(req.params.user_id);
    res.json(stats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
