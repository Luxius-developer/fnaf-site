// netlify/functions/init-db.js
const { Client } = require('pg');

exports.handler = async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'player',
        coins INTEGER DEFAULT 0,
        banned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS game_saves (
        user_id INTEGER PRIMARY KEY REFERENCES users(id),
        night INTEGER DEFAULT 1,
        difficulty REAL DEFAULT 1.0,
        last_updated TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        item_name TEXT,
        purchased_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await client.end();
    return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Tables ready' }) };
  } catch (error) {
    console.error('Init DB error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to init DB', details: error.message }) };
  }
};