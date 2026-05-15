// netlify/functions/save-game.js
const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // В теле запроса ожидаем { userId, night, difficulty }
  const { userId, night, difficulty } = JSON.parse(event.body);

  if (!userId || night === undefined || difficulty === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Отсутствуют обязательные поля' }),
    };
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();

    // UPSERT — вставить или обновить запись для пользователя
    await client.query(
      `INSERT INTO game_saves (user_id, night, difficulty, last_updated)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET night = $2, difficulty = $3, last_updated = NOW()`,
      [userId, night, difficulty]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Save game error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Ошибка сохранения игры' }),
    };
  }
};