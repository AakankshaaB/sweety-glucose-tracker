const { getTodayDateString, isValidDateString } = require('./dates');

const TIME_SLOTS = [
  'Morning (fasting)',
  'After breakfast',
  'After lunch',
  'After dinner',
];

function duplicateSlotMessage(timeSlot) {
  const article = /^[aeiou]/i.test(timeSlot) ? 'an' : 'a';
  return `You already have ${article} ${timeSlot} reading for this date.`;
}

function validateReadingInput({ readingDate, timeSlot, value }, today = getTodayDateString()) {
  if (!isValidDateString(readingDate)) {
    return { valid: false, error: 'Please select a valid date.' };
  }

  if (readingDate > today) {
    return { valid: false, error: 'Date cannot be in the future.' };
  }

  if (!TIME_SLOTS.includes(timeSlot)) {
    return { valid: false, error: 'Please select a valid time slot.' };
  }

  if (value === undefined || value === null || String(value).trim() === '') {
    return { valid: false, error: 'Please enter a glucose value.' };
  }

  const parsedValue = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(parsedValue) || parsedValue < 40 || parsedValue > 600) {
    return { valid: false, error: 'Value must be between 40 and 600 mg/dl.' };
  }

  return { valid: true, parsedValue };
}

function validateRegisterInput({ name, email, password }) {
  if (!name || !String(name).trim()) {
    return { valid: false, error: 'Name is required.' };
  }
  const cleanEmail = email ? String(email).trim().toLowerCase() : '';
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { valid: false, error: 'Please enter a valid email address.' };
  }
  if (!password || String(password).length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters.' };
  }
  return {
    valid: true,
    cleanName: String(name).trim(),
    cleanEmail,
  };
}

module.exports = {
  TIME_SLOTS,
  duplicateSlotMessage,
  validateReadingInput,
  validateRegisterInput,
};
