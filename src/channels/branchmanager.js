/**
 * Baseline — Branch Manager Channel
 * Reads pipeline data from Second Nature Tree's Supabase
 */
var BMChannel = {
  bizKey: 'tree',

  fetchPipeline: async function() {
    var client = SupabaseManager.getClient(BMChannel.bizKey);
    if (!client) return DB.getPipeline(BMChannel.bizKey);

    try {
      var today = new Date().toISOString().split('T')[0];
      var weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

      // Parallel fetches
      var [quotesRes, invoicesRes, jobsRes, requestsRes, recentJobsRes] = await Promise.all([
        // Open quotes (sent or awaiting)
        client.from('quotes').select('id,quote_number,client_id,client_name,property,total,status,created_at,expires_at')
          .in('status', ['sent', 'awaiting', 'approved'])
          .order('created_at', { ascending: false })
          .limit(50),
        // Unpaid invoices
        client.from('invoices').select('id,invoice_number,client_id,client_name,total,balance,status,due_date,created_at')
          .in('status', ['sent', 'viewed', 'partial', 'overdue'])
          .gt('balance', 0)
          .order('due_date', { ascending: true })
          .limit(50),
        // Today's jobs
        client.from('jobs').select('id,job_number,client_id,client_name,property,total,status,scheduled_date,crew')
          .eq('scheduled_date', today)
          .order('created_at', { ascending: false }),
        // New requests
        client.from('requests').select('id,client_name,property,email,phone,status,source,created_at')
          .eq('status', 'new')
          .order('created_at', { ascending: false })
          .limit(20),
        // Recently completed jobs (for "needs invoice" detection)
        client.from('jobs').select('id,job_number,client_name,total,status,completed_date,invoice_id')
          .eq('status', 'completed')
          .is('invoice_id', null)
          .order('completed_date', { ascending: false })
          .limit(20)
      ]);

      var data = {
        quotes: quotesRes.data || [],
        invoices: invoicesRes.data || [],
        todayJobs: jobsRes.data || [],
        newRequests: requestsRes.data || [],
        needsInvoice: recentJobsRes.data || [],
        fetchedAt: new Date().toISOString()
      };

      // Compute summary stats
      data.stats = {
        openQuotesCount: data.quotes.filter(function(q) { return q.status === 'sent' || q.status === 'awaiting'; }).length,
        openQuotesValue: data.quotes.filter(function(q) { return q.status === 'sent' || q.status === 'awaiting'; })
          .reduce(function(s, q) { return s + (q.total || 0); }, 0),
        approvedQuotesCount: data.quotes.filter(function(q) { return q.status === 'approved'; }).length,
        overdueCount: data.invoices.filter(function(i) { return i.status === 'overdue'; }).length,
        overdueValue: data.invoices.filter(function(i) { return i.status === 'overdue'; })
          .reduce(function(s, i) { return s + (i.balance || 0); }, 0),
        totalReceivable: data.invoices.reduce(function(s, i) { return s + (i.balance || 0); }, 0),
        todayJobCount: data.todayJobs.length,
        newRequestCount: data.newRequests.length,
        needsInvoiceCount: data.needsInvoice.length
      };

      // Cache locally
      DB.setPipeline(BMChannel.bizKey, data);
      DB.setLastSync('pipeline', BMChannel.bizKey);
      return data;
    } catch(e) {
      console.warn('[BMChannel] Fetch error:', e);
      return DB.getPipeline(BMChannel.bizKey);
    }
  },

  // Convert pipeline data to briefing items
  toBriefingItems: function(data) {
    var items = [];
    if (!data || !data.stats) return items;

    // Overdue invoices (urgent)
    data.invoices.filter(function(i) { return i.status === 'overdue'; }).forEach(function(inv) {
      items.push({
        id: 'bm-inv-' + inv.id,
        channel: 'branchmanager',
        business: 'tree',
        priority: (inv.balance || 0) > 500 ? 'urgent' : 'high',
        category: 'invoice',
        title: 'Overdue: ' + (inv.client_name || 'Invoice #' + inv.invoice_number),
        preview: UI.money(inv.balance) + ' due ' + UI.dateShort(inv.due_date),
        timestamp: inv.due_date || inv.created_at,
        icon: 'alert-circle',
        iconBg: 'var(--red)'
      });
    });

    // New requests (high)
    data.newRequests.forEach(function(req) {
      items.push({
        id: 'bm-req-' + req.id,
        channel: 'branchmanager',
        business: 'tree',
        priority: 'high',
        category: 'request',
        title: 'New request: ' + (req.client_name || 'Unknown'),
        preview: (req.property || '') + (req.source ? ' via ' + req.source : ''),
        timestamp: req.created_at,
        icon: 'message-square',
        iconBg: 'var(--orange)'
      });
    });

    // Approved quotes needing jobs (high)
    data.quotes.filter(function(q) { return q.status === 'approved'; }).forEach(function(q) {
      items.push({
        id: 'bm-quot-' + q.id,
        channel: 'branchmanager',
        business: 'tree',
        priority: 'high',
        category: 'quote',
        title: 'Approved \u2014 needs job: ' + (q.client_name || 'Quote #' + q.quote_number),
        preview: UI.money(q.total),
        timestamp: q.created_at,
        icon: 'check-circle',
        iconBg: 'var(--green)'
      });
    });

    // Today's jobs (medium)
    data.todayJobs.forEach(function(job) {
      items.push({
        id: 'bm-job-' + job.id,
        channel: 'branchmanager',
        business: 'tree',
        priority: 'medium',
        category: 'job',
        title: (job.client_name || 'Job #' + job.job_number),
        preview: (job.property || '') + ' \u2014 ' + UI.money(job.total),
        timestamp: job.scheduled_date,
        icon: 'hard-hat',
        iconBg: 'var(--primary)'
      });
    });

    // Completed jobs needing invoices (medium)
    data.needsInvoice.forEach(function(job) {
      items.push({
        id: 'bm-ni-' + job.id,
        channel: 'branchmanager',
        business: 'tree',
        priority: 'medium',
        category: 'job',
        title: 'Needs invoice: ' + (job.client_name || 'Job #' + job.job_number),
        preview: UI.money(job.total) + ' completed ' + UI.dateRelative(job.completed_date),
        timestamp: job.completed_date,
        icon: 'file-text',
        iconBg: 'var(--purple)'
      });
    });

    // Stale quotes (low)
    var tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();
    data.quotes.filter(function(q) {
      return (q.status === 'sent' || q.status === 'awaiting') && q.created_at < tenDaysAgo;
    }).forEach(function(q) {
      items.push({
        id: 'bm-stale-' + q.id,
        channel: 'branchmanager',
        business: 'tree',
        priority: 'low',
        category: 'quote',
        title: 'Stale quote: ' + (q.client_name || 'Quote #' + q.quote_number),
        preview: UI.money(q.total) + ' sent ' + UI.dateRelative(q.created_at),
        timestamp: q.created_at,
        icon: 'clock',
        iconBg: 'var(--text-muted)'
      });
    });

    return items;
  }
};
