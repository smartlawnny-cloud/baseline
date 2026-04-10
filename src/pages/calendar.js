/**
 * Baseline — Calendar Page
 * Combined Google Calendar view for all businesses + today's BM jobs
 */
var CalendarPage = {
  render: async function() {
    var el = document.getElementById('pageContent');
    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:60px;"><div class="spinner"></div></div>';

    // Get BM jobs
    var bmData = DB.getPipeline('tree');
    var todayJobs = (bmData && bmData.todayJobs) || [];

    // Fetch calendar events
    var allEvents = [];
    var activeBizzes = BL_CONFIG.businesses.filter(function(b) { return !b.comingSoon; });
    for (var i = 0; i < activeBizzes.length; i++) {
      var biz = activeBizzes[i];
      if (CalendarChannel.isConnected(biz.key)) {
        try {
          var evts = await CalendarChannel.fetchUpcoming(biz.key, 7);
          evts.forEach(function(e) { e._bizKey = biz.key; e._bizColor = biz.color; e._bizName = biz.shortName; });
          allEvents = allEvents.concat(evts);
        } catch(e) { console.warn('[Calendar] Error:', biz.key, e); }
      }
    }

    // Sort by start time
    allEvents.sort(function(a, b) { return (a.start || '') > (b.start || '') ? 1 : -1; });

    // Group by date
    var grouped = {};
    allEvents.forEach(function(evt) {
      var dateKey = (evt.start || '').split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(evt);
    });

    var now = new Date();
    var dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    var html = '';

    // Today header
    html += '<div style="margin-bottom:24px;">';
    html += '<div style="font-size:20px;font-weight:700;letter-spacing:-.02em;">'
      + dayNames[now.getDay()] + ', ' + monthNames[now.getMonth()] + ' ' + now.getDate()
      + '</div>';
    html += '</div>';

    // Today's BM jobs
    if (todayJobs.length > 0) {
      html += '<div class="card" style="margin-bottom:16px;">';
      html += '<div class="card-header"><div class="card-title"><i data-lucide="tree-pine" style="color:#00836c;"></i> Today\'s Jobs</div></div>';
      todayJobs.forEach(function(job) {
        html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--border);">'
          + '<div style="width:4px;height:36px;border-radius:2px;background:#00836c;flex-shrink:0;"></div>'
          + '<div style="flex:1;">'
          + '<div style="font-size:14px;font-weight:500;">' + UI.esc(job.client_name || 'Job #' + job.job_number) + '</div>'
          + '<div style="font-size:12px;color:var(--text-light);">' + UI.esc(job.property || '') + '</div>'
          + '</div>'
          + '<div style="text-align:right;font-size:13px;">' + UI.money(job.total) + '</div>'
          + '</div>';
      });
      html += '</div>';
    }

    // Calendar events grouped by date
    if (Object.keys(grouped).length > 0) {
      var dates = Object.keys(grouped).sort();
      dates.forEach(function(dateKey) {
        var dt = new Date(dateKey + 'T12:00:00');
        var label = dayNames[dt.getDay()] + ', ' + monthNames[dt.getMonth()] + ' ' + dt.getDate();
        var todayStr = now.toISOString().split('T')[0];
        if (dateKey === todayStr) label = 'Today \u2014 ' + label;

        html += '<div class="card" style="margin-bottom:12px;">';
        html += '<div style="font-size:13px;font-weight:600;color:var(--text-light);margin-bottom:10px;">' + label + '</div>';

        grouped[dateKey].forEach(function(evt) {
          var timeStr = '';
          if (!evt.isAllDay && evt.start) {
            var d = new Date(evt.start);
            var h = d.getHours(), m = d.getMinutes();
            var ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            timeStr = h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
          } else {
            timeStr = 'All day';
          }

          html += '<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);">'
            + '<div style="width:4px;height:32px;border-radius:2px;background:' + (evt._bizColor || 'var(--primary)') + ';flex-shrink:0;"></div>'
            + '<div style="min-width:70px;font-size:12px;font-weight:500;color:var(--text-muted);">' + timeStr + '</div>'
            + '<div style="flex:1;">'
            + '<div style="font-size:14px;font-weight:500;">' + UI.esc(evt.summary) + '</div>'
            + (evt.location ? '<div style="font-size:12px;color:var(--text-light);">' + UI.esc(evt.location) + '</div>' : '')
            + '</div>'
            + UI.bizTag(evt._bizKey)
            + '</div>';
        });

        html += '</div>';
      });
    } else if (!CalendarChannel.isConnected('tree') && !CalendarChannel.isConnected('lawn')) {
      // Not connected
      html += '<div class="card">';
      html += '<div class="card-header"><div class="card-title"><i data-lucide="calendar-days"></i> Google Calendar</div></div>';
      html += '<div style="padding:32px;text-align:center;color:var(--text-muted);font-size:13px;">'
        + '<i data-lucide="plug-zap" style="width:32px;height:32px;margin-bottom:8px;opacity:.3;"></i>'
        + '<div>Connect Google Calendar in Settings to see your full schedule</div>'
        + '</div>';
      html += '</div>';
    } else {
      html += '<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:13px;">No upcoming events in the next 7 days</div>';
    }

    el.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }
};
