/**
 * Baseline — Calendar Page (Phase 2)
 * Combined Google Calendar view for all businesses
 */
var CalendarPage = {
  render: function() {
    var el = document.getElementById('pageContent');

    // Show today's jobs from BM as a starting point
    var bmData = DB.getPipeline('tree');
    var todayJobs = (bmData && bmData.todayJobs) || [];

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

    // Today's jobs (from BM pipeline data)
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

    // Placeholder for Google Calendar
    html += '<div class="card">';
    html += '<div class="card-header"><div class="card-title"><i data-lucide="calendar-days"></i> Google Calendar</div></div>';
    html += '<div style="padding:32px;text-align:center;color:var(--text-muted);font-size:13px;">'
      + '<i data-lucide="plug-zap" style="width:32px;height:32px;margin-bottom:8px;opacity:.3;"></i>'
      + '<div>Connect Google Calendar in Settings to see your full schedule</div>'
      + '</div>';
    html += '</div>';

    el.innerHTML = html;
    if (window.lucide) lucide.createIcons();
  }
};
