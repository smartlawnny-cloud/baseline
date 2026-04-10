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
    BL_CONFIG.businesses.forEach(function(biz) {
      if (biz.supabaseUrl && biz.supabaseKey) {
        try {
          self.clients[biz.key] = window.supabase.createClient(biz.supabaseUrl, biz.supabaseKey);
          console.log('[Baseline] Connected:', biz.shortName);
        } catch(e) {
          console.warn('[Baseline] Failed to connect:', biz.shortName, e);
        }
      }
    });
    self.ready = true;
  },

  getClient: function(bizKey) {
    return this.clients[bizKey] || null;
  },

  isConnected: function(bizKey) {
    return !!this.clients[bizKey];
  }
};
