/**
 * Baseline — Pipeline Page
 * Combined pipeline view for all businesses
 */
var PipelinePage = {
  currentBiz: 'all',

  render: async function() {
    var el = document.getElementById('pageContent');
    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:60px;"><div class="spinner"></div></div>';

    var bmData = await BMChannel.fetchPipeline();
    var slData = await SLChannel.fetchPipeline();

    var html = '';

    // Filter pills
    html += '<div class="filter-bar">';
    html += '<div class="filter-pill' + (PipelinePage.currentBiz === 'all' ? ' active' : '') + '" onclick="PipelinePage.filter(\'all\')">All</div>';
    BL_CONFIG.businesses.forEach(function(biz) {
      if (!biz.comingSoon) {
        html += '<div class="filter-pill' + (PipelinePage.currentBiz === biz.key ? ' active' : '') + '" onclick="PipelinePage.filter(\'' + biz.key + '\')">'
          + '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + biz.color + ';margin-right:4px;"></span>'
          + biz.shortName + '</div>';
      }
    });
    html += '</div>';

    // Branch Manager Pipeline
    if (PipelinePage.currentBiz === 'all' || PipelinePage.currentBiz === 'tree') {
      html += PipelinePage._renderBMPipeline(bmData);
    }

    // Smart Lawn Pipeline
    if (PipelinePage.currentBiz === 'all' || PipelinePage.currentBiz === 'lawn') {
      html += PipelinePage._renderSLPipeline(slData);
    }

    // 2NTR placeholder
    if (PipelinePage.currentBiz === 'all' || PipelinePage.currentBiz === 'skate') {
      html += '<div class="card" style="margin-bottom:24px;">';
      html += '<div class="card-header"><div class="card-title"><i data-lucide="zap" style="color:var(--red);"></i> 2NTR Skatepark</div>'
        + '<span class="status-badge status-draft">Coming Soon</span></div>';
      html += '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">Square POS integration planned</div>';
      html += '</div>';
    }

    el.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  },

  filter: function(biz) {
    PipelinePage.currentBiz = biz;
    PipelinePage.render();
  },

  _renderBMPipeline: function(data) {
    if (!data || !data.stats) return '';
    var html = '<div class="card" style="margin-bottom:24px;">';
    html += '<div class="card-header"><div class="card-title"><i data-lucide="tree-pine" style="color:#00836c;"></i> Second Nature Tree</div></div>';

    // Stats
    html += '<div class="stats-grid" style="margin-bottom:16px;">';
    html += UI.statCard('Open Quotes', data.stats.openQuotesCount, UI.moneyInt(data.stats.openQuotesValue));
    html += UI.statCard('Approved', data.stats.approvedQuotesCount, 'Need scheduling');
    html += UI.statCard('Receivables', UI.moneyInt(data.stats.totalReceivable), data.stats.overdueCount + ' overdue');
    html += UI.statCard('Needs Invoice', data.stats.needsInvoiceCount, 'Completed jobs');
    html += '</div>';

    // Quotes table
    var quotes = (data.quotes || []).filter(function(q) { return q.status !== 'approved'; });
    if (quotes.length > 0) {
      html += '<h4 style="font-size:13px;font-weight:600;margin:16px 0 8px;color:var(--text-light);">Open Quotes</h4>';
      html += '<table class="data-table"><thead><tr><th>#</th><th>Client</th><th>Amount</th><th>Status</th><th>Sent</th></tr></thead><tbody>';
      quotes.forEach(function(q) {
        html += '<tr><td>' + (q.quote_number || '') + '</td><td>' + UI.esc(q.client_name || 'Unknown') + '</td>'
          + '<td>' + UI.money(q.total) + '</td><td>' + UI.statusBadge(q.status) + '</td>'
          + '<td>' + UI.dateRelative(q.created_at) + '</td></tr>';
      });
      html += '</tbody></table>';
    }

    // Invoices table
    if (data.invoices.length > 0) {
      html += '<h4 style="font-size:13px;font-weight:600;margin:16px 0 8px;color:var(--text-light);">Unpaid Invoices</h4>';
      html += '<table class="data-table"><thead><tr><th>#</th><th>Client</th><th>Balance</th><th>Status</th><th>Due</th></tr></thead><tbody>';
      data.invoices.forEach(function(inv) {
        html += '<tr><td>' + (inv.invoice_number || '') + '</td><td>' + UI.esc(inv.client_name || 'Unknown') + '</td>'
          + '<td>' + UI.money(inv.balance) + '</td><td>' + UI.statusBadge(inv.status) + '</td>'
          + '<td>' + UI.dateShort(inv.due_date) + '</td></tr>';
      });
      html += '</tbody></table>';
    }

    html += '</div>';
    return html;
  },

  _renderSLPipeline: function(data) {
    if (!data || !data.stats) {
      return '<div class="card" style="margin-bottom:24px;">'
        + '<div class="card-header"><div class="card-title"><i data-lucide="leaf" style="color:#6abb1e;"></i> Smart Lawn NY</div></div>'
        + '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No data loaded. Check Supabase connection in Settings.</div>'
        + '</div>';
    }

    var html = '<div class="card" style="margin-bottom:24px;">';
    html += '<div class="card-header"><div class="card-title"><i data-lucide="leaf" style="color:#6abb1e;"></i> Smart Lawn NY</div></div>';

    html += '<div class="stats-grid" style="margin-bottom:16px;">';
    html += UI.statCard('30-Day Sales', UI.moneyInt(data.stats.recentSalesValue), data.stats.recentSalesCount + ' transactions');
    html += UI.statCard('Receivables', UI.moneyInt(data.stats.totalReceivable), data.stats.overdueCount + ' overdue');
    html += UI.statCard('Customers', data.stats.customerCount, 'Total');
    html += '</div>';

    // Invoices
    if (data.invoices && data.invoices.length > 0) {
      html += '<h4 style="font-size:13px;font-weight:600;margin:16px 0 8px;color:var(--text-light);">Unpaid Invoices</h4>';
      html += '<table class="data-table"><thead><tr><th>#</th><th>Customer</th><th>Amount</th><th>Status</th><th>Due</th></tr></thead><tbody>';
      data.invoices.forEach(function(inv) {
        html += '<tr><td>' + UI.esc(inv.invoice_number || '') + '</td><td>' + UI.esc(inv.customer_name || 'Unknown') + '</td>'
          + '<td>' + UI.money(inv.total) + '</td><td>' + UI.statusBadge(inv.status) + '</td>'
          + '<td>' + UI.dateShort(inv.due_date) + '</td></tr>';
      });
      html += '</tbody></table>';
    }

    html += '</div>';
    return html;
  }
};
