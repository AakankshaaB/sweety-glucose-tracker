function pad2(num) {
  return String(num).padStart(2, '0');
}

function getTodayDateString(now = new Date()) {
  const year = now.getFullYear();
  const month = pad2(now.getMonth() + 1);
  const day = pad2(now.getDate());
  return `${year}-${month}-${day}`;
}

function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const dt = new Date(year, month - 1, day);
  return (
    dt.getFullYear() === year &&
    dt.getMonth() === month - 1 &&
    dt.getDate() === day
  );
}

function getReportDateRanges(selectedDate) {
  const [year, month] = selectedDate.split('-').map(Number);
  const monthStr = pad2(month);

  const daily = {
    start: selectedDate,
    end: selectedDate,
  };

  const monthToDate = {
    start: `${year}-${monthStr}-01`,
    end: selectedDate,
  };

  // Day 0 of current month gives the last day of the previous month
  const prevMonthLastDate = new Date(year, month - 1, 0);
  const prevYear = prevMonthLastDate.getFullYear();
  const prevMonth = pad2(prevMonthLastDate.getMonth() + 1);
  const prevLastDay = pad2(prevMonthLastDate.getDate());

  const previousMonth = {
    start: `${prevYear}-${prevMonth}-01`,
    end: `${prevYear}-${prevMonth}-${prevLastDay}`,
  };

  return { daily, monthToDate, previousMonth };
}

module.exports = {
  getTodayDateString,
  isValidDateString,
  getReportDateRanges,
};
