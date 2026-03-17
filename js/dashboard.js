/**
 * SubTrack · Dashboard Page
 */

const Dashboard = {

  render() {
    this._renderStats();
    this._renderAlerts();
    this._renderDonut();
  },

  // ── Stats cards ────────────────────────────────────────────────
  _renderStats() {
    const active = State.subscriptions.filter(s => s.status !== 'paused');
    const monthly = active.reduce((a, s) => a + Utils.toMonthly(s.amount, s.freq), 0);
    const yearly  = monthly * 12;
    const upcoming30 = State.subscriptions.filter(s =>
      s.status !== 'paused' &&
      Utils.daysUntil(s.renewalDate) >= 0 &&
      Utils.daysUntil(s.renewalDate) <= 30
    ).length;

    Utils.html('dashStats', `
      <div class="stat-card span-full stagger">
        <div class="stat-label">Dépenses mensuelles totales</div>
        <div class="stat-value">${Utils.fmtCurrency(monthly)}</div>
        <div class="stat-sub">${Utils.fmtCurrency(yearly)} / an estimés · ${active.length} abonnement${active.length > 1 ? 's' : ''} actif${active.length > 1 ? 's' : ''}</div>
      </div>
      <div class="stat-card">
        <span class="stat-emoji">✅</span>
        <div class="stat-label">Actifs</div>
        <div class="stat-value">${State.subscriptions.filter(s => s.status === 'active').length}</div>
        <div class="stat-sub">abonnements</div>
      </div>
      <div class="stat-card">
        <span class="stat-emoji">📅</span>
        <div class="stat-label">Ce mois</div>
        <div class="stat-value">${upcoming30}</div>
        <div class="stat-sub">renouvellement${upcoming30 > 1 ? 's' : ''}</div>
      </div>
    `);
  },

  // ── Alerts ─────────────────────────────────────────────────────
  _renderAlerts() {
    const alerts = State.subscriptions
      .filter(s => s.status !== 'paused')
      .map(s => ({ ...s, days: Utils.daysUntil(s.renewalDate) }))
      .filter(s => s.days >= 0 && s.days <= 14)
      .sort((a, b) => a.days - b.days);

    if (!alerts.length) {
      Utils.html('dashAlerts', `
        <div style="background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--r-md);padding:20px;text-align:center;color:var(--text-tertiary);font-size:14px">
          ✅ Aucun renouvellement dans les 14 prochains jours
        </div>
      `);
      return;
    }

    Utils.html('dashAlerts', `
      <div class="alert-list stagger">
        ${alerts.map(s => this._alertItem(s)).join('')}
      </div>
    `);
  },

  _alertItem(s) {
    const urgency = s.days <= 2 ? 'urgent' : s.days <= 5 ? 'warning' : 'notice';
    const pillCls = s.days <= 2 ? 'pill-danger' : s.days <= 5 ? 'pill-warning' : 'pill-accent';
    const label   = Utils.renewLabel(s.days);
    return `
      <div class="alert-item ${urgency}" onclick="SubModal.openDetail('${s.id}')">
        <div class="alert-icon" style="background:${s.color}1a">${s.emoji}</div>
        <div class="alert-info">
          <div class="alert-name">${s.name}</div>
          <div class="alert-date">${Utils.formatDate(s.renewalDate)}</div>
        </div>
        <div class="alert-right">
          <div class="alert-amount">${Utils.fmtCurrency(s.amount)}</div>
          <div class="pill ${pillCls}" style="margin-top:4px">${label}</div>
        </div>
      </div>`;
  },

  // ── Donut chart ────────────────────────────────────────────────
  _renderDonut() {
    const active = State.subscriptions.filter(s => s.status !== 'paused');
    const cats   = {};

    active.forEach(s => {
      const m = Utils.toMonthly(s.amount, s.freq);
      cats[s.category] = (cats[s.category] || 0) + m;
    });

    const total  = Object.values(cats).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 6);

    if (!total) {
      Utils.html('dashDonut', `<div class="empty-state" style="padding:30px 0">
        <div class="empty-icon">📊</div>
        <div class="empty-title">Aucune donnée</div>
        <div class="empty-desc">Ajoutez des abonnements pour voir la répartition</div>
      </div>`);
      return;
    }

    // Build SVG donut
    const cx = 60, cy = 60, r = 46, strokeW = 15;
    const circ = 2 * Math.PI * r;
    let offset = 0;
    const arcs = sorted.map(([cat, val]) => {
      const pct  = val / total;
      const dash = pct * circ;
      const hex  = CAT_HEX[cat] || '#7c6dfa';
      const arc  = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${hex}"
        stroke-width="${strokeW}"
        stroke-dasharray="${dash.toFixed(2)} ${(circ - dash).toFixed(2)}"
        stroke-dashoffset="${(-offset).toFixed(2)}"
        transform="rotate(-90 ${cx} ${cy})"
        style="transition:stroke-dasharray .5s ease"/>`;
      offset += dash;
      return arc;
    }).join('');

    const legend = sorted.map(([cat, val]) => `
      <div class="legend-row">
        <div class="legend-left">
          <div class="legend-dot" style="background:${CAT_HEX[cat] || '#7c6dfa'}"></div>
          <span class="legend-name">${cat}</span>
        </div>
        <span class="legend-pct">${((val / total) * 100).toFixed(0)}%</span>
      </div>`).join('');

    Utils.html('dashDonut', `
      <div class="donut-wrap">
        <div class="donut-container">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--bg-overlay)" stroke-width="${strokeW}"/>
            ${arcs}
          </svg>
          <div class="donut-label">
            <div class="donut-label-val">${Utils.fmtCurrency(total).replace(' €','€')}</div>
            <div class="donut-label-sub">/mois</div>
          </div>
        </div>
        <div class="donut-legend">${legend}</div>
      </div>
    `);
  },
};
