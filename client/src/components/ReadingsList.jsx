import { formatDisplayDate } from './ReportsSection';

export default function ReadingsList({
  readings,
  pagination,
  onEdit,
  onDelete,
  onPageChange,
}) {
  return (
    <section className="card">
      <h2>Reading history</h2>

      {readings.length === 0 ? (
        <p className="empty-state">
          You have not logged any readings yet. Use the form above to add your first reading.
        </p>
      ) : (
        <>
          <table className="readings-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time slot</th>
                <th>Glucose</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((reading) => (
                <tr key={reading.id}>
                  <td>{formatDisplayDate(reading.reading_date)}</td>
                  <td>{reading.time_slot}</td>
                  <td>
                    <strong>{reading.value}</strong> mg/dl
                  </td>
                  <td>
                    <div className="btn-group">
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => onEdit(reading)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        onClick={() => onDelete(reading.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                type="button"
                className="btn btn-secondary btn-small"
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
