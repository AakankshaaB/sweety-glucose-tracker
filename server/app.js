const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const readingsRoutes = require('./routes/readings');
const reportsRoutes = require('./routes/reports');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://sweety-glucose-tracker-swart.vercel.app',
  ...(process.env.CLIENT_URL || '').split(','),
]
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow tools like curl/Postman (no Origin header)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
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