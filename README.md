# Sweety – Blood Glucose Tracker

A small web app I built for diabetes patients to track their blood glucose readings. Users can log up to 4 readings per day (one for each meal slot) and view daily and monthly summary reports.

Built with Node.js + Express on the backend, PostgreSQL to store data, and React on the frontend.

---

## What it can do

- Register and log in (passwords are hashed using bcrypt, never stored as plain text)
- Add, edit and delete blood glucose readings
- Each reading has a date, a time slot (Morning, After breakfast, After lunch, After dinner) and a value in mg/dl
- Validation on both frontend and backend — shows clear error messages
- Three reports: Daily, Month-to-date, and Previous month (shows highest, lowest, average and count)
- Pagination on the readings list

---

## Tech used

- **Backend:** Node.js, Express, PostgreSQL, bcryptjs, jsonwebtoken
- **Frontend:** React, Vite, React Router
- **Tests:** Jest + Supertest (backend), Vitest + React Testing Library (frontend)

---

## Folder structure

```
sweety/
  server/    -> Express API, DB schema, seed script, tests
  client/    -> React frontend, components, tests
```

---

## How to run locally

### Requirements
- Node.js (v18+)
- PostgreSQL (v14+)

### Step 1 – Install packages

```bash
cd server
npm install

cd ../client
npm install
```

### Step 2 – Set up the database

Create the database in PostgreSQL (using pgAdmin or psql):
```
CREATE DATABASE sweety;
```

The tables (`users` and `readings`) are created automatically when the server starts for the first time.

### Step 3 – Create .env files

In the `server` folder, create a `.env` file (you can copy `.env.example`):

```
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/sweety
JWT_SECRET=any_long_random_string_here
CLIENT_URL=http://localhost:5173
```

In the `client` folder, create a `.env` file (copy `.env.example`):

```
VITE_API_URL=http://localhost:5000/api
```

### Step 4 – Add demo data (optional)

This creates a demo user with some sample readings so you can test the app right away:

```bash
cd server
npm run seed
```

Demo account:
- Email: `maya@example.com`
- Password: `password123`

### Step 5 – Start the app

Backend (open a terminal in `server/`):
```bash
npm run dev
```

Frontend (open another terminal in `client/`):
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Running tests

Backend:
```bash
cd server
npm test
```

Frontend:
```bash
cd client
npm test
```

---

## Notes and assumptions

- I store dates as plain `YYYY-MM-DD` strings from PostgreSQL (not JS Date objects) to avoid timezone issues where a reading saved at night might show up on the wrong day.
- The "future date" check uses the user's local date on both frontend and backend.
- I added pagination to the readings list (`?page=1&limit=20`) as a bonus since it's useful when there are many records.
- Backend route tests use an in-memory mock of the database so you don't need a running PostgreSQL just to run `npm test`.

## What I'd add with more time

- A line chart showing glucose trends over the month (was planning to use Recharts for this)
- Export to CSV or PDF so a patient can share reports with their doctor
- Email verification when signing up
- Proper CI pipeline that runs tests against a real test database
