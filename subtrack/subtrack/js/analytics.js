/**
 * SubTrack · Analytics Page
 */

const Analytics = {

  render() {
    this._renderSummary();
    this._renderBarChart();
    this._renderTopSubs();
    this._renderMiniStats();
  },

  setPeriod(p) {
    State.analyticsPeriod = p;
    Utils.qsa('.period-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.period === p)
    );
    this.render();
  },

  // ── Summary numbers ────────────────────────────────────────────
  _renderSummary() {
    const isMonthly = State.analyticsPeriod === 'monthly';
    const active    = State.subscriptions.filter(s => s.status !== 'paused');
    const total     = active.reduce((a, s) =>
      a + (isMonthly ? Utils.toMonthly(s.amount, s.freq) : Utils.toYearly(s.amount, s.freq)), 0
    );
    const avg = active.length ? total / active.length : 0;

    Utils.html('analyticsKPIs', `
      <div class="stat-card span-full">
        <div class="stat-label">Total ${isMonthly ? 'mensuel' : 'annuel'}</div>
        <div class="stat-value">${Utils.fmtCurrency(total)}</div>
        <div class="stat-sub">${active.length} abonnements actifs · moy. ${Utils.fmtCurrency(avg)} / abonnement</div>
      </div>
    `);
  },

  // ── Bar chart by category ──────────────────────────────────────
  _renderBarChart() {
    const isMonthly = State.analyticsPeriod === 'monthly';
    const cats = {};

    State.subscriptions.filter(s => s.status !== 'paused').forEach(s => {
      const val = isMonthly ? Utils.toMonthly(s.amount, s.freq) : Utils.toYearly(s.amount, s.freq);
      cats[s.category] = (cats[s.category] || 0) + val;
    });

    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    const max    = sorted[0]?.[1] || 1;

    Utils.el('analyticsChartTitle').textContent =
      `Dépenses par catégorie · ${isMonthly ? '€/mois' : '€/an'}`;

    if (!sorted.length) {
      Utils.html('analyticsChart', `<div class="empty-state" style="padding:30px 0">
        <div class="empty-icon">📊</div>
        <div class="empty-desc">Ajoutez des abonnements pour voir les graphiques</div>
      </div>`);
      return;
    }

    Utils.html('analyticsChart', `
      <div class="bar-list">
        ${sorted.map(([cat, val]) => {
          const pct = (val / max * 100).toFixed(1);
          const hex = CAT_HEX[cat] || '#7c6dfa';
          return `
            <div class="bar-row">
              <div class="bar-label">${cat}</div>
              <div class="bar-track">
                <div class="bar-fill" style="width:${pct}%;background:linear-gradient(90deg,${hex}88,${hex})">
                  <span class="bar-val">${Utils.fmtCurrency(val).replace(' €','€')}</span>
                </div>
              </div>
            </div>`;
        }).join('')}
      </div>
    `);
  },

  // ── Top subscriptions ──────────────────────────────────────────
  _renderTopSubs() {
    const isMonthly = State.analyticsPeriod === 'monthly';
    const top = [...State.subscriptions]
      .filter(s => s.status !== 'paused')
      .sort((a, b) =>
        Utils.toMonthly(b.amount, b.freq) - Utils.toMonthly(a.amount, a.freq)
      )
      .slice(0, 6);

    if (!top.length) {
      Utils.html('analyticsTopSubs', `<div style="color:var(--text-tertiary);font-size:14px;padding:20px 0;text-align:center">Aucun abonnement actif</div>`);
      return;
    }

    Utils.html('analyticsTopSubs', `
      <div class="rank-list">
        ${top.map((s, i) => {
          const val = isMonthly ? Utils.toMonthly(s.amount, s.freq) : Utils.toYearly(s.amount, s.freq);
          return `
            <div class="rank-row" onclick="SubModal.openDetail('${s.id}')" style="cursor:pointer">
              <div class="rank-num">${i + 1}</div>
              <div class="rank-logo" style="background:${s.color}1a">${s.emoji}</div>
              <div class="rank-info">
                <div class="rank-name">${s.name}</div>
                <div class="rank-cat">${s.category} · ${Utils.freqLabelFull(s.freq)}</div>
              </div>
              <div class="rank-price">${Utils.fmtCurrency(val)}</div>
            </div>`;
        }).join('')}
      </div>
    `);
  },

  // ── Mini stats ─────────────────────────────────────────────────
  _renderMiniStats() {
    const subs   = State.subscriptions;
    const active = subs.filter(s => s.status === 'active');
    const trial  = subs.filter(s => s.status === 'trial');
    const paused = subs.filter(s => s.status === 'paused');

    const catCounts = {};
    subs.forEach(s => { catCounts[s.category] = (catCounts[s.category] || 0) + 1; });
    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];

    Utils.html('analyticsMiniStats', `
      <div class="stat-card">
        <span class="stat-emoji">✅</span>
        <div class="stat-label">Actifs</div>
        <div class="stat-value">${active.length}</div>
        <div class="stat-sub">abonnements</div>
      </div>
      <div class="stat-card">
        <span class="stat-emoji">🔷</span>
        <div class="stat-label">Essais</div>
        <div class="stat-value">${trial.length}</div>
        <div class="stat-sub">en cours</div>
      </div>
      <div class="stat-card">
        <span class="stat-emoji">⏸️</span>
        <div class="stat-label">Suspendus</div>
        <div class="stat-value">${paused.length}</div>
        <div class="stat-sub">abonnements</div>
      </div>
      <div class="stat-card">
        <span class="stat-emoji">🏆</span>
        <div class="stat-label">Top catégorie</div>
        <div class="stat-value" style="font-size:14px">${topCat ? topCat[0] : '—'}</div>
        <div class="stat-sub">${topCat ? topCat[1] + ' abonnement' + (topCat[1] > 1 ? 's' : '') : ''}</div>
      </div>
    `);
  },
};
