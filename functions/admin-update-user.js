export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }
  const { userId, coins, banned, role } = await context.request.json();
  if (!userId) {
    return new Response(JSON.stringify({ error: 'userId required' }), { status: 400 });
  }
  const db = context.env.DB;
  const updates = [];
  const params = [];
  if (coins !== undefined) { updates.push('coins = ?'); params.push(coins); }
  if (banned !== undefined) { updates.push('banned = ?'); params.push(banned ? 1 : 0); }
  if (role !== undefined) { updates.push('role = ?'); params.push(role); }
  if (updates.length > 0) {
    params.push(userId);
    await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
  }
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
}