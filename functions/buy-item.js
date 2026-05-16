export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }
  const { userId, itemName } = await context.request.json();
  if (!userId || !itemName) {
    return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400 });
  }

  const prices = { power_saver: 200, door_reinforcement: 300, camera_optimizer: 250 };
  const price = prices[itemName];
  if (!price) {
    return new Response(JSON.stringify({ error: 'Unknown item' }), { status: 400 });
  }

  const db = context.env.DB;
  const user = await db.prepare('SELECT coins FROM users WHERE id = ?').bind(userId).first();
  if (!user || user.coins < price) {
    return new Response(JSON.stringify({ error: 'Недостаточно монет' }), { status: 402 });
  }

  const already = await db.prepare('SELECT id FROM purchases WHERE user_id = ? AND item_name = ?').bind(userId, itemName).first();
  if (already) {
    return new Response(JSON.stringify({ error: 'Уже куплено' }), { status: 409 });
  }

  await db.batch([
    db.prepare('UPDATE users SET coins = coins - ? WHERE id = ?').bind(price, userId),
    db.prepare('INSERT INTO purchases (user_id, item_name) VALUES (?, ?)').bind(userId, itemName)
  ]);
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
}