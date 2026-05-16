export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }
  const { userId, amount } = await context.request.json();
  if (!userId || !amount) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
  }
  const db = context.env.DB;
  await db.prepare('UPDATE users SET coins = coins + ? WHERE id = ?').bind(amount, userId).run();
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
}