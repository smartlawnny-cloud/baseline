/**
 * Baseline — Supabase Multi-Client Manager
 * Initializes one Supabase client per business that has a Supabase config
 */
var SupabaseManager = {
  clients: {},
  ready: false,

  init: function() {
    var self = this;
    // Load Supabase JS from CDN
    if (window.supabase) {
      self._connect();
      return;
    }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    s.onload = function() { self._connect(); };
    s.onerror = function() { console.warn('Supabase CDN failed — running offline'); };
    document.head.appendChild(s);
  },

  _connect: function() {
    var self = this;
    // Skip list: projects known to be paused/unreachable (avoids hanging the browser)
    var skip = JSON.parse(localStorage.getItem('bl-supabase-skip') || '[]');

    BL_CONFIG.businesses.forEach(function(biz) {
      if (biz.supabaseUrl && biz.supabaseKey && !biz.comingSoon) {
        if (skip.indexOf(biz.key) !== -1) {
          console.log('[Baseline] Skipping (paused):', biz.shortName);
          return;
        }
        try {
          self.clients[biz.key] = window.supabase.createClient(biz.supabaseUrl, biz.supabaseKey);
          console.log('[Baseline] Connected:', biz.shortName);
        } catch(e) {
          console.warn('[Baseline] Failed:', biz.shortName, e);
        }
      }
    });
    self.ready = true;
  },

  // Mark a project as paused (skip on next load). Call from Settings.
  markPaused: function(bizKey) {
    var skip = JSON.parse(localStorage.getItem('bl-supabase-skip') || '[]');
    if (skip.indexOf(bizKey) === -1) skip.push(bizKey);
    localStorage.setItem('bl-supabase-skip', JSON.stringify(skip));
    delete this.clients[bizKey];
  },

  markActive: function(bizKey) {
    var skip = JSON.parse(localStorage.getItem('bl-supabase-skip') || '[]');
    skip = skip.filter(function(k) { return k !== bizKey; });
    localStorage.setItem('bl-supabase-skip', JSON.stringify(skip));
  },

  getClient: function(bizKey) {
    return this.clients[bizKey] || null;
  },

  isConnected: function(bizKey) {
    return !!this.clients[bizKey];
  }
};
