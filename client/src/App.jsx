import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { api } from './api';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sweety_token');
    if (!token) {
      setCheckingAuth(false);
      return;
    }

    api
      .getMe()
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('sweety_token');
        setUser(null);
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  function handleAuthSuccess(token, loggedInUser) {
    localStorage.setItem('sweety_token', token);
    setUser(loggedInUser);
  }

  function handleLogout() {
    localStorage.removeItem('sweety_token');
    setUser(null);
  }

  if (checkingAuth) {
    return (
      <div className="container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navbar user={user} onLogout={handleLogout} />
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <LoginPage onAuthSuccess={handleAuthSuccess} />
          }
        />
        <Route
          path="/register"
          element={
            user ? <Navigate to="/" replace /> : <RegisterPage onAuthSuccess={handleAuthSuccess} />
          }
        />
        <Route
          path="/"
          element={user ? <DashboardPage /> : <Navigate to="/login" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
