/**
 * Baseline — Gmail Channel
 * Fetches unread and recent emails via Gmail REST API
 */
var GmailChannel = {
  BASE: 'https://www.googleapis.com/gmail/v1/users/me',

  isConnected: function(bizKey) {
    return GoogleAuth.isConnected(bizKey);
  },

  // Fetch unread messages (summaries)
  fetchUnread: async function(bizKey, maxResults) {
    maxResults = maxResults || 20;
    var url = GmailChannel.BASE + '/messages?q=is:unread&maxResults=' + maxResults;
    var data = await GoogleAuth.apiFetch(bizKey, url);
    if (!data || !data.messages) return [];

    // Fetch headers for each message (batched)
    var messages = await GmailChannel._fetchHeaders(bizKey, data.messages.slice(0, maxResults));
    return messages;
  },

  // Fetch recent messages (last N days)
  fetchRecent: async function(bizKey, days, maxResults) {
    days = days || 3;
    maxResults = maxResults || 30;
    var after = Math.floor((Date.now() - days * 86400000) / 1000);
    var url = GmailChannel.BASE + '/messages?q=after:' + after + '&maxResults=' + maxResults;
    var data = await GoogleAuth.apiFetch(bizKey, url);
    if (!data || !data.messages) return [];

    var messages = await GmailChannel._fetchHeaders(bizKey, data.messages.slice(0, maxResults));
    return messages;
  },

  // Fetch full message detail
  getMessage: async function(bizKey, msgId) {
    var url = GmailChannel.BASE + '/messages/' + msgId + '?format=full';
    var data = await GoogleAuth.apiFetch(bizKey, url);
    if (!data) return null;

    var headers = GmailChannel._parseHeaders(data.payload ? data.payload.headers : []);
    var body = GmailChannel._extractBody(data.payload);

    return {
      id: data.id,
      threadId: data.threadId,
      from: headers.From || '',
      to: headers.To || '',
      subject: headers.Subject || '(no subject)',
      date: headers.Date || '',
      snippet: data.snippet || '',
      body: body,
      labelIds: data.labelIds || [],
      isUnread: (data.labelIds || []).indexOf('UNREAD') !== -1
    };
  },

  // Fetch headers for multiple messages in parallel
  _fetchHeaders: async function(bizKey, messageRefs) {
    var promises = messageRefs.map(function(ref) {
      var url = GmailChannel.BASE + '/messages/' + ref.id + '?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date';
      return GoogleAuth.apiFetch(bizKey, url);
    });

    var results = await Promise.all(promises);
    return results.filter(Boolean).map(function(msg) {
      var headers = GmailChannel._parseHeaders(msg.payload ? msg.payload.headers : []);
      return {
        id: msg.id,
        threadId: msg.threadId,
        from: GmailChannel._parseFrom(headers.From || ''),
        fromRaw: headers.From || '',
        subject: headers.Subject || '(no subject)',
        date: headers.Date || '',
        snippet: msg.snippet || '',
        labelIds: msg.labelIds || [],
        isUnread: (msg.labelIds || []).indexOf('UNREAD') !== -1,
        isImportant: (msg.labelIds || []).indexOf('IMPORTANT') !== -1,
        isPromo: (msg.labelIds || []).indexOf('CATEGORY_PROMOTIONS') !== -1,
        isUpdate: (msg.labelIds || []).indexOf('CATEGORY_UPDATES') !== -1
      };
    });
  },

  _parseHeaders: function(headers) {
    var map = {};
    (headers || []).forEach(function(h) { map[h.name] = h.value; });
    return map;
  },

  _parseFrom: function(from) {
    // "Doug Brown <doug@example.com>" → "Doug Brown"
    var match = from.match(/^"?([^"<]+)"?\s*</);
    if (match) return match[1].trim();
    // "doug@example.com" → "doug@example.com"
    return from.replace(/<[^>]+>/, '').trim() || from;
  },

  _extractBody: function(payload) {
    if (!payload) return '';
    // Simple text/plain extraction
    if (payload.body && payload.body.data) {
      return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }
    // Multipart — find text/plain or text/html
    if (payload.parts) {
      for (var i = 0; i < payload.parts.length; i++) {
        var part = payload.parts[i];
        if (part.mimeType === 'text/plain' && part.body && part.body.data) {
          return atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
        }
      }
      // Fallback to HTML
      for (var j = 0; j < payload.parts.length; j++) {
        var p2 = payload.parts[j];
        if (p2.mimeType === 'text/html' && p2.body && p2.body.data) {
          var html = atob(p2.body.data.replace(/-/g, '+').replace(/_/g, '/'));
          return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }
    }
    return '';
  },

  // Convert emails to briefing items
  toBriefingItems: function(messages, bizKey) {
    return messages.filter(function(m) {
      // Skip promos for briefing
      return !m.isPromo;
    }).map(function(msg) {
      var priority = 'medium';
      if (msg.isImportant) priority = 'high';
      if (msg.isPromo || msg.isUpdate) priority = 'low';
      // Check for urgent keywords in subject
      var subLower = (msg.subject || '').toLowerCase();
      if (subLower.indexOf('urgent') !== -1 || subLower.indexOf('asap') !== -1 || subLower.indexOf('emergency') !== -1) {
        priority = 'urgent';
      }

      return {
        id: 'gmail-' + bizKey + '-' + msg.id,
        channel: 'gmail',
        business: bizKey,
        priority: priority,
        category: 'email',
        title: msg.subject,
        preview: msg.from + ': ' + (msg.snippet || '').substring(0, 80),
        timestamp: msg.date ? new Date(msg.date).toISOString() : new Date().toISOString(),
        icon: 'mail',
        iconBg: '#ea4335',
        sourceRef: { type: 'gmail', id: msg.id, threadId: msg.threadId }
      };
    });
  }
};
