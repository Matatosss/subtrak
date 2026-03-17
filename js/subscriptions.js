/**
 * SubTrack · Subscriptions Page & CRUD
 */

const Subscriptions = {

  render() {
    this._renderFilters();
    this._renderList();
  },

  // ── Filters ────────────────────────────────────────────────────
  _renderFilters() {
    const cats = ['all', ...new Set(State.subscriptions.map(s => s.category))];
    Utils.html('subFilters', cats.map(c => `
      <div class="chip ${State.activeFilter === c ? 'active' : ''}"
           onclick="Subscriptions.setFilter('${c}')">
        ${c === 'all' ? 'Tous' : c}
      </div>`).join('')
    );
  },

  setFilter(cat) {
    State.activeFilter = cat;
    this._renderFilters();
    this._renderList();
  },

  // ── List ────────────────────────────────────────────────────────
  _renderList() {
    const list = State.activeFilter === 'all'
      ? State.subscriptions
      : State.subscriptions.filter(s => s.category === State.activeFilter);

    if (!list.length) {
      Utils.html('subList', `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <div class="empty-title">Aucun abonnement${State.activeFilter !== 'all' ? ' dans cette catégorie' : ''}</div>
          <div class="empty-desc">Appuyez sur + pour ajouter votre premier abonnement</div>
        </div>`);
      return;
    }

    Utils.html('subList', `
      <div class="sub-list stagger">
        ${list.map(s => this._subItem(s)).join('')}
      </div>`);
  },

  _subItem(s) {
    const statusCls   = s.status === 'active' ? 'active' : s.status === 'trial' ? 'trial' : 'paused';
    const statusLabel = s.status === 'active' ? 'Actif' : s.status === 'trial' ? 'Essai' : 'Suspendu';
    const catColor    = CAT_HEX[s.category] || '#94a3b8';

    return `
      <div class="sub-item ${s.status === 'paused' ? 'paused' : ''}" onclick="SubModal.openDetail('${s.id}')">
        <div class="accent-bar" style="background:${s.color}"></div>
        <div class="sub-logo" style="background:${s.color}1a">${s.emoji}</div>
        <div class="sub-info">
          <div class="sub-name">${s.name}</div>
          <div class="sub-meta">
            <div class="status-dot ${statusCls}"></div>
            <span style="font-size:12px;color:var(--text-secondary)">${statusLabel}</span>
            <span style="color:var(--text-tertiary);font-size:12px">·</span>
            <span class="cat-tag" style="background:${catColor}1a;color:${catColor}">${s.category}</span>
          </div>
        </div>
        <div class="sub-right">
          <div class="sub-price">${Utils.fmtCurrency(s.amount)}</div>
          <div class="sub-period">${Utils.freqLabel(s.freq)}</div>
        </div>
      </div>`;
  },
};


