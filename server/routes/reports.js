const express = require('express');
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const {
  getTodayDateString,
  isValidDateString,
  getReportDateRanges,
} = require('../utils/dates');

const router = express.Router();

router.use(authMiddleware);

async function getRangeSummary(userId, startDate, endDate) {
  const result = await db.query(
    `SELECT
       COUNT(*)::int AS count,
       MAX(value) AS highest,
       MIN(value) AS lowest,
       ROUND(AVG(value)::numeric, 1)::float AS average
     FROM readings
     WHERE user_id = $1 AND reading_date >= $2 AND reading_date <= $3`,
    [userId, startDate, endDate]
  );

  const row = result.rows[0];
  return {
    startDate,
    endDate,
    count: row.count,
    highest: row.count > 0 ? row.highest : null,
    lowest: row.count > 0 ? row.lowest : null,
    average: row.count > 0 ? row.average : null,
  };
}

router.get('/', async (req, res) => {
  try {
    const selectedDate = req.query.date || getTodayDateString();
    if (!isValidDateString(selectedDate)) {
      return res.status(400).json({ error: 'Please select a valid date.' });
    }

    const ranges = getReportDateRanges(selectedDate);

    const [dailySummary, monthToDateSummary, monthlySummary, dailyReadings] =
      await Promise.all([
        getRangeSummary(req.user.id, ranges.daily.start, ranges.daily.end),
        getRangeSummary(
          req.user.id,
          ranges.monthToDate.start,
          ranges.monthToDate.end
        ),
        getRangeSummary(
          req.user.id,
          ranges.previousMonth.start,
          ranges.previousMonth.end
        ),
        db.query(
          `SELECT id, reading_date, time_slot, value
           FROM readings
           WHERE user_id = $1 AND reading_date = $2
           ORDER BY
             CASE time_slot
               WHEN 'Morning (fasting)' THEN 1
               WHEN 'After breakfast' THEN 2
               WHEN 'After lunch' THEN 3
               WHEN 'After dinner' THEN 4
               ELSE 5
             END ASC`,
          [req.user.id, selectedDate]
        ),
      ]);

    return res.json({
      selectedDate,
      daily: {
        ...dailySummary,
        readings: dailyReadings.rows,
      },
      monthToDate: monthToDateSummary,
      monthly: monthlySummary,
    });
  } catch (err) {
    console.error('Reports error:', err);
    return res.status(500).json({ error: 'Failed to generate reports.' });
  }
});

module.exports = router;
