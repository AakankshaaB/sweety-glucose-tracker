import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import ReadingForm, { getLocalToday } from '../components/ReadingForm';
import ReportsSection from '../components/ReportsSection';
import ReadingsList from '../components/ReadingsList';

export default function DashboardPage() {
  const today = getLocalToday();
  const [selectedDate, setSelectedDate] = useState(today);
  const [page, setPage] = useState(1);

  const [readings, setReadings] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [reports, setReports] = useState(null);
  const [editingReading, setEditingReading] = useState(null);
  const [loadingReports, setLoadingReports] = useState(true);
  const [pageError, setPageError] = useState('');

  const loadReadings = useCallback(async (targetPage = page) => {
    const data = await api.getReadings(targetPage, 20);
    setReadings(data.readings);
    setPagination(data.pagination);
  }, [page]);

  const loadReports = useCallback(async (targetDate = selectedDate) => {
    setLoadingReports(true);
    try {
      const data = await api.getReports(targetDate);
      setReports(data);
    } finally {
      setLoadingReports(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    setPageError('');
    loadReadings(page).catch((err) => setPageError(err.message));
  }, [page, loadReadings]);

  useEffect(() => {
    setPageError('');
    loadReports(selectedDate).catch((err) => setPageError(err.message));
  }, [selectedDate, loadReports]);

  async function handleSaveReading(payload) {
    if (editingReading) {
      await api.updateReading(editingReading.id, payload);
      setEditingReading(null);
    } else {
      await api.createReading(payload);
    }
    await Promise.all([loadReadings(page), loadReports(selectedDate)]);
  }

  async function handleDeleteReading(id) {
    setPageError('');
    try {
      await api.deleteReading(id);
      if (editingReading && editingReading.id === id) {
        setEditingReading(null);
      }
      await Promise.all([loadReadings(page), loadReports(selectedDate)]);
    } catch (err) {
      setPageError(err.message);
    }
  }

  return (
    <main className="container">
      {pageError && (
        <div className="error-box" role="alert">
          {pageError}
        </div>
      )}

      <ReadingForm
        editingReading={editingReading}
        onSave={handleSaveReading}
        onCancelEdit={() => setEditingReading(null)}
        today={today}
      />

      <ReportsSection
        reports={reports}
        selectedDate={selectedDate}
        today={today}
        onDateChange={setSelectedDate}
        loading={loadingReports}
      />

      <ReadingsList
        readings={readings}
        pagination={pagination}
        onEdit={(reading) => {
          setEditingReading(reading);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onDelete={handleDeleteReading}
        onPageChange={setPage}
      />
    </main>
  );
}
