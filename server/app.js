const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const readingsRoutes = require('./routes/readings');
const reportsRoutes = require('./routes/reports');

const app = express();

const allowedOrigin = (process.env.CLIENT_URL || 'http://localhost:5173').replace(
  /\/+$/,
  ''
);

app.use(
  cors({
    origin: allowedOrigin,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/readings', readingsRoutes);
app.use('/api/reports', reportsRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

module.exports = app;
