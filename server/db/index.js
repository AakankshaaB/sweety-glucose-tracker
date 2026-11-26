const fs = require('fs');
const path = require('path');
const { Pool, types } = require('pg');

// Return PostgreSQL DATE columns (OID 1082) as 'YYYY-MM-DD' strings
// instead of JS Date objects to avoid timezone shifts.
types.setTypeParser(1082, (val) => val);

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    isProduction && process.env.DB_SSL !== 'false'
      ? { rejectUnauthorized: false }
      : false,
});

async function initDb() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schemaSql);
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initDb,
};
