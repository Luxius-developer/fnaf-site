export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }
  const { userId, night, difficulty } = await context.request.json();
  if (!userId || night === undefined || difficulty === undefined) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
  }
  const db = context.env.DB;
  await db.prepare(`INSERT INTO game_saves (user_id, night, difficulty, last_updated)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id) DO UPDATE SET night = ?, difficulty = ?, last_updated = CURRENT_TIMESTAMP`)
    .bind(userId, night, difficulty, night, difficulty)
    .run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
}