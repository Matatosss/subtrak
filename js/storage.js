/**
 * SubTrack · Storage Layer
 * Abstraction over localStorage — ready to be swapped for a real API
 */

const Storage = (() => {
  const KEYS = {
    USERS:        'st:users',
    CURRENT_USER: 'st:session',
  };

  function _read(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
  }
  function _write(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ── Users ──────────────────────────────────────
  function getUsers() {
    return _read(KEYS.USERS) || [];
  }
  function saveUsers(users) {
    _write(KEYS.USERS, users);
  }
  function findUserByEmail(email) {
    return getUsers().find(u => u.email === email) || null;
  }
  function createUser({ firstName, lastName, email, password }) {
    const users = getUsers();
    if (users.find(u => u.email === email)) return { error: 'EMAIL_TAKEN' };
    const user = {
      id:        'u_' + Date.now(),
      firstName,
      lastName,
      email,
      password,        // NOTE: plain text — replace with hashing before production
      subscriptions:   [],
      settings: {
        notifyRenewal: true,
        notify3Days:   true,
        notify7Days:   false,
        monthlySummary: true,
        currency:      'EUR',
        language:      'fr',
      },
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    saveUsers(users);
    return { user };
  }
  function updateUser(updatedUser) {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === updatedUser.id);
    if (idx === -1) return false;
    users[idx] = updatedUser;
    saveUsers(users);
    return true;
  }

  // ── Session ────────────────────────────────────
  function getSession() {
    return _read(KEYS.CURRENT_USER);
  }
  function setSession(user) {
    _write(KEYS.CURRENT_USER, user);
  }
  function clearSession() {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }

  // ── Subscriptions (stored on user object) ──────
  function getSubscriptions(userId) {
    const user = getUsers().find(u => u.id === userId);
    return user ? (user.subscriptions || []) : [];
  }
  function saveSubscriptions(userId, subscriptions) {
    const users = getUsers();
    const user  = users.find(u => u.id === userId);
    if (!user) return false;
    user.subscriptions = subscriptions;
    saveUsers(users);
    // Keep session in sync
    const session = getSession();
    if (session && session.id === userId) {
      session.subscriptions = subscriptions;
      setSession(session);
    }
    return true;
  }

  return {
    getUsers, saveUsers, findUserByEmail, createUser, updateUser,
    getSession, setSession, clearSession,
    getSubscriptions, saveSubscriptions,
  };
})();
