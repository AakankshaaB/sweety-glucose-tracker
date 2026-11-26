function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  return parseDate(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatRange(startDate, endDate) {
  if (!startDate || !endDate) return '';
  if (startDate === endDate) {
    return formatDisplayDate(startDate);
  }
  const startShort = parseDate(startDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
  return `${startShort} – ${formatDisplayDate(endDate)}`;
}

function ReportCard({ title, summary, emptyText, children }) {
  return (
    <div className="report-box">
      <h3>{title}</h3>
      <p className="report-range">{formatRange(summary.startDate, summary.endDate)}</p>

      {summary.count === 0 ? (
        <p className="empty-state">{emptyText}</p>
      ) : (
        <>
          <div className="stats-list">
            <div className="stat-item">
              <span className="stat-label">Highest</span>
              <span className="stat-value">{summary.highest} mg/dl</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Lowest</span>
              <span className="stat-value">{summary.lowest} mg/dl</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average</span>
              <span className="stat-value">{summary.average} mg/dl</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Readings</span>
              <span className="stat-value">{summary.count}</span>
            </div>
          </div>
          {children}
        </>
      )}
    </div>
  );
}

export default function ReportsSection({
  reports,
  selectedDate,
  today,
  onDateChange,
  loading,
}) {
  return (
    <section className="card">
      <div className="section-header">
        <h2>Reports</h2>
        <div className="date-picker-inline">
          <label htmlFor="report-date">Selected date:</label>
          <input
            id="report-date"
            type="date"
            max={today}
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                onDateChange(e.target.value);
              }
            }}
          />
        </div>
      </div>

      {loading && !reports ? (
        <p className="empty-state">Loading reports...</p>
      ) : reports ? (
        <div className="reports-grid">
          <ReportCard
            title="Daily"
            summary={reports.daily}
            emptyText="No readings recorded for this day."
          >
            <div className="daily-list">
              <strong>Readings</strong>
              <ul>
                {reports.daily.readings.map((item) => (
                  <li key={item.id}>
                    <span>{item.time_slot}</span>
                    <strong>{item.value} mg/dl</strong>
                  </li>
                ))}
              </ul>
            </div>
          </ReportCard>

          <ReportCard
            title="Month-to-date"
            summary={reports.monthToDate}
            emptyText="No readings recorded yet this month."
          />

          <ReportCard
            title="Monthly (previous month)"
            summary={reports.monthly}
            emptyText="No readings recorded for the previous month."
          />
        </div>
      ) : null}
    </section>
  );
}
