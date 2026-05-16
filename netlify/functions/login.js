// netlify/functions/login.js
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { username, password } = JSON.parse(event.body);
  if (!username || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Введите логин и пароль' }) };
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    const result = await client.query(
      'SELECT id, username, password_hash, role, coins, banned FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      await client.end();
      return { statusCode: 401, body: JSON.stringify({ error: 'Неверный логин или пароль' }) };
    }

    const user = result.rows[0];
    if (user.banned) {
      await client.end();
      return { statusCode: 403, body: JSON.stringify({ error: 'Ваш аккаунт заблокирован' }) };
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      await client.end();
      return { statusCode: 401, body: JSON.stringify({ error: 'Неверный логин или пароль' }) };
    }

    await client.end();
    return {
      statusCode: 200,
      body: JSON.stringify({
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          coins: user.coins,
        },
      }),
    };
  } catch (error) {
    console.error('Login error:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Ошибка сервера' }) };
  }
};