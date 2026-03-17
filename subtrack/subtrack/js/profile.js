/**
 * SubTrack · Profile Page
 */

const Profile = {

  render() {
    const u = State.user;
    const initials = ((u.firstName[0] || '') + (u.lastName?.[0] || '')).toUpperCase();
    const settings = u.settings || {};

    // Hero
    Utils.html('profileHero', `
      <div class="profile-avatar-lg">${initials}</div>
      <div class="profile-name">${u.firstName} ${u.lastName || ''}</div>
      <div class="profile-email">${u.email}</div>
    `);

    // Account stats
    const totalSubs   = State.subscriptions.length;
    const monthly     = State.subscriptions
      .filter(s => s.status !== 'paused')
      .reduce((a, s) => a + Utils.toMonthly(s.amount, s.freq), 0);

    Utils.html('profileStats', `
      <div class="stat-card">
        <span class="stat-emoji">📋</span>
        <div class="stat-label">Abonnements</div>
        <div class="stat-value">${totalSubs}</div>
        <div class="stat-sub">au total</div>
      </div>
      <div class="stat-card">
        <span class="stat-emoji">💸</span>
        <div class="stat-label">Budget mensuel</div>
        <div class="stat-value" style="font-size:18px">${Utils.fmtCurrency(monthly)}</div>
        <div class="stat-sub">/mois</div>
      </div>
    `);

    // Notifications settings
    Utils.html('profileNotifSettings', `
      <div class="settings-row" onclick="Profile.toggleSetting('notifyRenewal', this)">
        <span class="settings-icon">🔔</span>
        <span class="settings-label">Alertes renouvellement</span>
        <div class="toggle ${settings.notifyRenewal !== false ? 'on' : ''}" data-key="notifyRenewal"></div>
      </div>
      <div class="settings-row" onclick="Profile.toggleSetting('notify3Days', this)">
        <span class="settings-icon">📅</span>
        <span class="settings-label">Rappel 3 jours avant</span>
        <div class="toggle ${settings.notify3Days !== false ? 'on' : ''}" data-key="notify3Days"></div>
      </div>
      <div class="settings-row" onclick="Profile.toggleSetting('notify7Days', this)">
        <span class="settings-icon">📅</span>
        <span class="settings-label">Rappel 7 jours avant</span>
        <div class="toggle ${settings.notify7Days ? 'on' : ''}" data-key="notify7Days"></div>
      </div>
      <div class="settings-row" onclick="Profile.toggleSetting('monthlySummary', this)">
        <span class="settings-icon">💰</span>
        <span class="settings-label">Résumé mensuel</span>
        <div class="toggle ${settings.monthlySummary !== false ? 'on' : ''}" data-key="monthlySummary"></div>
      </div>
    `);
  },

  // ── Toggle a setting ───────────────────────────────────────────
  toggleSetting(key, rowEl) {
    const toggle = rowEl.querySelector('.toggle');
    const isOn   = toggle.classList.toggle('on');

    if (!State.user.settings) State.user.settings = {};
    State.user.settings[key] = isOn;

    Storage.updateUser(State.user);
    Storage.setSession(State.user);
    Toast.show(isOn ? '✅ Activé' : '⏸️ Désactivé', 'info');
  },

  // ── Export CSV ─────────────────────────────────────────────────
  exportCSV() {
    const rows = [
      ['Nom','Emoji','Catégorie','Montant','Fréquence','Statut','Début','Renouvellement','Note'],
      ...State.subscriptions.map(s => [
        s.name, s.emoji, s.category, s.amount, Utils.freqLabelFull(s.freq),
        s.status, s.startDate || '', s.renewalDate || '', s.note || '',
      ])
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `subtrack_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    Toast.show('📤 Export CSV téléchargé', 'success');
  },

  // ── Change currency (UI only, no backend) ─────────────────────
  changeCurrency() {
    Toast.show('💱 Paramètre de devise — bientôt disponible', 'info');
  },
};
