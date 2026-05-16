export async function onRequest(context) {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required' }), { status: 400 });
  }
  const db = context.env.DB;
  const save = await db.prepare('SELECT night, difficulty FROM game_saves WHERE user_id = ?').bind(userId).first();
  if (!save) {
    return new Response(JSON.stringify({ error: 'No save found' }), { status: 404 });
  }
  return new Response(JSON.stringify({ save }), { headers: { 'Content-Type': 'application/json' } });
}