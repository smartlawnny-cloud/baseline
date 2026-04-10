/**
 * Baseline — Briefing Page
 * The main daily digest view. Aggregates all channels, prioritizes, displays.
 */
var BriefingPage = {
  render: async function() {
    var el = document.getElementById('pageContent');
    el.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px;gap:16px;">'
      + '<div class="spinner"></div>'
      + '<span style="font-size:13px;color:var(--text-light);">Loading briefing...</span></div>';

    // Wait for Supabase to be ready (CDN load)
    var waited = 0;
    while (!SupabaseManager.ready && waited < 5000) {
      await new Promise(function(r) { setTimeout(r, 200); });
      waited += 200;
    }

    // Fetch all channel data in parallel
    var bmData, slData;
    try {
      [bmData, slData] = await Promise.all([
        BMChannel.fetchPipeline(),
        SLChannel.fetchPipeline()
      ]);
    } catch(e) {
      console.warn('[Briefing] Fetch error:', e);
      bmData = DB.getPipeline('tree');
      slData = DB.getPipeline('lawn');
    }

    // Convert to briefing items
    var items = [];
    items = items.concat(BMChannel.toBriefingItems(bmData));
    items = items.concat(SLChannel.toBriefingItems(slData));

    // Sort by priority then timestamp
    var priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    items.sort(function(a, b) {
      var pa = priorityOrder[a.priority] || 3;
      var pb = priorityOrder[b.priority] || 3;
      if (pa !== pb) return pa - pb;
      return (b.timestamp || '') > (a.timestamp || '') ? 1 : -1;
    });

    // Group by priority
    var urgent = items.filter(function(i) { return i.priority === 'urgent'; });
    var high = items.filter(function(i) { return i.priority === 'high'; });
    var medium = items.filter(function(i) { return i.priority === 'medium'; });
    var low = items.filter(function(i) { return i.priority === 'low'; });

    // Build stats
    var bmStats = (bmData && bmData.stats) || {};
    var slStats = (slData && slData.stats) || {};

    var html = '';

    // Greeting
    html += '<div class="greeting">' + UI.esc(getGreeting()) + '</div>';

    var now = new Date();
    var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    html += '<div class="greeting-sub">' + dayNames[now.getDay()] + ', ' + monthNames[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear() + '</div>';

    // Stats row
    html += '<div class="stats-grid">';
    html += UI.statCard('Today\'s Jobs', bmStats.todayJobCount || 0, 'SNTS');
    html += UI.statCard('Open Quotes', (bmStats.openQuotesCount || 0) + (slStats.overdueCount ? '' : ''),
      UI.moneyInt(bmStats.openQuotesValue || 0) + ' pipeline');
    html += UI.statCard('Receivables',
      UI.moneyInt((bmStats.totalReceivable || 0) + (slStats.totalReceivable || 0)),
      (bmStats.overdueCount || 0) + (slStats.overdueCount || 0) + ' overdue');
    html += UI.statCard('New Requests', bmStats.newRequestCount || 0, 'Awaiting response');
    html += '</div>';

    // Channel connection status
    var disconnected = [];
    if (!GmailChannel.isConnected('tree')) disconnected.push('Gmail');
    if (!CalendarChannel.isConnected('tree')) disconnected.push('Calendar');
    if (!DialpadChannel.isConnected()) disconnected.push('Dialpad');
    if (disconnected.length > 0) {
      html += '<div class="card" style="margin-bottom:24px;padding:14px 20px;display:flex;align-items:center;gap:12px;border-left:3px solid var(--orange);">'
        + '<i data-lucide="plug-zap" style="width:18px;height:18px;color:var(--orange);flex-shrink:0;"></i>'
        + '<div style="flex:1;font-size:13px;">'
        + '<strong>Connect channels</strong> for a complete briefing: ' + disconnected.join(', ')
        + '</div>'
        + '<button class="btn btn-sm btn-outline" onclick="loadPage(\'settings\')">Setup</button>'
        + '</div>';
    }

    // Urgent section
    if (urgent.length > 0) {
      html += BriefingPage._renderSection('Needs Attention', 'alert-triangle', 'var(--red)', urgent);
    }

    // High priority
    if (high.length > 0) {
      html += BriefingPage._renderSection('Action Required', 'zap', 'var(--orange)', high);
    }

    // Today / Medium
    if (medium.length > 0) {
      html += BriefingPage._renderSection('Today', 'calendar', 'var(--primary)', medium);
    }

    // Low priority
    if (low.length > 0) {
      html += BriefingPage._renderSection('Follow Up', 'clock', 'var(--text-muted)', low);
    }

    // No items
    if (items.length === 0) {
      html += UI.emptyState('\u2728', 'All clear', 'No action items right now. Connect more channels for a fuller picture.');
    }

    // Action Items Checklist
    var actions = DB.getActions();
    html += '<div class="card" style="margin-top:24px;">';
    html += '<div class="card-header">'
      + '<div class="card-title"><i data-lucide="check-square"></i> Action Items</div>'
      + '<button class="btn btn-sm btn-outline" onclick="BriefingPage.addAction()"><i data-lucide="plus" style="width:14px;height:14px;"></i> Add</button>'
      + '</div>';
    if (actions.length === 0) {
      html += '<div style="padding:16px;text-align:center;color:var(--text-muted);font-size:13px;">No action items yet</div>';
    } else {
      actions.forEach(function(a) {
        html += '<div class="action-item' + (a.status === 'done' ? ' done' : '') + '">'
          + '<input type="checkbox" ' + (a.status === 'done' ? 'checked' : '') + ' onchange="BriefingPage.toggleAction(\'' + a.id + '\')">'
          + '<span class="ai-text">' + UI.esc(a.text) + '</span>'
          + (a.business ? UI.bizTag(a.business) : '')
          + '<span class="ai-priority priority-' + (a.priority || 'medium') + '">' + (a.priority || '') + '</span>'
          + '</div>';
      });
    }
    html += '</div>';

    // Last synced
    var syncTime = DB.getLastSync('pipeline', 'tree');
    if (syncTime) {
      html += '<div style="text-align:center;padding:16px;font-size:11px;color:var(--text-muted);">'
        + 'Last synced ' + UI.timeAgo(syncTime)
        + '</div>';
    }

    el.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  _renderSection: function(title, icon, color, items) {
    var html = '<div class="briefing-section">';
    html += '<div class="briefing-section-title"><i data-lucide="' + icon + '" style="width:14px;height:14px;color:' + color + ';"></i> ' + title + ' <span style="font-size:11px;opacity:.6;">(' + items.length + ')</span></div>';
    items.forEach(function(item) {
      html += '<div class="briefing-item" onclick="BriefingPage.itemDetail(\'' + UI.esc(item.id) + '\')">'
        + '<div class="bi-icon" style="background:' + (item.iconBg || 'var(--primary)') + '15;">'
        + '<i data-lucide="' + (item.icon || 'circle') + '" style="width:16px;height:16px;color:' + (item.iconBg || 'var(--primary)') + ';"></i>'
        + '</div>'
        + '<div class="bi-body">'
        + '<div class="bi-title">' + UI.esc(item.title) + '</div>'
        + '<div class="bi-desc">' + UI.esc(item.preview) + '</div>'
        + '</div>'
        + '<div class="bi-meta">'
        + UI.bizTag(item.business)
        + '<div style="margin-top:4px;">' + UI.timeAgo(item.timestamp) + '</div>'
        + '</div>'
        + '</div>';
    });
    html += '</div>';
    return html;
  },

  addAction: function() {
    var text = prompt('Action item:');
    if (!text) return;
    DB.addAction({ text: text, priority: 'medium' });
    BriefingPage.render();
  },

  toggleAction: function(id) {
    DB.toggleAction(id);
    BriefingPage.render();
  },

  itemDetail: function(id) {
    // Future: expand item inline or open in relevant app
    console.log('Item detail:', id);
  }
};
