/**
 * Baseline — Calls Page (Phase 3)
 * Dialpad call/SMS log
 */
var CallsPage = {
  render: function() {
    var el = document.getElementById('pageContent');

    var html = '<div class="card">';
    html += '<div class="card-header"><div class="card-title"><i data-lucide="phone"></i> Calls & SMS</div></div>';
    html += '<div style="padding:32px;text-align:center;color:var(--text-muted);font-size:13px;">'
      + '<i data-lucide="phone-off" style="width:32px;height:32px;margin-bottom:8px;opacity:.3;"></i>'
      + '<div style="margin-bottom:8px;">Connect Dialpad in Settings to see call and SMS logs</div>'
      + '<div style="font-size:11px;">Phase 3 feature \u2014 API integration coming soon</div>'
      + '</div>';
    html += '</div>';

    el.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }
};
