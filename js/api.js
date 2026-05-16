// api.js – единый интерфейс к серверным функциям
window.FNAF_API = {
  async register(username, password) {
    const res = await fetch('/register', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Ошибка регистрации');
    return res.json();
  },
  async login(username, password) {
    const res = await fetch('/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Неверный логин/пароль');
    return res.json();
  },
  async saveGame(userId, night, difficulty) {
    await fetch('/save-game', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ userId, night, difficulty })
    });
  },
  async loadGame(userId) {
    const res = await fetch(`/load-game?userId=${userId}`);
    if (!res.ok) return null;
    return (await res.json()).save;
  },
  async addCoins(userId, amount) {
    await fetch('/add-coins', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ userId, amount })
    });
  },
  async loadPurchases(userId) {
    const res = await fetch(`/load-purchases?userId=${userId}`);
    return (await res.json()).purchased || [];
  },
  async buyItem(userId, itemName) {
    const res = await fetch('/buy-item', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ userId, itemName })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Ошибка покупки');
    return res.json();
  },
  async getLeaderboard() {
    const res = await fetch('/leaderboard');
    return (await res.json()).leaderboard || [];
  },
  async adminGetUsers() {
    const res = await fetch('/admin-get-users');
    return (await res.json()).users || [];
  },
  async adminUpdateUser(userId, updates) {
    const res = await fetch('/admin-update-user', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ userId, ...updates })
    });
    return res.json();
  },
  async getCurrentUser() {
    // Для восстановления сессии используется localStorage, но можно и серверный запрос
    const saved = localStorage.getItem('currentUser');
    if (saved) return JSON.parse(saved);
    return null;
  }
};