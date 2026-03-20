-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  age INTEGER,
  gender TEXT,
  avatar TEXT,
  weekly_goal INTEGER DEFAULT 150
);

-- Exercises library for recommendations
CREATE TABLE IF NOT EXISTS exercises (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  category TEXT,
  min_age INTEGER,
  max_age INTEGER,
  gender_target TEXT,
  difficulty TEXT
);

-- Activity logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  exercise_name TEXT,
  duration INTEGER,
  date TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
