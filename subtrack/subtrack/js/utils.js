/**
 * SubTrack · Utilities
 */

const Utils = (() => {

  // ── Date helpers ───────────────────────────────
  function today() {
    return new Date().toISOString().split('T')[0];
  }

  function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  }

  function daysUntil(dateStr) {
    if (!dateStr) return Infinity;
    const diff = new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  function formatShortDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short'
    });
  }

  function renewLabel(days) {
    if (days < 0)  return `Expiré`;
    if (days === 0) return 'Aujourd\'hui';
    if (days === 1) return 'Demain';
    if (days <= 7)  return `Dans ${days}j`;
    return formatShortDate(daysFromNow(days));  // not quite right but OK for display
  }

  // ── Amount helpers ─────────────────────────────
  function toMonthly(amount, freq) {
    if (freq === 'yearly')  return amount / 12;
    if (freq === 'weekly')  return amount * 4.333;
    return amount; // monthly
  }

  function toYearly(amount, freq) {
    if (freq === 'yearly') return amount;
    if (freq === 'weekly') return amount * 52;
    return amount * 12;
  }

  function freqLabel(freq) {
    if (freq === 'yearly')  return '/an';
    if (freq === 'weekly')  return '/sem';
    return '/mois';
  }

  function freqLabelFull(freq) {
    if (freq === 'yearly')  return 'Annuel';
    if (freq === 'weekly')  return 'Hebdomadaire';
    return 'Mensuel';
  }

  function fmtCurrency(amount) {
    return amount.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' €';
  }

  // ── DOM helpers ────────────────────────────────
  function el(id)       { return document.getElementById(id); }
  function qs(sel)      { return document.querySelector(sel); }
  function qsa(sel)     { return [...document.querySelectorAll(sel)]; }
  function html(id, h)  { const e = el(id); if (e) e.innerHTML = h; }
  function show(id)     { const e = el(id); if (e) e.classList.remove('hidden'); }
  function hide(id)     { const e = el(id); if (e) e.classList.add('hidden'); }

  function setActive(selector, activeEl) {
    qsa(selector).forEach(e => e.classList.remove('active'));
    if (activeEl) activeEl.classList.add('active');
  }

  // ── ID generator ──────────────────────────────
  function uid() {
    return 'sub_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // ── Payment history generator ─────────────────
  function generateHistory(sub) {
    const history = [];
    if (!sub.startDate) return history;

    const start = new Date(sub.startDate);
    const now   = new Date();
    let d = new Date(start);
    let limit = 0;

    while (d <= now && limit < 24) {
      history.push({ date: new Date(d), amount: sub.amount });
      if      (sub.freq === 'monthly') d.setMonth(d.getMonth() + 1);
      else if (sub.freq === 'yearly')  d.setFullYear(d.getFullYear() + 1);
      else                             d.setDate(d.getDate() + 7);
      limit++;
    }
    return history.reverse();
  }

  return {
    today, daysFromNow, daysUntil, formatDate, formatShortDate, renewLabel,
    toMonthly, toYearly, freqLabel, freqLabelFull, fmtCurrency,
    el, qs, qsa, html, show, hide, setActive,
    uid, generateHistory,
  };
})();
