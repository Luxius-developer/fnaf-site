export async function onRequest(context) {
  const db = context.env.DB;
  const result = await db.prepare(
    `SELECT users.username, game_saves.night
     FROM game_saves
     JOIN users ON game_saves.user_id = users.id
     WHERE users.banned = 0
     ORDER BY game_saves.night DESC
     LIMIT 10`
  ).all();
  return new Response(JSON.stringify({ leaderboard: result.results }), { headers: { 'Content-Type': 'application/json' } });
}