/**
 * Baseline — Google Calendar Channel
 * Fetches upcoming events via Calendar REST API
 */
var CalendarChannel = {
  BASE: 'https://www.googleapis.com/calendar/v3',

  isConnected: function(bizKey) {
    return GoogleAuth.isConnected(bizKey);
  },

  // Fetch upcoming events for next N days
  fetchUpcoming: async function(bizKey, days) {
    days = days || 7;
    var now = new Date();
    var timeMin = now.toISOString();
    var end = new Date(now.getTime() + days * 86400000);
    var timeMax = end.toISOString();

    var url = CalendarChannel.BASE + '/calendars/primary/events'
      + '?timeMin=' + encodeURIComponent(timeMin)
      + '&timeMax=' + encodeURIComponent(timeMax)
      + '&singleEvents=true'
      + '&orderBy=startTime'
      + '&maxResults=50';

    var data = await GoogleAuth.apiFetch(bizKey, url);
    if (!data || !data.items) return [];

    return data.items.map(function(evt) {
      var start = evt.start.dateTime || evt.start.date;
      var end = evt.end.dateTime || evt.end.date;
      var isAllDay = !evt.start.dateTime;

      return {
        id: evt.id,
        summary: evt.summary || '(no title)',
        description: evt.description || '',
        location: evt.location || '',
        start: start,
        end: end,
        isAllDay: isAllDay,
        status: evt.status,
        htmlLink: evt.htmlLink,
        attendees: (evt.attendees || []).length,
        organizer: evt.organizer ? (evt.organizer.displayName || evt.organizer.email) : ''
      };
    });
  },

  // Convert events to briefing items
  toBriefingItems: function(events, bizKey) {
    var now = new Date();
    var todayStr = now.toISOString().split('T')[0];

    return events.map(function(evt) {
      var evtDate = (evt.start || '').split('T')[0];
      var isToday = evtDate === todayStr;
      var priority = isToday ? 'medium' : 'low';

      // Format time
      var timeStr = '';
      if (!evt.isAllDay && evt.start) {
        var dt = new Date(evt.start);
        var h = dt.getHours();
        var m = dt.getMinutes();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        timeStr = h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
      } else {
        timeStr = 'All day';
      }

      return {
        id: 'cal-' + bizKey + '-' + evt.id,
        channel: 'calendar',
        business: bizKey,
        priority: priority,
        category: 'event',
        title: evt.summary,
        preview: timeStr + (evt.location ? ' \u2014 ' + evt.location : ''),
        timestamp: evt.start,
        icon: 'calendar',
        iconBg: '#4285f4',
        sourceRef: { type: 'calendar', id: evt.id, url: evt.htmlLink }
      };
    });
  }
};
