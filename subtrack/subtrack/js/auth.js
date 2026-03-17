/**
 * SubTrack · Authentication
 */

const Auth = {

  // ── Screen transitions ──────────────────────────────────────────
  showAuth() {
    Utils.el('screen-auth').classList.add('active');
    Utils.el('screen-app').classList.remove('active');
    this._bindAuthTab('login');
  },

  showApp() {
    Utils.el('screen-auth').classList.remove('active');
    Utils.el('screen-app').classList.add('active');
    this._initApp();
  },

  // ── Tab switch ─────────────────────────────────────────────────
  _bindAuthTab(tab) {
    Utils.qsa('.auth-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === tab)
    );
    Utils.el('form-login').classList.toggle('hidden',    tab !== 'login');
    Utils.el('form-register').classList.toggle('hidden', tab !== 'register');
  },

  switchTab(tab) {
    this._bindAuthTab(tab);
    // Clear errors
    ['loginError','regError'].forEach(id => {
      const e = Utils.el(id);
      if (e) e.classList.remove('visible');
    });
  },

  // ── Login ───────────────────────────────────────────────────────
  login() {
    const email = Utils.el('loginEmail').value.trim();
    const pass  = Utils.el('loginPassword').value;
    const errEl = Utils.el('loginError');

    errEl.classList.remove('visible');

    const user = Storage.findUserByEmail(email);
    if (!user || user.password !== pass) {
      errEl.textContent = 'Email ou mot de passe incorrect.';
      errEl.classList.add('visible');
      return;
    }

    this._startSession(user);
  },

  // ── Register ────────────────────────────────────────────────────
  register() {
    const firstName = Utils.el('regFirst').value.trim();
    const lastName  = Utils.el('regLast').value.trim();
    const email     = Utils.el('regEmail').value.trim();
    const pass      = Utils.el('regPassword').value;
    const errEl     = Utils.el('regError');

    errEl.classList.remove('visible');

    if (!firstName || !lastName) {
      errEl.textContent = 'Veuillez renseigner votre prénom et nom.';
      errEl.classList.add('visible'); return;
    }
    if (!email.includes('@')) {
      errEl.textContent = 'Adresse email invalide.';
      errEl.classList.add('visible'); return;
    }
    if (pass.length < 6) {
      errEl.textContent = 'Mot de passe trop court (6 caractères minimum).';
      errEl.classList.add('visible'); return;
    }

    const result = Storage.createUser({ firstName, lastName, email, password: pass });
    if (result.error === 'EMAIL_TAKEN') {
      errEl.textContent = 'Cet email est déjà utilisé.';
      errEl.classList.add('visible'); return;
    }

    this._startSession(result.user);
    Toast.show('🎉 Compte créé avec succès !', 'success');
  },

  // ── Demo account ────────────────────────────────────────────────
  loginDemo() {
    const DEMO_EMAIL = 'demo@subtrack.fr';
    let user = Storage.findUserByEmail(DEMO_EMAIL);

    if (!user) {
      Storage.createUser({
        firstName: 'Alice', lastName: 'Martin',
        email: DEMO_EMAIL, password: 'demo123',
      });
      user = Storage.findUserByEmail(DEMO_EMAIL);
    }

    // Always reset demo subs
    Storage.saveSubscriptions(user.id, [...DEMO_SUBSCRIPTIONS]);
    user = Storage.findUserByEmail(DEMO_EMAIL);
    this._startSession(user);
    Toast.show('👋 Bienvenue sur le compte démo !', 'info');
  },

  // ── Logout ──────────────────────────────────────────────────────
  logout() {
    Modal.closeAll();
    Storage.clearSession();
    State.user = null;
    State.subscriptions = [];
    this.showAuth();
    Toast.show('👋 Déconnecté', 'info');
  },

  // ── Internal ────────────────────────────────────────────────────
  _startSession(user) {
    Storage.setSession(user);
    State.user          = user;
    State.subscriptions = Storage.getSubscriptions(user.id);
    this.showApp();
  },

  _initApp() {
    const u = State.user;
    const initials = ((u.firstName[0] || '') + (u.lastName?.[0] || '')).toUpperCase();

    Utils.el('headerGreeting').textContent  = this._greeting();
    Utils.el('headerName').textContent      = u.firstName + ' ' + (u.lastName || '');
    Utils.el('headerAvatar').textContent    = initials;

    Router.go('dashboard');
    this._updateNotifBadge();
  },

  _greeting() {
    const h = new Date().getHours();
    if (h < 6)  return 'Bonsoir 🌙';
    if (h < 12) return 'Bonjour ☀️';
    if (h < 18) return 'Bon après-midi 👋';
    return 'Bonsoir 🌙';
  },

  _updateNotifBadge() {
    const count = State.subscriptions.filter(s =>
      s.status !== 'paused' && Utils.daysUntil(s.renewalDate) <= 7
        && Utils.daysUntil(s.renewalDate) >= 0
    ).length;

    const badge = Utils.el('notifBadge');
    if (count > 0) {
      badge.textContent = count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },
};
