// netlify/functions/load-game.js
const { Client } = require('pg');

exports.handler = async (event) => {
  // Ожидаем userId в query-параметрах, например ?userId=1
  const userId = event.queryStringParameters?.userId;

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Не указан userId' }),
    };
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();

    const result = await client.query(
      'SELECT night, difficulty FROM game_saves WHERE user_id = $1',
      [userId]
    );

    await client.end();

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Сохранение не найдено' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ save: result.rows[0] }),
    };
  } catch (error) {
    console.error('Load game error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Ошибка загрузки игры' }),
    };
  }
};