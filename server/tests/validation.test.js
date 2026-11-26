const {
  validateReadingInput,
  validateRegisterInput,
  duplicateSlotMessage,
} = require('../utils/validation');
const { getReportDateRanges, isValidDateString } = require('../utils/dates');

describe('Reading validation', () => {
  const today = '2026-10-15';

  test('requires a glucose value', () => {
    const res = validateReadingInput(
      { readingDate: '2026-10-15', timeSlot: 'Morning (fasting)', value: '' },
      today
    );
    expect(res).toEqual({
      valid: false,
      error: 'Please enter a glucose value.',
    });
  });

  test('rejects values below 40, above 600, or non-integers', () => {
    for (const badValue of [39, 601, 110.5, 'abc']) {
      const res = validateReadingInput(
        { readingDate: '2026-10-15', timeSlot: 'After lunch', value: badValue },
        today
      );
      expect(res).toEqual({
        valid: false,
        error: 'Value must be between 40 and 600 mg/dl.',
      });
    }
  });

  test('rejects future dates', () => {
    const res = validateReadingInput(
      { readingDate: '2026-10-16', timeSlot: 'Morning (fasting)', value: 110 },
      today
    );
    expect(res).toEqual({
      valid: false,
      error: 'Date cannot be in the future.',
    });
  });

  test('accepts valid reading on today or past date', () => {
    const res = validateReadingInput(
      { readingDate: '2026-10-15', timeSlot: 'After dinner', value: '142' },
      today
    );
    expect(res).toEqual({ valid: true, parsedValue: 142 });
  });

  test('formats duplicate slot error messages clearly', () => {
    expect(duplicateSlotMessage('After lunch')).toBe(
      'You already have an After lunch reading for this date.'
    );
    expect(duplicateSlotMessage('Morning (fasting)')).toBe(
      'You already have a Morning (fasting) reading for this date.'
    );
  });
});

describe('Date helpers and report ranges', () => {
  test('computes daily, month-to-date, and previous month ranges', () => {
    expect(getReportDateRanges('2026-10-15')).toEqual({
      daily: { start: '2026-10-15', end: '2026-10-15' },
      monthToDate: { start: '2026-10-01', end: '2026-10-15' },
      previousMonth: { start: '2026-09-01', end: '2026-09-30' },
    });
  });

  test('handles January and leap-year February boundaries', () => {
    expect(getReportDateRanges('2026-01-10').previousMonth).toEqual({
      start: '2025-12-01',
      end: '2025-12-31',
    });
    expect(getReportDateRanges('2024-03-05').previousMonth).toEqual({
      start: '2024-02-01',
      end: '2024-02-29',
    });
  });

  test('validates calendar dates strictly', () => {
    expect(isValidDateString('2026-10-15')).toBe(true);
    expect(isValidDateString('2026-02-30')).toBe(false);
    expect(isValidDateString('15-10-2026')).toBe(false);
  });
});

describe('Registration validation', () => {
  test('rejects invalid email and short password', () => {
    expect(
      validateRegisterInput({ name: 'Sam', email: 'bad-email', password: 'secret' })
    ).toEqual({ valid: false, error: 'Please enter a valid email address.' });

    expect(
      validateRegisterInput({ name: 'Sam', email: 'sam@example.com', password: '123' })
    ).toEqual({ valid: false, error: 'Password must be at least 6 characters.' });
  });
});
