/**
 * Baseline — UI Components
 */
var UI = (function() {
  function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function money(n) { return '$' + (n || 0).toLocaleString(undefined, { minimumFractionDigits:2, maximumFractionDigits:2 }); }
  function moneyInt(n) { return '$' + Math.round(n || 0).toLocaleString(); }

  function dateShort(d) {
    if (!d) return '\u2014';
    var dt = d.length > 10 ? new Date(d) : new Date(d + 'T12:00:00');
    if (isNaN(dt.getTime())) return '\u2014';
    var m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return m[dt.getMonth()] + ' ' + dt.getDate();
  }

  function dateRelative(d) {
    if (!d) return '\u2014';
    var now = new Date(), dt = new Date(d);
    if (isNaN(dt.getTime())) return '\u2014';
    var diff = Math.floor((now - dt) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return diff + 'd ago';
    return dateShort(d);
  }

  function timeAgo(d) {
    if (!d) return '';
    var diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
    return Math.floor(diff/86400) + 'd ago';
  }

  function phone(p) {
    if (!p) return '\u2014';
    var d = p.replace(/\D/g, '');
    if (d.length === 11 && d[0] === '1') d = d.substr(1);
    if (d.length === 10) return '(' + d.substr(0,3) + ') ' + d.substr(3,3) + '-' + d.substr(6);
    return p;
  }

  function statusBadge(status) {
    var map = {
      active:'status-active', lead:'status-lead', new:'status-new',
      scheduled:'status-scheduled', completed:'status-active', cancelled:'status-draft',
      draft:'status-draft', sent:'status-sent', awaiting:'status-sent',
      approved:'status-active', declined:'status-late', paid:'status-paid',
      overdue:'status-overdue', partial:'status-sent', in_progress:'status-sent',
      viewed:'status-sent'
    };
    return '<span class="status-badge ' + (map[status] || 'status-draft') + '">' + esc(status || '\u2014') + '</span>';
  }

  function toast(message, type) {
    type = type || 'success';
    var t = document.createElement('div');
    t.className = 'toast' + (type === 'error' ? ' toast-error' : '');
    t.textContent = message;
    document.body.appendChild(t);
    requestAnimationFrame(function() { t.classList.add('show'); });
    setTimeout(function() { t.classList.remove('show'); setTimeout(function() { t.remove(); }, 300); }, 3000);
  }

  function statCard(label, value, sub) {
    return '<div class="stat-card">'
      + '<div class="stat-label">' + esc(label) + '</div>'
      + '<div class="stat-value">' + value + '</div>'
      + (sub ? '<div class="stat-sub">' + sub + '</div>' : '')
      + '</div>';
  }

  function emptyState(icon, title, desc) {
    return '<div class="empty-state">'
      + '<div style="font-size:40px;opacity:.3;margin-bottom:8px;">' + icon + '</div>'
      + '<h3>' + esc(title) + '</h3>'
      + '<p>' + esc(desc) + '</p>'
      + '</div>';
  }

  function bizTag(bizKey) {
    var biz = BL_CONFIG.businesses.find(function(b) { return b.key === bizKey; });
    if (!biz) return '';
    return '<span class="bi-biz" style="background:' + biz.color + '15;color:' + biz.color + ';">' + esc(biz.shortName) + '</span>';
  }

  function showLoading(text) {
    var el = document.getElementById('pageContent');
    if (el) el.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;gap:16px;">'
      + '<div class="spinner"></div>'
      + '<span style="font-size:13px;color:var(--text-light);">' + esc(text || 'Loading...') + '</span></div>';
  }

  return {
    esc: esc, money: money, moneyInt: moneyInt, dateShort: dateShort,
    dateRelative: dateRelative, timeAgo: timeAgo, phone: phone,
    statusBadge: statusBadge, toast: toast, statCard: statCard,
    emptyState: emptyState, bizTag: bizTag, showLoading: showLoading
  };
})();
