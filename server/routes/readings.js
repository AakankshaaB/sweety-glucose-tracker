const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const { isValidDateString } = require('../utils/dates');
const {
  validateReadingInput,
  duplicateSlotMessage,
} = require('../utils/validation');

const router = express.Router();

router.use(authMiddleware);

const SLOT_ORDER_SQL = `
  CASE time_slot
    WHEN 'Morning (fasting)' THEN 1
    WHEN 'After breakfast' THEN 2
    WHEN 'After lunch' THEN 3
    WHEN 'After dinner' THEN 4
    ELSE 5
  END
`;

router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const dateFilter = req.query.date;

    const params = [req.user.id];
    let whereClause = 'WHERE user_id = $1';

    if (dateFilter) {
      if (!isValidDateString(dateFilter)) {
        return res.status(400).json({ error: 'Invalid date filter.' });
      }
      params.push(dateFilter);
      whereClause += ` AND reading_date = $${params.length}`;
    }

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM readings ${whereClause}`,
      params
    );
    const total = countResult.rows[0].total;

    const listParams = [...params, limit, offset];
    const result = await db.query(
      `SELECT id, user_id, reading_date, time_slot, value, created_at, updated_at
       FROM readings
       ${whereClause}
       ORDER BY reading_date DESC, ${SLOT_ORDER_SQL} ASC
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    );

    return res.json({
      readings: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error('Get readings error:', err);
    return res.status(500).json({ error: 'Failed to load readings.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { readingDate, timeSlot, value } = req.body;
    const check = validateReadingInput({ readingDate, timeSlot, value });
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }

    const dayCountResult = await db.query(
      'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2',
      [req.user.id, readingDate]
    );
    if (dayCountResult.rows[0].count >= 4) {
      return res.status(400).json({ error: 'You can add only 4 readings per day.' });
    }

    const slotResult = await db.query(
      'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3',
      [req.user.id, readingDate, timeSlot]
    );
    if (slotResult.rows.length > 0) {
      return res.status(400).json({ error: duplicateSlotMessage(timeSlot) });
    }

    const inserted = await db.query(
      `INSERT INTO readings (user_id, reading_date, time_slot, value)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, reading_date, time_slot, value, created_at, updated_at`,
      [req.user.id, readingDate, timeSlot, check.parsedValue]
    );

    return res.status(201).json({ reading: inserted.rows[0] });
  } catch (err) {
    console.error('Create reading error:', err);
    return res.status(500).json({ error: 'Failed to save reading.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const readingId = parseInt(req.params.id, 10);
    if (!Number.isInteger(readingId)) {
      return res.status(400).json({ error: 'Invalid reading ID.' });
    }

    const existing = await db.query(
      'SELECT id FROM readings WHERE id = $1 AND user_id = $2',
      [readingId, req.user.id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    const { readingDate, timeSlot, value } = req.body;
    const check = validateReadingInput({ readingDate, timeSlot, value });
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }

    const dayCountResult = await db.query(
      'SELECT COUNT(*)::int AS count FROM readings WHERE user_id = $1 AND reading_date = $2 AND id != $3',
      [req.user.id, readingDate, readingId]
    );
    if (dayCountResult.rows[0].count >= 4) {
      return res.status(400).json({ error: 'You can add only 4 readings per day.' });
    }

    const slotResult = await db.query(
      'SELECT id FROM readings WHERE user_id = $1 AND reading_date = $2 AND time_slot = $3 AND id != $4',
      [req.user.id, readingDate, timeSlot, readingId]
    );
    if (slotResult.rows.length > 0) {
      return res.status(400).json({ error: duplicateSlotMessage(timeSlot) });
    }

    const updated = await db.query(
      `UPDATE readings
       SET reading_date = $1, time_slot = $2, value = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, reading_date, time_slot, value, created_at, updated_at`,
      [readingDate, timeSlot, check.parsedValue, readingId, req.user.id]
    );

    return res.json({ reading: updated.rows[0] });
  } catch (err) {
    console.error('Update reading error:', err);
    return res.status(500).json({ error: 'Failed to update reading.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const readingId = parseInt(req.params.id, 10);
    if (!Number.isInteger(readingId)) {
      return res.status(400).json({ error: 'Invalid reading ID.' });
    }

    const deleted = await db.query(
      'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id',
      [readingId, req.user.id]
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: 'Reading not found.' });
    }

    return res.json({ message: 'Reading deleted.' });
  } catch (err) {
    console.error('Delete reading error:', err);
    return res.status(500).json({ error: 'Failed to delete reading.' });
  }
});

module.exports = router;
