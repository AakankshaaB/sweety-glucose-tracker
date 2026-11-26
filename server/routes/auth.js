const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { validateRegisterInput } = require('../utils/validation');

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { userId: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET || 'dev_secret_key',
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const check = validateRegisterInput(req.body);
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }

    const { cleanName, cleanEmail } = check;
    const { password } = req.body;

    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [cleanEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [cleanName, cleanEmail, passwordHash]
    );

    const user = result.rows[0];
    const token = createToken(user);

    return res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Something went wrong while registering.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = req.body.email ? String(req.body.email).trim().toLowerCase() : '';
    const password = req.body.password ? String(req.body.password) : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const result = await db.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const userRow = result.rows[0];
    const matches = await bcrypt.compare(password, userRow.password_hash);
    if (!matches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
    };
    const token = createToken(user);

    return res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Something went wrong while logging in.' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
