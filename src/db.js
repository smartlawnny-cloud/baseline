/**
 * Baseline — Local Storage Layer
 * Caches channel data locally for fast reads + offline fallback
 */
var DB = {
  _get: function(key) {
    try { return JSON.parse(localStorage.getItem('bl-' + key) || '[]'); }
    catch(e) { return []; }
  },
  _set: function(key, data) {
    try { localStorage.setItem('bl-' + key, JSON.stringify(data)); }
    catch(e) { console.warn('Storage full:', key); }
  },
  _getObj: function(key) {
    try { return JSON.parse(localStorage.getItem('bl-' + key) || '{}'); }
    catch(e) { return {}; }
  },
  _setObj: function(key, data) {
    try { localStorage.setItem('bl-' + key, JSON.stringify(data)); }
    catch(e) {}
  },

  // Cached pipeline data per business
  getPipeline: function(bizKey) { return DB._getObj('pipeline-' + bizKey); },
  setPipeline: function(bizKey, data) { DB._setObj('pipeline-' + bizKey, data); },

  // Action items
  getActions: function() { return DB._get('actions'); },
  setActions: function(items) { DB._set('actions', items); },
  addAction: function(item) {
    var items = DB.getActions();
    item.id = item.id || Date.now().toString(36) + Math.random().toString(36).substr(2,4);
    item.status = item.status || 'open';
    item.createdAt = item.createdAt || new Date().toISOString();
    items.unshift(item);
    DB.setActions(items);
    return item;
  },
  toggleAction: function(id) {
    var items = DB.getActions();
    items.forEach(function(a) {
      if (a.id === id) {
        a.status = a.status === 'done' ? 'open' : 'done';
        if (a.status === 'done') a.completedAt = new Date().toISOString();
      }
    });
    DB.setActions(items);
  },

  // Preferences
  getPref: function(key, def) {
    var v = localStorage.getItem('bl-pref-' + key);
    return v !== null ? JSON.parse(v) : def;
  },
  setPref: function(key, val) {
    localStorage.setItem('bl-pref-' + key, JSON.stringify(val));
  },

  // Sync timestamps
  getLastSync: function(channel, bizKey) {
    return localStorage.getItem('bl-sync-' + channel + '-' + bizKey) || null;
  },
  setLastSync: function(channel, bizKey) {
    localStorage.setItem('bl-sync-' + channel + '-' + bizKey, new Date().toISOString());
  }
};
