// stats.js

// dummy for now since we dont have a database yet
function getCurrentStreak() {
  return "7 Days 🔥";
}
function getTotalDaysCompleted() {
  return 45;
}
function getTotalTasksCompleted() {
  return 120;
}
function getTotalTasksMissed() {
  return 15;
}
function getCurrentPoints() {
  return "830 pts ⭐";
}

function loadStats() {
  document.getElementById("current-streak").textContent = getCurrentStreak();
  document.getElementById("days-completed").textContent = getTotalDaysCompleted();
  document.getElementById("tasks-completed").textContent = getTotalTasksCompleted();
  document.getElementById("tasks-missed").textContent = getTotalTasksMissed();
  document.getElementById("current-points").textContent = getCurrentPoints();
}

// Dummy calendar data for March 6–20, 2025
function getCalendarData() {
  return {
    1741219200: 3,  // Thu, 06 Mar 2025. // these dates are UTC, but calender renders them to est, need to find a fix
    1741305600: 2,  // Fri, 07 Mar 2025
    1741392000: 4,  // Sat, 08 Mar 2025
    1741478400: 1,  // Sun, 09 Mar 2025
    1741564800: 5,  // Mon, 10 Mar 2025
    1741651200: 2,  // Tue, 11 Mar 2025
    1741737600: 3,  // Wed, 12 Mar 2025
    1741824000: 4,  // Thu, 13 Mar 2025
    1741910400: 1,  // Fri, 14 Mar 2025
    1741996800: 5,  // Sat, 15 Mar 2025
    1742083200: 2,  // Sun, 16 Mar 2025
    1742169600: 3,  // Mon, 17 Mar 2025
    1742256000: 4,  // Tue, 18 Mar 2025
    1742342400: 1,  // Wed, 19 Mar 2025
    1742428800: 5   // Thu, 20 Mar 2025
  };
}




function loadCalendarHeatmap() {
  const now = new Date();
  // Start 11 months ago, first day of the month (UTC)
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  const cal = new CalHeatMap();
  cal.init({
    itemSelector: "#cal-heatmap",
    domain: "month",
    subDomain: "day",
    cellSize: 13,
    range: 12,               // last 12 months including current month
    domainGutter: 8,
    displayLegend: true,
    start: start,
    data: getCalendarData(),
    tooltip: true,
    legend: [1, 2, 3, 4, 5],
    legendColors: {
      min: "#ede9fe",
      max: "#7c3aed",
      empty: "#f3f4f6",
      colors: ["#ede9fe", "#c4b5fd", "#a78bfa", "#7c3aed"]
    },
    label: { position: "top" },
    domainLabelFormat: "%b '%y"
  });
}


// Initialize on DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  loadStats();          // existing stats loader
  loadCalendarHeatmap(); // corrected heatmap loader
});
