# Sweety - Blood Glucose Tracker

A small full-stack web app for diabetes patients to record up to 4 blood glucose readings per day and check daily, month-to-date, and previous-month summary reports.

## Tech Stack

- Backend: Node.js, Express, PostgreSQL (`pg`), `bcryptjs`, `jsonwebtoken`
- Frontend: React, Vite, React Router
- Tests: Jest + Supertest (backend), Vitest + React Testing Library (frontend)

## Project Structure

```text
sweety/
├── server/   # Express API, SQL schema, seed script, and backend tests
└── client/   # React app and form tests
```

## Setup

You will need Node.js (v18+) and PostgreSQL (v14+) installed.

### 1. Install packages

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Set up the database

Create a PostgreSQL database named `sweety`:

```bash
createdb sweety
```

Create the tables using the schema file:

```bash
psql -d sweety -f server/db/schema.sql
```

Copy the example env files and fill in your local values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Variables in `server/.env`:
- `PORT` - port for the Express server (default `5000`)
- `DATABASE_URL` - Postgres connection string, e.g. `postgresql://postgres:your_password@localhost:5432/sweety`
- `JWT_SECRET` - secret string used to sign JWT tokens
- `CLIENT_URL` - frontend URL for CORS (default `http://localhost:5173`)

Variables in `client/.env`:
- `VITE_API_URL` - backend API URL (default `http://localhost:5000/api`)

### 3. Seed sample data

Run the seed script to create a demo user and sample readings for the current and previous month:

```bash
cd server
npm run seed
```

Demo account credentials:
- Email: `maya@example.com`
- Password: `password123`

## Running Locally

Start the backend in one terminal:

```bash
cd server
npm run dev
```

Start the frontend in another terminal:

```bash
cd client
npm run dev
```

Then open `http://localhost:5173`.

## Running Tests

Backend tests:

```bash
cd server
npm test
```

Frontend tests:

```bash
cd client
npm test
```

## Notes

### Assumptions
- Dates are stored in PostgreSQL as `DATE` (`YYYY-MM-DD`) and returned directly as strings (via a `pg` type parser) so timezone offsets do not shift a reading to the previous or next day.
- Future-date checks compare against the user's local calendar date (`YYYY-MM-DD`).
- Only the 4 specified time slots are allowed (`Morning (fasting)`, `After breakfast`, `After lunch`, `After dinner`), with 1 reading per slot per day and a max of 4 readings per day.
- I also added pagination (`?page=1&limit=20`) on `GET /api/readings` and React Testing Library tests for `ReadingForm` from the bonus section.

### What I would improve with more time
- Add a monthly trend line chart using Recharts so changes over the month are easier to see.
- Add CSV or PDF export for reports.
- Run API tests against a real test PostgreSQL database in CI instead of an in-memory `db.query` mock.
- Add forgot-password / email verification flows.
