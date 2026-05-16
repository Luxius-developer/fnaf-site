// netlify/functions/register.js
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  // Разрешаем только POST-запросы
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { username, password } = JSON.parse(event.body);
    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Введите логин и пароль' }),
      };
    }

    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    // Проверяем, нет ли уже такого пользователя
    const existing = await client.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      await client.end();
      return {
        statusCode: 409,
        body: JSON.stringify({ error: 'Пользователь уже существует' }),
      };
    }

    // Хэшируем пароль
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Добавляем пользователя
    const result = await client.query(
      `INSERT INTO users (username, password_hash, role, coins, banned)
       VALUES ($1, $2, 'player', 0, false)
       RETURNING id, username, role, coins`,
      [username, passwordHash]
    );

    await client.end();

    return {
      statusCode: 201,
      body: JSON.stringify({ user: result.rows[0] }),
    };
  } catch (error) {
    console.error('Register error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Ошибка сервера', details: error.message }),
    };
  }
};