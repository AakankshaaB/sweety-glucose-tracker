const request = require('supertest');
const app = require('../app');
const db = require('../db');

// Lightweight in-memory mock of db.query so route tests run without a local Postgres instance
jest.mock('../db', () => {
  let users = [];
  let readings = [];
  let nextUserId = 1;
  let nextReadingId = 1;

  const slotRank = {
    'Morning (fasting)': 1,
    'After breakfast': 2,
    'After lunch': 3,
    'After dinner': 4,
  };

  function reset() {
    users = [];
    readings = [];
    nextUserId = 1;
    nextReadingId = 1;
  }

  async function query(sql, params = []) {
    const normalized = sql.replace(/\s+/g, ' ').trim();

    if (normalized.startsWith('SELECT id FROM users WHERE email')) {
      const found = users.filter((u) => u.email === params[0]);
      return { rows: found.map((u) => ({ id: u.id })) };
    }

    if (normalized.startsWith('INSERT INTO users')) {
      const user = {
        id: nextUserId++,
        name: params[0],
        email: params[1],
        password_hash: params[2],
      };
      users.push(user);
      return { rows: [{ id: user.id, name: user.name, email: user.email }] };
    }

    if (normalized.startsWith('SELECT id, name, email, password_hash FROM users WHERE email')) {
      return { rows: users.filter((u) => u.email === params[0]) };
    }

    if (normalized.startsWith('SELECT COUNT(*)::int AS total FROM readings')) {
      const [userId, dateFilter] = params;
      const filtered = readings.filter(
        (r) => r.user_id === userId && (!dateFilter || r.reading_date === dateFilter)
      );
      return { rows: [{ total: filtered.length }] };
    }

    if (normalized.startsWith('SELECT id, user_id, reading_date, time_slot, value, created_at, updated_at FROM readings')) {
      const userId = params[0];
      const hasDate = params.length === 4;
      const dateFilter = hasDate ? params[1] : null;
      const limit = hasDate ? params[2] : params[1];
      const offset = hasDate ? params[3] : params[2];

      const filtered = readings
        .filter((r) => r.user_id === userId && (!dateFilter || r.reading_date === dateFilter))
        .sort((a, b) => {
          if (a.reading_date !== b.reading_date) {
            return b.reading_date.localeCompare(a.reading_date);
          }
          return (slotRank[a.time_slot] || 5) - (slotRank[b.time_slot] || 5);
        });

      return { rows: filtered.slice(offset, offset + limit) };
    }

    if (normalized.includes('SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2 AND id != $3')) {
      const [userId, date, excludeId] = params;
      const count = readings.filter(
        (r) => r.user_id === userId && r.reading_date === date && r.id !== excludeId
      ).length;
      return { rows: [{ count }] };
    }

    if (normalized.startsWith('SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2')) {
      const [userId, date] = params;
      const count = readings.filter(
        (r) => r.user_id === userId && r.reading_date === date
      ).length;
      return { rows: [{ count }] };
    }

    if (normalized.startsWith('SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3 AND id != $4')) {
      const [userId, date, slot, excludeId] = params;
      const found = readings.filter(
        (r) =>
          r.user_id === userId &&
          r.reading_date === date &&
          r.time_slot === slot &&
          r.id !== excludeId
      );
      return { rows: found.map((r) => ({ id: r.id })) };
    }

    if (normalized.startsWith('SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3')) {
      const [userId, date, slot] = params;
      const found = readings.filter(
        (r) => r.user_id === userId && r.reading_date === date && r.time_slot === slot
      );
      return { rows: found.map((r) => ({ id: r.id })) };
    }

    if (normalized.startsWith('INSERT INTO readings')) {
      const [userId, readingDate, timeSlot, value] = params;
      const row = {
        id: nextReadingId++,
        user_id: userId,
        reading_date: readingDate,
        time_slot: timeSlot,
        value,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      readings.push(row);
      return { rows: [row] };
    }

    if (normalized.startsWith('SELECT id FROM readings WHERE id = $1 AND user_id = $2')) {
      const [id, userId] = params;
      const found = readings.filter((r) => r.id === id && r.user_id === userId);
      return { rows: found.map((r) => ({ id: r.id })) };
    }

    if (normalized.startsWith('UPDATE readings')) {
      const [readingDate, timeSlot, value, id, userId] = params;
      const target = readings.find((r) => r.id === id && r.user_id === userId);
      if (!target) return { rows: [] };
      target.reading_date = readingDate;
      target.time_slot = timeSlot;
      target.value = value;
      target.updated_at = new Date().toISOString();
      return { rows: [target] };
    }

    if (normalized.startsWith('DELETE FROM readings')) {
      const [id, userId] = params;
      const idx = readings.findIndex((r) => r.id === id && r.user_id === userId);
      if (idx === -1) return { rows: [] };
      readings.splice(idx, 1);
      return { rows: [{ id }] };
    }

    if (normalized.includes('MAX(value) AS highest')) {
      const [userId, startDate, endDate] = params;
      const matches = readings.filter(
        (r) => r.user_id === userId && r.reading_date >= startDate && r.reading_date <= endDate
      );
      if (matches.length === 0) {
        return { rows: [{ count: 0, highest: null, lowest: null, average: null }] };
      }
      const values = matches.map((r) => r.value);
      const sum = values.reduce((a, b) => a + b, 0);
      return {
        rows: [
          {
            count: matches.length,
            highest: Math.max(...values),
            lowest: Math.min(...values),
            average: Number((sum / matches.length).toFixed(1)),
          },
        ],
      };
    }

    if (normalized.startsWith('SELECT id, reading_date, time_slot, value FROM readings')) {
      const [userId, date] = params;
      const matches = readings
        .filter((r) => r.user_id === userId && r.reading_date === date)
        .sort((a, b) => (slotRank[a.time_slot] || 5) - (slotRank[b.time_slot] || 5));
      return { rows: matches };
    }

    throw new Error(`Unhandled query in test mock: ${normalized}`);
  }

  return { query, __reset: reset };
});

beforeEach(() => {
  db.__reset();
});

async function registerAndGetToken(name, email, password = 'password123') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password });
  return res.body.token;
}

