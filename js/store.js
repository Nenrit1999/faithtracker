// store.js — per-user data store (namespaced by user ID)
const Store = {
  _key(suffix) {
    const u = Auth.currentUser();
    return u ? `ft_${u.id}_${suffix}` : null;
  },
  _load(suffix, fallback) {
    const k = this._key(suffix);
    if (!k) return fallback;
    try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; }
  },
  _save(suffix, value) {
    const k = this._key(suffix);
    if (!k) return;
    try { localStorage.setItem(k, JSON.stringify(value)); } catch {}
  },

  // ── Daily ──────────────────────────────────────────
  todayKey() { return new Date().toISOString().slice(0, 10); },
  getDay(d)  { const ds = this._load('days', {}); return ds[d] || { prayer:false, sermon:false, sermonTitle:'', bibleChapter:false, mood:'', gratitude:'' }; },
  saveDay(d, patch) {
    const ds = this._load('days', {});
    ds[d] = { ...this.getDay(d), ...patch };
    this._save('days', ds);
  },
  toggleSermon(d) { const day = this.getDay(d); this.saveDay(d, { sermon: !day.sermon }); },
  togglePrayer(d) { const day = this.getDay(d); this.saveDay(d, { prayer: !day.prayer }); },
  setSermonTitle(d, t) { this.saveDay(d, { sermonTitle: t }); },
  setMood(d, mood) { this.saveDay(d, { mood }); },
  setGratitude(d, text) { this.saveDay(d, { gratitude: text }); },

  // ── Bible ──────────────────────────────────────────
  toggleChapter(book, ch) {
    const b = this._load('bible', {}); const k = book + '__' + ch;
    b[k] = !b[k]; this._save('bible', b); return b[k];
  },
  isChapterRead(book, ch) { return !!this._load('bible', {})[book + '__' + ch]; },
  totalChaptersRead() { return Object.values(this._load('bible', {})).filter(Boolean).length; },
  getReflection(book, ch) { return (this._load('refs', {})[book + '__' + ch]) || ''; },
  saveReflection(book, ch, text) {
    const r = this._load('refs', {}); r[book + '__' + ch] = text; this._save('refs', r);
  },

  // ── Books ──────────────────────────────────────────
  getBooks() { return this._load('books', []); },
  addBook(title) {
    const bs = this.getBooks();
    bs.push({ id: Date.now(), title, chaptersRead: 0, done: false, addedAt: Date.now() });
    this._save('books', bs);
  },
  updateBook(id, patch) {
    const bs = this.getBooks().map(b => b.id === id ? { ...b, ...patch } : b);
    this._save('books', bs);
  },
  markBookDone(id) { this.updateBook(id, { done: true, completedAt: Date.now() }); },

  // ── Stats ──────────────────────────────────────────
  streakDays() {
    const ds = this._load('days', {}); let streak = 0;
    const d = new Date();
    for (let i = 0; i < 365; i++) {
      const k = d.toISOString().slice(0, 10);
      const day = ds[k];
      if (day && (day.bibleChapter || day.sermon || day.prayer)) {
        streak++; d.setDate(d.getDate() - 1);
      } else { if (i === 0) { d.setDate(d.getDate() - 1); continue; } break; }
    }
    return streak;
  },
};
