const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('sweety_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong.');
  }
  return data;
}

export const api = {
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMe: () => request('/auth/me'),
  getReadings: (page = 1, limit = 20) =>
    request(`/readings?page=${page}&limit=${limit}`),
  createReading: (payload) =>
    request('/readings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateReading: (id, payload) =>
    request(`/readings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteReading: (id) =>
    request(`/readings/${id}`, {
      method: 'DELETE',
    }),
  getReports: (date) => request(`/reports?date=${encodeURIComponent(date)}`),
};