describe('Auth endpoints', () => {
  test('registers a new user and logs in with hashed password', async () => {
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Maya Patel',
      email: 'maya@example.com',
      password: 'password123',
    });

    expect(regRes.status).toBe(201);
    expect(regRes.body.user).toEqual({
      id: 1,
      name: 'Maya Patel',
      email: 'maya@example.com',
    });
    expect(regRes.body.token).toBeDefined();

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'maya@example.com',
      password: 'password123',
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    const badLogin = await request(app).post('/api/auth/login').send({
      email: 'maya@example.com',
      password: 'wrongpassword',
    });
    expect(badLogin.status).toBe(401);
  });
});

describe('Readings CRUD & isolation', () => {
  test('enforces auth, user isolation, duplicate slot, and max 4 per day', async () => {
    const unauth = await request(app).get('/api/readings');
    expect(unauth.status).toBe(401);

    const tokenA = await registerAndGetToken('User A', 'a@example.com');
    const tokenB = await registerAndGetToken('User B', 'b@example.com');
    const date = '2026-10-15';

    const createRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ readingDate: date, timeSlot: 'After lunch', value: 135 });
    expect(createRes.status).toBe(201);

    // Duplicate slot check
    const dupRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ readingDate: date, timeSlot: 'After lunch', value: 140 });
    expect(dupRes.status).toBe(400);
    expect(dupRes.body.error).toBe(
      'You already have an After lunch reading for this date.'
    );

    // Add remaining 3 slots
    for (const slot of ['Morning (fasting)', 'After breakfast', 'After dinner']) {
      const res = await request(app)
        .post('/api/readings')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ readingDate: date, timeSlot: slot, value: 110 });
      expect(res.status).toBe(201);
    }

    // 5th reading on same day rejected
    const fifthRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ readingDate: date, timeSlot: 'After lunch', value: 120 });
    expect(fifthRes.status).toBe(400);
    expect(fifthRes.body.error).toBe('You can add only 4 readings per day.');

    // User B does not see User A's readings and cannot delete them
    const listB = await request(app)
      .get('/api/readings')
      .set('Authorization', `Bearer ${tokenB}`);
    expect(listB.status).toBe(200);
    expect(listB.body.readings).toHaveLength(0);

    const delB = await request(app)
      .delete(`/api/readings/${createRes.body.reading.id}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(delB.status).toBe(404);

    // User A can edit and delete their own reading
    const editA = await request(app)
      .put(`/api/readings/${createRes.body.reading.id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ readingDate: date, timeSlot: 'After lunch', value: 148 });
    expect(editA.status).toBe(200);
    expect(editA.body.reading.value).toBe(148);

    const delA = await request(app)
      .delete(`/api/readings/${createRes.body.reading.id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(delA.status).toBe(200);
  });
});

describe('Reports endpoint', () => {
  test('computes daily, month-to-date, and previous month reports', async () => {
    const token = await registerAndGetToken('Maya', 'maya@example.com');

    // Previous month (Sep 2026)
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ readingDate: '2026-09-20', timeSlot: 'Morning (fasting)', value: 90 });

    // Earlier in Oct 2026
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ readingDate: '2026-10-05', timeSlot: 'Morning (fasting)', value: 100 });

    // Selected date: 15 Oct 2026
    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ readingDate: '2026-10-15', timeSlot: 'Morning (fasting)', value: 95 });

    await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${token}`)
      .send({ readingDate: '2026-10-15', timeSlot: 'After lunch', value: 140 });

    const res = await request(app)
      .get('/api/reports?date=2026-10-15')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.daily).toMatchObject({
      count: 2,
      highest: 140,
      lowest: 95,
      average: 117.5,
    });
    expect(res.body.daily.readings).toHaveLength(2);
    expect(res.body.monthToDate).toMatchObject({
      count: 3,
      highest: 140,
      lowest: 95,
      average: 111.7,
    });
    expect(res.body.monthly).toMatchObject({
      count: 1,
      highest: 90,
      lowest: 90,
      average: 90,
    });
  });
});
