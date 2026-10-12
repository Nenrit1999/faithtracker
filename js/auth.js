// Simple auth using localStorage — each user's data is keyed by their own account
// No server needed; works perfectly for personal/family use hosted on Vercel

const Auth = {
  USERS_KEY: 'ft_users',
  SESSION_KEY: 'ft_session',

  getUsers() {
    try { return JSON.parse(localStorage.getItem(this.USERS_KEY) || '{}'); }
    catch { return {}; }
  },

  saveUsers(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  },

  currentUser() {
    try {
      const s = localStorage.getItem(this.SESSION_KEY);
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  },

  register(name, email, password) {
    const users = this.getUsers();
    const id = email.toLowerCase().trim();
    if (users[id]) return { ok: false, error: 'An account with this email already exists.' };
    const hash = this._hash(password);
    users[id] = { id, name: name.trim(), email: id, hash, createdAt: Date.now() };
    this.saveUsers(users);
    this._startSession(users[id]);
    return { ok: true };
  },

  login(email, password) {
    const users = this.getUsers();
    const id = email.toLowerCase().trim();
    const user = users[id];
    if (!user) return { ok: false, error: 'No account found with this email.' };
    if (user.hash !== this._hash(password)) return { ok: false, error: 'Incorrect password.' };
    this._startSession(user);
    return { ok: true };
  },

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    const inPages = window.location.pathname.includes('/pages/');
    window.location.href = inPages ? '../index.html' : 'index.html';
  },

  _startSession(user) {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify({ id: user.id, name: user.name }));
  },

  // Simple deterministic hash (fine for client-side personal use)
  _hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
    return (h >>> 0).toString(36);
  },

  resetPassword(email, newPassword) {
    const users = this.getUsers();
    const id = email.toLowerCase().trim();
    if (!users[id]) return { ok: false, error: 'No account found with this email.' };
    users[id].hash = this._hash(newPassword);
    this.saveUsers(users);
    return { ok: true };
  },

  requireAuth() {
    if (!this.currentUser()) {
      const inPages = window.location.pathname.includes('/pages/');
      window.location.href = inPages ? '../index.html' : 'index.html';
      return false;
    }
    return true;
  }
};
