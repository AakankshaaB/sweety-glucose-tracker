import { useEffect, useState } from 'react';

export const TIME_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

export function getLocalToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function ReadingForm({
  editingReading,
  onSave,
  onCancelEdit,
  today = getLocalToday(),
}) {
  const [readingDate, setReadingDate] = useState(today);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setError('');
    if (editingReading) {
      setReadingDate(editingReading.reading_date);
      setTimeSlot(editingReading.time_slot);
      setValue(String(editingReading.value));
    } else {
      setReadingDate(today);
      setTimeSlot(TIME_SLOTS[0]);
      setValue('');
    }
  }, [editingReading, today]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!readingDate) {
      setError('Please select a valid date.');
      return;
    }

    if (readingDate > today) {
      setError('Date cannot be in the future.');
      return;
    }

    const trimmed = String(value).trim();
    if (!trimmed) {
      setError('Please enter a glucose value.');
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 40 || parsed > 600) {
      setError('Value must be between 40 and 600 mg/dl.');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        readingDate,
        timeSlot,
        value: parsed,
      });
      if (!editingReading) {
        setValue('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="card">
      <h2>{editingReading ? 'Edit reading' : 'Add a reading'}</h2>
      {error && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="reading-date">Date</label>
            <input
              id="reading-date"
              type="date"
              max={today}
              value={readingDate}
              onChange={(e) => setReadingDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="reading-slot">Time slot</label>
            <select
              id="reading-slot"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="reading-value">Glucose (mg/dl)</label>
            <input
              id="reading-value"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 115"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
        </div>

        <div className="btn-group">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving
              ? 'Saving...'
              : editingReading
              ? 'Update reading'
              : 'Save reading'}
          </button>
          {editingReading && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancelEdit}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
