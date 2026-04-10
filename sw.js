var CACHE_NAME = 'baseline-v2';
var ASSETS = [
  './',
  './index.html',
  './config.js',
  './manifest.json',
  './src/ui.js',
  './src/db.js',
  './src/auth.js',
  './src/supabase.js',
  './src/channels/branchmanager.js',
  './src/channels/smartlawn.js',
  './src/channels/gmail.js',
  './src/channels/calendar.js',
  './src/channels/dialpad.js',
  './src/pages/briefing.js',
  './src/pages/pipeline.js',
  './src/pages/settings.js',
  './src/pages/inbox.js',
  './src/pages/calendar.js',
  './src/pages/calls.js'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
          .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Skip non-GET and cross-origin
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var fetchPromise = fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      }).catch(function() { return cached; });

      return cached || fetchPromise;
    })
  );
});
