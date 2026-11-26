CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS readings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date DATE NOT NULL,
  time_slot VARCHAR(30) NOT NULL CHECK (
    time_slot IN (
      'Morning (fasting)',
      'After breakfast',
      'After lunch',
      'After dinner'
    )
  ),
  value INTEGER NOT NULL CHECK (value >= 40 AND value <= 600),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, reading_date, time_slot)
);

CREATE INDEX IF NOT EXISTS idx_readings_user_date
  ON readings (user_id, reading_date DESC);