// ══════════════════════════════════════════════════════════════════
// SubModal — Add / Edit / Detail modals
// ══════════════════════════════════════════════════════════════════
const SubModal = {

  // ── Detail modal ───────────────────────────────────────────────
  openDetail(id) {
    const s = State.subscriptions.find(x => x.id === id);
    if (!s) return;

    const days    = Utils.daysUntil(s.renewalDate);
    const monthly = Utils.toMonthly(s.amount, s.freq);
    const yearly  = Utils.toYearly(s.amount, s.freq);
    const dLabel  = days < 0 ? `Expiré` : Utils.renewLabel(days);
    const dColor  = days <= 2 ? 'var(--danger)' : days <= 7 ? 'var(--warning)' : 'var(--text-primary)';
    const statusLabel = s.status === 'active' ? '✅ Actif' : s.status === 'trial' ? '🔷 Essai gratuit' : '⏸️ Suspendu';

    const history = Utils.generateHistory(s);
    const historyHtml = history.length
      ? history.map(h => `
        <div class="history-row">
          <div class="history-date">${h.date.toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}</div>
          <div class="history-price">${Utils.fmtCurrency(h.amount)}</div>
        </div>`).join('')
      : '<div style="color:var(--text-tertiary);font-size:13px;padding:12px 0">Aucun historique disponible</div>';

    Utils.html('detailContent', `
      <div class="detail-header">
        <div class="detail-logo" style="background:${s.color}1a">${s.emoji}</div>
        <div>
          <div class="detail-name">${s.name}</div>
          <div class="detail-sub">${s.category} · ${statusLabel}</div>
          ${s.note ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">📝 ${s.note}</div>` : ''}
        </div>
      </div>

      <div class="detail-stats">
        <div class="detail-stat">
          <div class="detail-stat-label">Montant</div>
          <div class="detail-stat-value">${Utils.fmtCurrency(s.amount)}<span style="font-size:11px;color:var(--text-tertiary)"> ${Utils.freqLabel(s.freq)}</span></div>
        </div>
        <div class="detail-stat">
          <div class="detail-stat-label">Prochain renouvellement</div>
          <div class="detail-stat-value" style="font-size:14px;color:${dColor}">${dLabel}</div>
        </div>
        <div class="detail-stat">
          <div class="detail-stat-label">Mensuel estimé</div>
          <div class="detail-stat-value">${Utils.fmtCurrency(monthly)}</div>
        </div>
        <div class="detail-stat">
          <div class="detail-stat-label">Annuel estimé</div>
          <div class="detail-stat-value">${Utils.fmtCurrency(yearly)}</div>
        </div>
      </div>

      <div class="section-title" style="margin-bottom:var(--sp-3)">Historique de paiements</div>
      ${historyHtml}

      <div class="modal-actions" style="margin-top:var(--sp-5)">
        <button class="btn btn-secondary" onclick="Modal.close('modalDetail')">Fermer</button>
        <button class="btn btn-primary" onclick="SubModal.openEdit('${s.id}')">✏️ Modifier</button>
      </div>
    `);

    Modal.open('modalDetail');
  },

  // ── Add modal ──────────────────────────────────────────────────
  openAdd() {
    State.editingSubId = null;
    State.selectedEmoji = '📦';
    State.selectedColor = '#7c6dfa';

    Utils.el('modalFormTitle').textContent = '＋ Nouvel abonnement';
    Utils.el('formSubName').value     = '';
    Utils.el('formSubAmount').value   = '';
    Utils.el('formSubFreq').value     = 'monthly';
    Utils.el('formSubCategory').value = 'Streaming';
    Utils.el('formSubNote').value     = '';
    Utils.el('formSubStatus').value   = 'active';
    Utils.el('formSubStart').value    = Utils.today();
    Utils.el('formSubRenewal').value  = Utils.daysFromNow(30);
    Utils.el('btnDeleteSub').classList.add('hidden');

    this._buildPickers();
    Modal.close('modalDetail');
    Modal.open('modalForm');
  },

  // ── Edit modal ─────────────────────────────────────────────────
  openEdit(id) {
    const s = State.subscriptions.find(x => x.id === id);
    if (!s) return;

    State.editingSubId  = id;
    State.selectedEmoji = s.emoji;
    State.selectedColor = s.color;

    Utils.el('modalFormTitle').textContent = '✏️ Modifier l\'abonnement';
    Utils.el('formSubName').value     = s.name;
    Utils.el('formSubAmount').value   = s.amount;
    Utils.el('formSubFreq').value     = s.freq;
    Utils.el('formSubCategory').value = s.category;
    Utils.el('formSubNote').value     = s.note || '';
    Utils.el('formSubStatus').value   = s.status;
    Utils.el('formSubStart').value    = s.startDate   || Utils.today();
    Utils.el('formSubRenewal').value  = s.renewalDate || Utils.daysFromNow(30);
    Utils.el('btnDeleteSub').classList.remove('hidden');

    this._buildPickers();
    Modal.close('modalDetail');
    Modal.open('modalForm');
  },

  // ── Save (create / update) ─────────────────────────────────────
  save() {
    const name   = Utils.el('formSubName').value.trim();
    const amount = parseFloat(Utils.el('formSubAmount').value);

    if (!name) {
      Toast.show('❌ Le nom du service est requis', 'error'); return;
    }
    if (isNaN(amount) || amount < 0) {
      Toast.show('❌ Montant invalide', 'error'); return;
    }

    const sub = {
      id:          State.editingSubId || Utils.uid(),
      name,
      emoji:       State.selectedEmoji,
      color:       State.selectedColor,
      amount,
      freq:        Utils.el('formSubFreq').value,
      category:    Utils.el('formSubCategory').value,
      startDate:   Utils.el('formSubStart').value,
      renewalDate: Utils.el('formSubRenewal').value,
      note:        Utils.el('formSubNote').value.trim(),
      status:      Utils.el('formSubStatus').value,
    };

    if (State.editingSubId) {
      const i = State.subscriptions.findIndex(x => x.id === State.editingSubId);
      State.subscriptions[i] = sub;
      Toast.show('✅ Abonnement mis à jour', 'success');
    } else {
      State.subscriptions.push(sub);
      Toast.show('✅ Abonnement ajouté', 'success');
    }

    Storage.saveSubscriptions(State.user.id, State.subscriptions);
    Modal.close('modalForm');
    Auth._updateNotifBadge && Auth._updateNotifBadge();
    Router.go(State.currentPage); // re-render current page
    Dashboard.render();
  },

  // ── Delete ─────────────────────────────────────────────────────
  delete() {
    if (!State.editingSubId) return;
    State.subscriptions = State.subscriptions.filter(x => x.id !== State.editingSubId);
    Storage.saveSubscriptions(State.user.id, State.subscriptions);
    Modal.close('modalForm');
    Toast.show('🗑️ Abonnement supprimé', 'success');
    Router.go(State.currentPage);
    Dashboard.render();
  },

  // ── Pickers ────────────────────────────────────────────────────
  _buildPickers() {
    // Emoji
    Utils.html('emojiPicker', EMOJIS.map(e => `
      <div class="emoji-option ${e === State.selectedEmoji ? 'selected' : ''}"
           onclick="SubModal.selectEmoji('${e}')">${e}</div>
    `).join(''));

    // Color
    Utils.html('colorPicker', COLORS.map(c => `
      <div class="color-option ${c === State.selectedColor ? 'selected' : ''}"
           style="background:${c}"
           onclick="SubModal.selectColor('${c}')"></div>
    `).join(''));
  },

  selectEmoji(e) {
    State.selectedEmoji = e;
    Utils.qsa('.emoji-option').forEach(el =>
      el.classList.toggle('selected', el.textContent === e)
    );
  },

  selectColor(c) {
    State.selectedColor = c;
    Utils.qsa('.color-option').forEach(el =>
      el.classList.toggle('selected', el.style.background === c)
    );
  },

  // ── Notifications panel ────────────────────────────────────────
  openNotifs() {
    const alerts = State.subscriptions
      .filter(s => s.status !== 'paused' && Utils.daysUntil(s.renewalDate) >= 0 && Utils.daysUntil(s.renewalDate) <= 7)
      .sort((a, b) => Utils.daysUntil(a.renewalDate) - Utils.daysUntil(b.renewalDate));

    if (!alerts.length) {
      Utils.html('notifList', `<div style="text-align:center;padding:30px 0;color:var(--text-tertiary);font-size:14px">✅ Aucune notification</div>`);
    } else {
      Utils.html('notifList', `<div class="alert-list stagger">` +
        alerts.map(s => {
          const d = Utils.daysUntil(s.renewalDate);
          const urgency = d <= 2 ? 'urgent' : d <= 5 ? 'warning' : 'notice';
          const pillCls = d <= 2 ? 'pill-danger' : d <= 5 ? 'pill-warning' : 'pill-accent';
          return `
            <div class="alert-item ${urgency}" onclick="Modal.close('modalNotifs');SubModal.openDetail('${s.id}')">
              <div class="alert-icon" style="background:${s.color}1a">${s.emoji}</div>
              <div class="alert-info">
                <div class="alert-name">${s.name}</div>
                <div class="alert-date">${Utils.formatDate(s.renewalDate)} · ${Utils.fmtCurrency(s.amount)}</div>
              </div>
              <div class="pill ${pillCls}">${Utils.renewLabel(d)}</div>
            </div>`;
        }).join('') + `</div>`
      );
    }

    Modal.open('modalNotifs');
  },
};
