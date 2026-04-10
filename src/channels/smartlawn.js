/**
 * Baseline — Smart Lawn NY Channel
 * Reads pipeline data from Smart Lawn's Supabase
 */
var SLChannel = {
  bizKey: 'lawn',

  fetchPipeline: async function() {
    var client = SupabaseManager.getClient(SLChannel.bizKey);
    if (!client) return DB.getPipeline(SLChannel.bizKey) || SLChannel._empty();

    // Wrap entire fetch in a 5s timeout so paused projects don't block the app
    try {
      return await new Promise(function(resolve, reject) {
        var timer = setTimeout(function() {
          console.warn('[SLChannel] Timeout — using cache');
          resolve(DB.getPipeline(SLChannel.bizKey) || SLChannel._empty());
        }, 5000);

        SLChannel._doFetch(client).then(function(data) {
          clearTimeout(timer);
          resolve(data);
        }).catch(function(e) {
          clearTimeout(timer);
          console.warn('[SLChannel] Error:', e.message || e);
          resolve(DB.getPipeline(SLChannel.bizKey) || SLChannel._empty());
        });
      });
    } catch(e) {
      console.warn('[SLChannel] Outer error:', e);
      return SLChannel._empty();
    }
  },

  _doFetch: async function(client) {
    var thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    var [invoicesRes, salesRes, customersRes] = await Promise.all([
      client.from('invoices').select('id,invoice_number,customer_name,customer_email,total,status,due_date,created_at')
        .in('status', ['sent', 'viewed', 'overdue', 'draft'])
        .order('due_date', { ascending: true })
        .limit(50),
      client.from('sales').select('id,total,customer_id,status,receipt_number,created_at')
        .gte('created_at', thirtyDaysAgo)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(50),
      client.from('customers').select('id', { count: 'exact', head: true })
    ]);

    var invoices = invoicesRes.data || [];
    var sales = salesRes.data || [];

    var data = {
      invoices: invoices,
      recentSales: sales,
      customerCount: customersRes.count || 0,
      fetchedAt: new Date().toISOString()
    };

    data.stats = {
      overdueCount: invoices.filter(function(i) { return i.status === 'overdue'; }).length,
      overdueValue: invoices.filter(function(i) { return i.status === 'overdue'; })
        .reduce(function(s, i) { return s + (i.total || 0); }, 0),
      totalReceivable: invoices.reduce(function(s, i) { return s + (i.total || 0); }, 0),
      recentSalesCount: sales.length,
      recentSalesValue: sales.reduce(function(s, r) { return s + (r.total || 0); }, 0),
      customerCount: data.customerCount
    };

    DB.setPipeline(SLChannel.bizKey, data);
    DB.setLastSync('pipeline', SLChannel.bizKey);
    return data;
  },

  _empty: function() {
    return { invoices: [], recentSales: [], customerCount: 0, fetchedAt: null, stats: {
      overdueCount: 0, overdueValue: 0, totalReceivable: 0,
      recentSalesCount: 0, recentSalesValue: 0, customerCount: 0
    }};
  },

  toBriefingItems: function(data) {
    var items = [];
    if (!data || !data.stats) return items;

    (data.invoices || []).filter(function(i) { return i.status === 'overdue'; }).forEach(function(inv) {
      items.push({
        id: 'sl-inv-' + inv.id, channel: 'smartlawn', business: 'lawn',
        priority: (inv.total || 0) > 500 ? 'urgent' : 'high', category: 'invoice',
        title: 'Overdue: ' + (inv.customer_name || 'Invoice #' + inv.invoice_number),
        preview: UI.money(inv.total) + ' due ' + UI.dateShort(inv.due_date),
        timestamp: inv.due_date || inv.created_at, icon: 'alert-circle', iconBg: 'var(--red)'
      });
    });

    (data.invoices || []).filter(function(i) { return i.status === 'sent' || i.status === 'viewed'; }).forEach(function(inv) {
      items.push({
        id: 'sl-inv-' + inv.id, channel: 'smartlawn', business: 'lawn',
        priority: 'medium', category: 'invoice',
        title: 'Unpaid: ' + (inv.customer_name || 'Invoice #' + inv.invoice_number),
        preview: UI.money(inv.total) + ' due ' + UI.dateShort(inv.due_date),
        timestamp: inv.due_date || inv.created_at, icon: 'file-text', iconBg: 'var(--orange)'
      });
    });

    return items;
  }
};
