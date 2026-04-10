/**
 * Baseline — Google OAuth via Google Identity Services (GIS)
 *
 * Uses the new GIS library (accounts.google.com/gsi/client) for token-based auth.
 * Supports multiple Google accounts (one per business).
 *
 * Flow:
 * 1. User clicks "Connect Gmail" in Settings
 * 2. GIS popup shows Google account picker
 * 3. User grants gmail.readonly + calendar.readonly scopes
 * 4. Access token stored in localStorage per business key
 * 5. Token auto-refreshes on use (GIS handles refresh via requestAccessToken)
 */
var GoogleAuth = {
  SCOPES: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
  _tokenClients: {},   // keyed by bizKey
  _loaded: false,
  _gapiLoaded: false,

  // Tokens stored per business: bl-google-token-tree, bl-google-token-lawn
  getToken: function(bizKey) {
    var stored = localStorage.getItem('bl-google-token-' + bizKey);
    if (!stored) return null;
    try {
      var t = JSON.parse(stored);
      // Check if expired (tokens last ~1 hour)
      if (t.expiresAt && Date.now() > t.expiresAt) return null;
      return t;
    } catch(e) { return null; }
  },

  setToken: function(bizKey, tokenResponse) {
    var data = {
      access_token: tokenResponse.access_token,
      scope: tokenResponse.scope,
      expiresAt: Date.now() + (tokenResponse.expires_in * 1000) - 60000, // 1 min buffer
      email: null, // filled after first API call
      storedAt: new Date().toISOString()
    };
    localStorage.setItem('bl-google-token-' + bizKey, JSON.stringify(data));
    return data;
  },

  clearToken: function(bizKey) {
    var token = GoogleAuth.getToken(bizKey);
    if (token && token.access_token && window.google) {
      google.accounts.oauth2.revoke(token.access_token);
    }
    localStorage.removeItem('bl-google-token-' + bizKey);
  },

  isConnected: function(bizKey) {
    return !!GoogleAuth.getToken(bizKey);
  },

  // Load both GIS and gapi libraries
  init: function() {
    if (!BL_CONFIG.googleClientId) return;

    // Load GIS (Google Identity Services)
    if (!window.google || !window.google.accounts) {
      var s1 = document.createElement('script');
      s1.src = 'https://accounts.google.com/gsi/client';
      s1.onload = function() {
        GoogleAuth._loaded = true;
        console.log('[GoogleAuth] GIS loaded');
      };
      document.head.appendChild(s1);
    } else {
      GoogleAuth._loaded = true;
    }

    // Load gapi (Google API client for Gmail/Calendar REST calls)
    if (!window.gapi) {
      var s2 = document.createElement('script');
      s2.src = 'https://apis.google.com/js/api.js';
      s2.onload = function() {
        gapi.load('client', function() {
          gapi.client.init({}).then(function() {
            GoogleAuth._gapiLoaded = true;
            console.log('[GoogleAuth] gapi loaded');
          });
        });
      };
      document.head.appendChild(s2);
    } else {
      GoogleAuth._gapiLoaded = true;
    }
  },

  // Trigger OAuth popup for a specific business
  connect: function(bizKey) {
    return new Promise(function(resolve, reject) {
      if (!BL_CONFIG.googleClientId) {
        reject(new Error('Google Client ID not configured. Set it in config.js'));
        return;
      }
      if (!GoogleAuth._loaded) {
        reject(new Error('Google Identity Services not loaded yet'));
        return;
      }

      var biz = BL_CONFIG.businesses.find(function(b) { return b.key === bizKey; });
      var hint = biz ? biz.email : '';

      var client = google.accounts.oauth2.initTokenClient({
        client_id: BL_CONFIG.googleClientId,
        scope: GoogleAuth.SCOPES,
        hint: hint, // pre-select the business email
        callback: function(tokenResponse) {
          if (tokenResponse.error) {
            reject(new Error(tokenResponse.error));
            return;
          }
          var token = GoogleAuth.setToken(bizKey, tokenResponse);
          console.log('[GoogleAuth] Connected:', bizKey);

          // Fetch user email to confirm which account was connected
          GoogleAuth._fetchEmail(bizKey).then(function(email) {
            token.email = email;
            localStorage.setItem('bl-google-token-' + bizKey, JSON.stringify(token));
          });

          resolve(token);
        }
      });

      GoogleAuth._tokenClients[bizKey] = client;
      client.requestAccessToken();
    });
  },

  // Get fresh access token (re-prompts if expired)
  getAccessToken: async function(bizKey) {
    var token = GoogleAuth.getToken(bizKey);
    if (token && token.access_token) return token.access_token;

    // Token expired or missing — need re-auth
    // For now return null; user must reconnect via Settings
    return null;
  },

  // Helper: fetch authenticated user's email
  _fetchEmail: async function(bizKey) {
    var token = GoogleAuth.getToken(bizKey);
    if (!token) return null;
    try {
      var resp = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
        headers: { 'Authorization': 'Bearer ' + token.access_token }
      });
      var data = await resp.json();
      return data.emailAddress || null;
    } catch(e) {
      return null;
    }
  },

  // Make an authenticated Google API fetch
  apiFetch: async function(bizKey, url) {
    var accessToken = await GoogleAuth.getAccessToken(bizKey);
    if (!accessToken) return null;

    var resp = await fetch(url, {
      headers: { 'Authorization': 'Bearer ' + accessToken }
    });

    if (resp.status === 401) {
      // Token expired — clear it
      GoogleAuth.clearToken(bizKey);
      return null;
    }

    return await resp.json();
  }
};
