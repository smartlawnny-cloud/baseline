/**
 * Baseline — Google Calendar Channel (Phase 2)
 * Placeholder until Google OAuth is configured
 */
var CalendarChannel = {
  connected: false,

  isConnected: function(bizKey) { return false; },

  fetchUpcoming: async function(bizKey, days) {
    // Phase 2: Google Calendar API integration
    return [];
  },

  toBriefingItems: function(events, bizKey) {
    return [];
  }
};
