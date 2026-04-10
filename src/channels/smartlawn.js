/**
 * Baseline — Smart Lawn NY Channel
 * Reads pipeline data from Smart Lawn's Supabase
 */
var SLChannel = {
  bizKey: 'lawn',

  fetchPipeline: async function() {
    var client = SupabaseManager.getClient(SLChannel.bizKey);
    if (!client) return DB.getPipeline(SLChannel.bizKey);

    try {
      var today = new Date().toISOString().split('T')[0];
      var thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

      var [invoicesRes, salesRes, customersRes] = await Promise.all([
        // Unpaid invoices
        client.from('invoices').select('id,invoice_number,customer_name,customer_email,total,status,due_date,created_at')
          .in('status', ['sent', 'viewed', 'overdue', 'draft'])
          .order('due_date', { ascending: true })
          .limit(50),
        // Recent sales (last 30 days)
        client.from('sales').select('id,total,customer_id,status,receipt_number,created_at')
          .gte('created_at', thirtyDaysAgo)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(50),
        // Customer count
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

      // Stats
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
    } catch(e) {
      console.warn('[SLChannel] Fetch error:', e);
      return DB.getPipeline(SLChannel.bizKey);
    }
  },

  toBriefingItems: function(data) {
    var items = [];
    if (!data || !data.stats) return items;

    // Overdue invoices
    (data.invoices || []).filter(function(i) { return i.status === 'overdue'; }).forEach(function(inv) {
      items.push({
        id: 'sl-inv-' + inv.id,
        channel: 'smartlawn',
        business: 'lawn',
        priority: (inv.total || 0) > 500 ? 'urgent' : 'high',
        category: 'invoice',
        title: 'Overdue: ' + (inv.customer_name || 'Invoice #' + inv.invoice_number),
        preview: UI.money(inv.total) + ' due ' + UI.dateShort(inv.due_date),
        timestamp: inv.due_date || inv.created_at,
        icon: 'alert-circle',
        iconBg: 'var(--red)'
      });
    });

    // Unpaid invoices (not overdue)
    (data.invoices || []).filter(function(i) { return i.status === 'sent' || i.status === 'viewed'; }).forEach(function(inv) {
      items.push({
        id: 'sl-inv-' + inv.id,
        channel: 'smartlawn',
        business: 'lawn',
        priority: 'medium',
        category: 'invoice',
        title: 'Unpaid: ' + (inv.customer_name || 'Invoice #' + inv.invoice_number),
        preview: UI.money(inv.total) + ' due ' + UI.dateShort(inv.due_date),
        timestamp: inv.due_date || inv.created_at,
        icon: 'file-text',
        iconBg: 'var(--orange)'
      });
    });

    return items;
  }
};
