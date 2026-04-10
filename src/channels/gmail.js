/**
 * Baseline — Gmail Channel (Phase 2)
 * Placeholder until Google OAuth is configured
 */
var GmailChannel = {
  connected: false,

  isConnected: function(bizKey) { return false; },

  fetchUnread: async function(bizKey) {
    // Phase 2: Google OAuth + gapi integration
    return [];
  },

  toBriefingItems: function(messages, bizKey) {
    return [];
  }
};
