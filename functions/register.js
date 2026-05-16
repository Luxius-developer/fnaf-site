import bcrypt from 'bcryptjs';

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  const { username, password } = await context.request.json();
  if (!username || !password) {
    return new Response(JSON.stringify({ error: 'Username and password required' }), { status: 400 });
  }

  const db = context.env.DB;
  const existing = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (existing) {
    return new Response(JSON.stringify({ error: 'Пользователь уже существует' }), { status: 409 });
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  const result = await db.prepare('INSERT INTO users (username, password_hash, role, coins, banned) VALUES (?, ?, ?, ?, ?) RETURNING id, username, role, coins')
    .bind(username, hash, 'player', 0, 0)
    .first();

  return new Response(JSON.stringify({ user: result }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}