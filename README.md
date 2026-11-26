# Sweety – Blood Glucose Tracker

Sweety is a web application for diabetes patients to log up to 4 blood glucose readings per day and review daily, month-to-date, and previous-month summary reports.

## Tech Stack

- **Backend:** Node.js, Express, PostgreSQL (`pg`), `bcryptjs`, `jsonwebtoken`
- **Frontend:** React, Vite, React Router
- **Testing:** Jest + Supertest (backend), Vitest + React Testing Library (frontend)

## Project Structure

```text
sweety/
├── server/          # Express API, PostgreSQL schema, seed script, and tests
└── client/          # React frontend and component tests
```

## Prerequisites

- Node.js 18 or newer
- PostgreSQL 14 or newer

## 1. Install Dependencies

```bash
cd server
npm install

cd ../client
npm install
```

## 2. Database Setup

1. Create a PostgreSQL database named `sweety`:

```bash
createdb sweety
```

2. Run the schema file to create the `users` and `readings` tables:

```bash
psql -d sweety -f server/db/schema.sql
```

3. Copy the environment example files and update them with your local values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

In `server/.env`:
- `PORT`: API server port (default `5000`)
- `DATABASE_URL`: PostgreSQL connection string, e.g. `postgresql://postgres:your_password@localhost:5432/sweety`
- `JWT_SECRET`: any long random string used to sign login tokens
- `CLIENT_URL`: frontend origin for CORS (default `http://localhost:5173`)

In `client/.env`:
- `VITE_API_URL`: backend API base URL (default `http://localhost:5000/api`)

4. Seed a demo account and sample readings:

```bash
cd server
npm run seed
```

Demo login credentials created by the seed script:
- **Email:** `maya@example.com`
- **Password:** `password123`

## 3. Running the App

Start the backend API (from `server/`):

```bash
cd server
npm run dev
```

Start the React frontend (from `client/` in another terminal):

```bash
cd client
npm run dev
```

Open `http://localhost:5173` in your browser.

## 4. Running Tests

Backend tests (validation, date range logic, and API routes):

```bash
cd server
npm test
```

Frontend tests (`ReadingForm` validation and submission):

```bash
cd client
npm test
```

## Notes

### Assumptions
- **Dates without timezone drift:** Readings are stored in PostgreSQL as `DATE` (`YYYY-MM-DD`) and returned directly as date strings so a reading logged for a specific day never shifts across timezones.
- **"Today" check:** Future-date validation compares against the user's current local calendar date (`YYYY-MM-DD`).
- **Four daily slots:** Only the four required slots (`Morning (fasting)`, `After breakfast`, `After lunch`, `After dinner`) are allowed, with at most one reading per slot per day and 4 readings per day total.
- **Included extras:** Added pagination (`?page=1&limit=20`) on `GET /api/readings` and React Testing Library unit tests for the reading form.

### What I would improve with more time
- Add a monthly trend line chart on the dashboard using Recharts so patients can spot patterns visually.
- Add CSV/PDF export for monthly reports to share with a doctor.
- Run integration tests against a dedicated test PostgreSQL database in CI (currently route tests use an in-memory mock for `db.query` so they run anywhere without requiring a running Postgres service).
- Add password reset and email verification flows.
