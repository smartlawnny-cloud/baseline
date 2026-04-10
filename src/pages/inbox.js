/**
 * Baseline — Inbox Page (Phase 2)
 * Unified feed across all channels. Pipeline items shown now, email/calls in later phases.
 */
var InboxPage = {
  currentFilter: 'all',

  render: async function() {
    var el = document.getElementById('pageContent');
    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:60px;"><div class="spinner"></div></div>';

    var bmData = await BMChannel.fetchPipeline();
    var slData = await SLChannel.fetchPipeline();

    var items = [];
    items = items.concat(BMChannel.toBriefingItems(bmData));
    items = items.concat(SLChannel.toBriefingItems(slData));

    // Sort by timestamp (newest first)
    items.sort(function(a, b) {
      return (b.timestamp || '') > (a.timestamp || '') ? 1 : -1;
    });

    // Filter
    if (InboxPage.currentFilter !== 'all') {
      items = items.filter(function(i) { return i.business === InboxPage.currentFilter; });
    }

    var html = '';

    // Filter pills
    html += '<div class="filter-bar">';
    html += '<div class="filter-pill' + (InboxPage.currentFilter === 'all' ? ' active' : '') + '" onclick="InboxPage.setFilter(\'all\')">All</div>';
    html += '<div class="filter-pill' + (InboxPage.currentFilter === 'tree' ? ' active' : '') + '" onclick="InboxPage.setFilter(\'tree\')"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#00836c;margin-right:4px;"></span>SNTS</div>';
    html += '<div class="filter-pill' + (InboxPage.currentFilter === 'lawn' ? ' active' : '') + '" onclick="InboxPage.setFilter(\'lawn\')"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#6abb1e;margin-right:4px;"></span>SLNY</div>';
    html += '</div>';

    if (items.length === 0) {
      html += UI.emptyState('\u{1F4EC}', 'Inbox empty', 'No items to show. Connect Gmail for email integration.');
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

    // Phase 2 note
    html += '<div style="text-align:center;padding:24px;font-size:12px;color:var(--text-muted);">'
      + 'Email and call data will appear here once Gmail and Dialpad are connected.'
      + '</div>';

    el.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  setFilter: function(f) {
    InboxPage.currentFilter = f;
    InboxPage.render();
  }
};
