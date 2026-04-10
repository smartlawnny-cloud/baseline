/**
 * Baseline — Settings Page
 */
var SettingsPage = {
  render: function() {
    var el = document.getElementById('pageContent');
    var html = '';

    // Google OAuth setup notice
    if (!BL_CONFIG.googleClientId) {
      html += '<div class="card" style="margin-bottom:24px;padding:14px 20px;border-left:3px solid var(--primary);">'
        + '<div style="font-size:14px;font-weight:600;margin-bottom:8px;"><i data-lucide="info" style="width:16px;height:16px;display:inline;vertical-align:-3px;"></i> Google OAuth Setup Required</div>'
        + '<div style="font-size:13px;color:var(--text-light);margin-bottom:12px;">'
        + 'To connect Gmail and Calendar, create a Google Cloud project:'
        + '</div>'
        + '<ol style="font-size:12px;color:var(--text-light);margin-left:20px;line-height:1.8;">'
        + '<li>Go to <strong>console.cloud.google.com</strong></li>'
        + '<li>Create a new project (e.g., "Baseline")</li>'
        + '<li>Enable <strong>Gmail API</strong> and <strong>Google Calendar API</strong></li>'
        + '<li>Go to Credentials \u2192 Create OAuth client ID \u2192 Web application</li>'
        + '<li>Add authorized JS origin: <code>' + window.location.origin + '</code></li>'
        + '<li>Copy the Client ID and paste below</li>'
        + '</ol>'
        + '<div style="margin-top:12px;display:flex;gap:8px;align-items:center;">'
        + '<input type="text" id="googleClientIdInput" placeholder="Paste Google Client ID here" '
        + 'style="flex:1;padding:8px 12px;border:1px solid var(--border);border-radius:6px;font-size:13px;" '
        + 'value="' + UI.esc(localStorage.getItem('bl-google-client-id') || '') + '">'
        + '<button class="btn btn-primary btn-sm" onclick="SettingsPage.saveClientId()">Save</button>'
        + '</div>'
        + '</div>';
    }

    // Connections
    html += '<div class="card" style="margin-bottom:24px;">';
    html += '<div class="card-header"><div class="card-title"><i data-lucide="plug"></i> Connections</div></div>';

    // Supabase connections
    BL_CONFIG.businesses.forEach(function(biz) {
      if (biz.comingSoon) {
        html += SettingsPage._connectionRow(biz.icon === 'skateboard' ? 'zap' : biz.icon, biz.name, 'Coming soon', 'draft', biz.color);
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

    // Gmail per business
    BL_CONFIG.businesses.forEach(function(biz) {
      if (biz.comingSoon) return;
      var gConnected = GoogleAuth.isConnected(biz.key);
      var token = GoogleAuth.getToken(biz.key);
      var email = token ? token.email : null;

      var statusText = gConnected ? 'Connected' + (email ? ' as ' + email : '') : 'Not connected';
      var actionHtml = '';
      if (BL_CONFIG.googleClientId) {
        if (gConnected) {
          actionHtml = '<button class="btn btn-sm btn-outline" style="border-color:var(--red);color:var(--red);" '
            + 'onclick="SettingsPage.disconnectGoogle(\'' + biz.key + '\')">Disconnect</button>';
        } else {
          actionHtml = '<button class="btn btn-sm btn-primary" '
            + 'onclick="SettingsPage.connectGoogle(\'' + biz.key + '\')">Connect</button>';
        }
      }

      html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">'
        + '<div style="width:36px;height:36px;border-radius:8px;background:#ea433515;display:flex;align-items:center;justify-content:center;">'
        + '<i data-lucide="mail" style="width:18px;height:18px;color:#ea4335;"></i></div>'
        + '<div style="flex:1;"><div style="font-size:14px;font-weight:500;">Gmail \u2014 ' + UI.esc(biz.shortName) + '</div>'
        + '<div style="font-size:12px;color:var(--text-light);">' + UI.esc(statusText) + '</div></div>'
        + actionHtml
        + '<span class="status-badge ' + (gConnected ? 'status-active' : 'status-draft') + '">'
        + (gConnected ? 'Connected' : 'Pending') + '</span>'
        + '</div>';
    });

    // Calendar (shared with Gmail auth — same token covers both scopes)
    BL_CONFIG.businesses.forEach(function(biz) {
      if (biz.comingSoon) return;
      var gConnected = GoogleAuth.isConnected(biz.key);
      html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">'
        + '<div style="width:36px;height:36px;border-radius:8px;background:#4285f415;display:flex;align-items:center;justify-content:center;">'
        + '<i data-lucide="calendar-days" style="width:18px;height:18px;color:#4285f4;"></i></div>'
        + '<div style="flex:1;"><div style="font-size:14px;font-weight:500;">Calendar \u2014 ' + UI.esc(biz.shortName) + '</div>'
        + '<div style="font-size:12px;color:var(--text-light);">' + (gConnected ? 'Uses same Google connection' : 'Connect Gmail first') + '</div></div>'
        + '<span class="status-badge ' + (gConnected ? 'status-active' : 'status-draft') + '">'
        + (gConnected ? 'Connected' : 'Pending') + '</span>'
        + '</div>';
    });

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
      + '<div style="margin-bottom:6px;"><strong>Version:</strong> 1.1.0</div>'
      + '</div>';
    html += '</div>';

    // Data
    html += '<div class="card">';
    html += '<div class="card-header"><div class="card-title"><i data-lucide="trash-2" style="color:var(--red);"></i> Data</div></div>';
    html += '<button class="btn btn-sm btn-outline" onclick="SettingsPage.clearCache()" style="border-color:var(--red);color:var(--red);">Clear Local Cache</button>';
    html += '<div style="font-size:11px;color:var(--text-muted);margin-top:6px;">Clears cached pipeline data and Google tokens. Will re-fetch on next load.</div>';
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

  saveClientId: function() {
    var id = document.getElementById('googleClientIdInput').value.trim();
    if (!id) { UI.toast('Please enter a Client ID', 'error'); return; }
    localStorage.setItem('bl-google-client-id', id);
    BL_CONFIG.googleClientId = id;
    GoogleAuth.init();
    UI.toast('Google Client ID saved');
    SettingsPage.render();
  },

  connectGoogle: async function(bizKey) {
    try {
      await GoogleAuth.connect(bizKey);
      UI.toast('Google connected for ' + bizKey);
      SettingsPage.render();
    } catch(e) {
      UI.toast('Connection failed: ' + e.message, 'error');
    }
  },

  disconnectGoogle: function(bizKey) {
    GoogleAuth.clearToken(bizKey);
    UI.toast('Google disconnected for ' + bizKey);
    SettingsPage.render();
  },

  clearCache: function() {
    if (!confirm('Clear all cached data and Google tokens?')) return;
    BL_CONFIG.businesses.forEach(function(biz) {
      localStorage.removeItem('bl-pipeline-' + biz.key);
      localStorage.removeItem('bl-sync-pipeline-' + biz.key);
      localStorage.removeItem('bl-google-token-' + biz.key);
    });
    UI.toast('Cache cleared');
    SettingsPage.render();
  }
};
