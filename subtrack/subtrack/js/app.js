/**
 * SubTrack · App Core
 * Global state, router, constants, toast, modal system
 */

// ── Constants ──────────────────────────────────────────────────────
const EMOJIS = [
  '📺','🎵','🎮','💼','☁️','💪','📰','📚','💳','🖥️',
  '🚚','🎬','📦','🎯','🏠','✈️','🍕','🧘','📱','🔒',
  '🎓','💡','🏋️','🎨','🎤','🎙️','📡','🛡️','🚀','⚡',
];

const COLORS = [
  '#7c6dfa','#ff5470','#22d97a','#22d4ff','#ffaa2b',
  '#f472b6','#a855f7','#fb923c','#60a5fa','#2dd4bf',
  '#ffd60a','#94a3b8',
];

const CATEGORIES = [
  { id: 'Streaming',     label: '🎬 Streaming',          color: 'var(--cat-streaming)' },
  { id: 'Musique',       label: '🎵 Musique',             color: 'var(--cat-music)' },
  { id: 'Jeux',          label: '🎮 Jeux vidéo',          color: 'var(--cat-games)' },
  { id: 'Productivité',  label: '💼 Productivité',        color: 'var(--cat-productivity)' },
  { id: 'Cloud',         label: '☁️ Cloud & Stockage',    color: 'var(--cat-cloud)' },
  { id: 'Fitness',       label: '💪 Fitness & Santé',     color: 'var(--cat-fitness)' },
  { id: 'Actualités',    label: '📰 Actualités & Presse', color: 'var(--cat-news)' },
  { id: 'Éducation',     label: '📚 Éducation',           color: 'var(--cat-education)' },
  { id: 'Finance',       label: '💳 Finance & Banque',    color: 'var(--cat-finance)' },
  { id: 'Logiciels',     label: '🖥️ Logiciels & Dev',     color: 'var(--cat-software)' },
  { id: 'Livraison',     label: '🚚 Livraison & Courses', color: 'var(--cat-delivery)' },
  { id: 'Autre',         label: '📦 Autre',               color: 'var(--cat-other)' },
];

const CAT_COLOR = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c.color])
);

const CAT_HEX = {
  Streaming: '#ff5470', Musique: '#a855f7', Jeux: '#22d4ff',
  Productivité: '#22d97a', Cloud: '#7c6dfa', Fitness: '#ff8a2b',
  Actualités: '#ffd60a', Éducation: '#2dd4bf', Finance: '#f472b6',
  Logiciels: '#fb923c', Livraison: '#60a5fa', Autre: '#94a3b8',
};

const DEMO_SUBSCRIPTIONS = [
  { id:'d1', name:'Netflix',       emoji:'📺', color:'#ff5470', amount:15.99, freq:'monthly', category:'Streaming',    startDate:'2023-01-15', renewalDate: Utils.daysFromNow(3),   note:'Compte famille 4K',  status:'active' },
  { id:'d2', name:'Spotify',       emoji:'🎵', color:'#a855f7', amount:9.99,  freq:'monthly', category:'Musique',      startDate:'2022-06-01', renewalDate: Utils.daysFromNow(8),   note:'Famille 6 comptes',  status:'active' },
  { id:'d3', name:'iCloud 200 Go', emoji:'☁️', color:'#7c6dfa', amount:2.99,  freq:'monthly', category:'Cloud',        startDate:'2021-03-20', renewalDate: Utils.daysFromNow(1),   note:'',                   status:'active' },
  { id:'d4', name:'Adobe Creative',emoji:'🖥️', color:'#fb923c', amount:59.99, freq:'monthly', category:'Logiciels',   startDate:'2023-09-01', renewalDate: Utils.daysFromNow(15),  note:'Toute la suite',     status:'active' },
  { id:'d5', name:'Amazon Prime',  emoji:'🚚', color:'#60a5fa', amount:69.99, freq:'yearly',  category:'Livraison',    startDate:'2023-01-01', renewalDate: Utils.daysFromNow(120), note:'',                   status:'active' },
  { id:'d6', name:'Xbox Game Pass',emoji:'🎮', color:'#22d4ff', amount:14.99, freq:'monthly', category:'Jeux',         startDate:'2023-11-01', renewalDate: Utils.daysFromNow(22),  note:'',                   status:'active' },
  { id:'d7', name:'Notion Pro',    emoji:'💼', color:'#22d97a', amount:8.00,  freq:'monthly', category:'Productivité', startDate:'2023-05-01', renewalDate: Utils.daysFromNow(5),   note:'Plan Pro',           status:'trial'  },
  { id:'d8', name:'Le Monde',      emoji:'📰', color:'#ffd60a', amount:9.99,  freq:'monthly', category:'Actualités',   startDate:'2024-01-01', renewalDate: Utils.daysFromNow(30),  note:'',                   status:'paused' },
  { id:'d9', name:'Duolingo Plus', emoji:'🎓', color:'#2dd4bf', amount:6.99,  freq:'monthly', category:'Éducation',    startDate:'2024-02-01', renewalDate: Utils.daysFromNow(12),  note:'',                   status:'active' },
];

// ── Global State ───────────────────────────────────────────────────
const State = {
  user:          null,   // current session user
  subscriptions: [],     // user's subscriptions
  currentPage:   'dashboard',
  activeFilter:  'all',
  analyticsPeriod: 'monthly',
  editingSubId:  null,
  selectedEmoji: '📦',
  selectedColor: '#7c6dfa',
};

// ── Router ─────────────────────────────────────────────────────────
const Router = {
  go(page) {
    State.currentPage = page;
    Utils.qsa('.page').forEach(p => p.classList.remove('active'));
    Utils.qsa('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.page === page));

    const p = Utils.el('page-' + page);
    if (p) p.classList.add('active');

    // Render the right page
    switch (page) {
      case 'dashboard':     Dashboard.render();     break;
      case 'subscriptions': Subscriptions.render(); break;
      case 'analytics':     Analytics.render();     break;
      case 'profile':       Profile.render();       break;
    }
  },
};

// ── Toast ──────────────────────────────────────────────────────────
const Toast = {
  _timer: null,
  show(msg, type = 'info') {
    const t = Utils.el('toast');
    t.textContent = msg;
    t.className = `toast ${type} visible`;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => t.classList.remove('visible'), 2800);
  },
};

// ── Modal system ───────────────────────────────────────────────────
const Modal = {
  open(id) {
    const m = Utils.el(id);
    if (m) { m.classList.add('open'); document.body.style.overflow = 'hidden'; }
  },
  close(id) {
    const m = Utils.el(id);
    if (m) { m.classList.remove('open'); document.body.style.overflow = ''; }
  },
  closeAll() {
    Utils.qsa('.modal-overlay').forEach(m => m.classList.remove('open'));
    document.body.style.overflow = '';
  },
};

// Close modals on backdrop click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    Modal.close(e.target.id);
  }
});

// ── Boot ───────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const session = Storage.getSession();
  if (session) {
    State.user          = session;
    State.subscriptions = Storage.getSubscriptions(session.id);
    Auth.showApp();
  } else {
    Auth.showAuth();
  }
});
