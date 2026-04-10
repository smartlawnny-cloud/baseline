/**
 * Baseline — Settings Page
 */
var SettingsPage = {
  render: function() {
    var el = document.getElementById('pageContent');
    var html = '';

    // Connections
    html += '<div class="card" style="margin-bottom:24px;">';
    html += '<div class="card-header"><div class="card-title"><i data-lucide="plug"></i> Connections</div></div>';

    // Supabase connections
    BL_CONFIG.businesses.forEach(function(biz) {
      if (biz.comingSoon) {
        html += SettingsPage._connectionRow(biz.icon, biz.name, 'Coming soon', 'draft', biz.color);
        return;
      }
      var connected = SupabaseManager.isConnected(biz.key);
      var lastSync = DB.getLastSync('pipeline', biz.key);
      html += SettingsPage._connectionRow(
        biz.icon, biz.name + ' (Supabase)',
        connected ? 'Connected' + (lastSync ? ' \u2014 synced ' + UI.timeAgo(lastSync) : '') : 'Not connected',
        connected ? 'active' : 'late',
        biz.color
      );
    });

    // Gmail
    html += SettingsPage._connectionRow('mail', 'Gmail', 'Phase 2 \u2014 requires Google OAuth setup', 'draft', '#ea4335');

    // Calendar
    html += SettingsPage._connectionRow('calendar-days', 'Google Calendar', 'Phase 2 \u2014 requires Google OAuth setup', 'draft', '#4285f4');

    // Dialpad
    html += SettingsPage._connectionRow('phone', 'Dialpad', 'Phase 3 \u2014 API key required', 'draft', '#6c2dc7');

    html += '</div>';

    // Appearance
    html += '<div class="card" style="margin-bottom:24px;">';
    html += '<div class="card-header"><div class="card-title"><i data-lucide="palette"></i> Appearance</div></div>';
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;">'
      + '<div><strong style="font-size:14px;">Dark Mode</strong><div style="font-size:12px;color:var(--text-light);">Easier on the eyes at night</div></div>'
      + '<button class="btn btn-sm ' + (isDark ? 'btn-primary' : 'btn-outline') + '" onclick="toggleTheme();SettingsPage.render();">'
      + (isDark ? 'On' : 'Off') + '</button>'
      + '</div>';
    html += '</div>';

    // App info
    html += '<div class="card" style="margin-bottom:24px;">';
    html += '<div class="card-header"><div class="card-title"><i data-lucide="info"></i> About</div></div>';
    html += '<div style="font-size:13px;color:var(--text-light);">'
      + '<div style="margin-bottom:6px;"><strong>App:</strong> ' + UI.esc(BL_CONFIG.appName) + '</div>'
      + '<div style="margin-bottom:6px;"><strong>Owner:</strong> ' + UI.esc(BL_CONFIG.ownerName) + '</div>'
      + '<div style="margin-bottom:6px;"><strong>Businesses:</strong> ' + BL_CONFIG.businesses.length + ' configured</div>'
      + '<div style="margin-bottom:6px;"><strong>Version:</strong> 1.0.0</div>'
      + '</div>';
    html += '</div>';

    // Danger zone
    html += '<div class="card">';
    html += '<div class="card-header"><div class="card-title"><i data-lucide="trash-2" style="color:var(--red);"></i> Data</div></div>';
    html += '<button class="btn btn-sm btn-outline" onclick="SettingsPage.clearCache()" style="border-color:var(--red);color:var(--red);">Clear Local Cache</button>';
    html += '<div style="font-size:11px;color:var(--text-muted);margin-top:6px;">Clears cached pipeline data. Will re-fetch from Supabase on next load.</div>';
    html += '</div>';

    el.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  _connectionRow: function(icon, name, status, statusType, color) {
    var statusClass = statusType === 'active' ? 'status-active' : (statusType === 'late' ? 'status-late' : 'status-draft');
    return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">'
      + '<div style="width:36px;height:36px;border-radius:8px;background:' + color + '15;display:flex;align-items:center;justify-content:center;">'
      + '<i data-lucide="' + icon + '" style="width:18px;height:18px;color:' + color + ';"></i></div>'
      + '<div style="flex:1;"><div style="font-size:14px;font-weight:500;">' + UI.esc(name) + '</div>'
      + '<div style="font-size:12px;color:var(--text-light);">' + UI.esc(status) + '</div></div>'
      + '<span class="status-badge ' + statusClass + '">' + (statusType === 'active' ? 'Connected' : statusType === 'late' ? 'Offline' : 'Pending') + '</span>'
      + '</div>';
  },

  clearCache: function() {
    if (!confirm('Clear all cached data? Will re-fetch on next refresh.')) return;
    BL_CONFIG.businesses.forEach(function(biz) {
      localStorage.removeItem('bl-pipeline-' + biz.key);
      localStorage.removeItem('bl-sync-pipeline-' + biz.key);
    });
    UI.toast('Cache cleared');
    SettingsPage.render();
  }
};
