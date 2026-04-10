/**
 * Baseline — Inbox Page
 * Unified feed across all channels.
 */
var InboxPage = {
  currentFilter: 'all',

  render: async function() {
    var el = document.getElementById('pageContent');
    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:60px;"><div class="spinner"></div></div>';

    // Fetch pipeline data
    var bmData = await BMChannel.fetchPipeline();
    var slData = await SLChannel.fetchPipeline();

    var items = [];
    items = items.concat(BMChannel.toBriefingItems(bmData));
    items = items.concat(SLChannel.toBriefingItems(slData));

    // Fetch Gmail if connected
    var emailCount = 0;
    var activeBizzes = BL_CONFIG.businesses.filter(function(b) { return !b.comingSoon; });
    for (var i = 0; i < activeBizzes.length; i++) {
      var biz = activeBizzes[i];
      if (GmailChannel.isConnected(biz.key)) {
        try {
          var msgs = await GmailChannel.fetchUnread(biz.key, 20);
          items = items.concat(GmailChannel.toBriefingItems(msgs, biz.key));
          emailCount += msgs.length;
        } catch(e) { console.warn('[Inbox] Gmail error:', biz.key, e); }
      }
    }

    // Fetch Calendar if connected
    for (var j = 0; j < activeBizzes.length; j++) {
      var biz2 = activeBizzes[j];
      if (CalendarChannel.isConnected(biz2.key)) {
        try {
          var evts = await CalendarChannel.fetchUpcoming(biz2.key, 7);
          items = items.concat(CalendarChannel.toBriefingItems(evts, biz2.key));
        } catch(e) { console.warn('[Inbox] Calendar error:', biz2.key, e); }
      }
    }

    // Sort by timestamp (newest first)
    items.sort(function(a, b) {
      return (b.timestamp || '') > (a.timestamp || '') ? 1 : -1;
    });

    // Filter
    if (InboxPage.currentFilter !== 'all') {
      if (InboxPage.currentFilter === 'email') {
        items = items.filter(function(i) { return i.channel === 'gmail'; });
      } else if (InboxPage.currentFilter === 'pipeline') {
        items = items.filter(function(i) { return i.channel === 'branchmanager' || i.channel === 'smartlawn'; });
      } else if (InboxPage.currentFilter === 'calendar') {
        items = items.filter(function(i) { return i.channel === 'calendar'; });
      } else {
        items = items.filter(function(i) { return i.business === InboxPage.currentFilter; });
      }
    }

    var html = '';

    // Filter pills
    html += '<div class="filter-bar">';
    var filters = [
      { key: 'all', label: 'All' },
      { key: 'email', label: 'Email', icon: 'mail' },
      { key: 'pipeline', label: 'Pipeline', icon: 'git-pull-request' },
      { key: 'calendar', label: 'Calendar', icon: 'calendar' },
      { key: 'tree', label: 'SNTS', color: '#00836c' },
      { key: 'lawn', label: 'SLNY', color: '#6abb1e' }
    ];
    filters.forEach(function(f) {
      html += '<div class="filter-pill' + (InboxPage.currentFilter === f.key ? ' active' : '') + '" onclick="InboxPage.setFilter(\'' + f.key + '\')">';
      if (f.color) html += '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + f.color + ';margin-right:4px;"></span>';
      html += f.label + '</div>';
    });
    html += '</div>';

    if (items.length === 0) {
      html += UI.emptyState('\u{1F4EC}', 'Inbox empty', 'No items match this filter.');
    } else {
      items.forEach(function(item) {
        html += '<div class="briefing-item">'
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
    }

    el.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  setFilter: function(f) {
    InboxPage.currentFilter = f;
    InboxPage.render();
  }
};
