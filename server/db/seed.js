require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./index');

function formatDate(year, month, day) {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

function buildSampleReadings() {
  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const curDay = now.getDate();

  const prevDate = new Date(curYear, now.getMonth() - 1, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth() + 1;

  const slots = [
    'Morning (fasting)',
    'After breakfast',
    'After lunch',
    'After dinner',
  ];

  const rows = [];

  // Previous month sample readings (several days)
  const prevDays = [2, 5, 9, 14, 18, 22, 26];
  prevDays.forEach((day, idx) => {
    slots.forEach((slot, slotIdx) => {
      const base = 95 + slotIdx * 22 + ((idx * 7) % 25);
      rows.push({
        date: formatDate(prevYear, prevMonth, day),
        slot,
        value: base,
      });
    });
  });

  // Current month readings up to today
  const candidateDays = [1, 3, 6, 10, 15, 20, curDay].filter(
    (d, i, arr) => d <= curDay && arr.indexOf(d) === i
  );

  candidateDays.forEach((day, idx) => {
    // Leave today with 3 readings so the user can test adding a 4th reading
    const slotCount = day === curDay ? 3 : 4;
    for (let s = 0; s < slotCount; s += 1) {
      const value = 92 + s * 20 + ((idx * 11) % 30);
      rows.push({
        date: formatDate(curYear, curMonth, day),
        slot: slots[s],
        value,
      });
    }
  });

  return rows;
}

async function seed() {
  try {
    await db.initDb();

    const email = 'maya@example.com';
    const name = 'Maya Patel';
    const passwordHash = await bcrypt.hash('password123', 10);

    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    let userId;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
    } else {
      const inserted = await db.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [name, email, passwordHash]
      );
      userId = inserted.rows[0].id;
    }

    const samples = buildSampleReadings();
    for (const item of samples) {
      await db.query(
        `INSERT INTO readings (user_id, reading_date, time_slot, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, reading_date, time_slot) DO NOTHING`,
        [userId, item.date, item.slot, item.value]
      );
    }

    console.log('Seed completed successfully.');
    console.log('Demo login -> email: maya@example.com | password: password123');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seed();
