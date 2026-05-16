export async function onRequest(context) {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId');
  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required' }), { status: 400 });
  }
  const db = context.env.DB;
  const rows = await db.prepare('SELECT item_name FROM purchases WHERE user_id = ?').bind(userId).all();
  const purchased = rows.results.map(r => r.item_name);
  return new Response(JSON.stringify({ purchased }), { headers: { 'Content-Type': 'application/json' } });
}