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
  const user = await db.prepare('SELECT id, username, password_hash, role, coins, banned FROM users WHERE username = ?').bind(username).first();
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return new Response(JSON.stringify({ error: 'Неверный логин или пароль' }), { status: 401 });
  }
  if (user.banned) {
    return new Response(JSON.stringify({ error: 'Аккаунт заблокирован' }), { status: 403 });
  }

  return new Response(JSON.stringify({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      coins: user.coins
    }
  }), { headers: { 'Content-Type': 'application/json' } });
}