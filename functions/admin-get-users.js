export async function onRequest(context) {
  // В реальном приложении здесь должна быть проверка роли admin
  const db = context.env.DB;
  const users = await db.prepare('SELECT id, username, role, coins, banned FROM users ORDER BY id').all();
  return new Response(JSON.stringify({ users: users.results }), { headers: { 'Content-Type': 'application/json' } });
}