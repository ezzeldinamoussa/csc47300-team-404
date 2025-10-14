// Dummy data functions
function getUsername() {
  return "User123";
}

function getTotalStatsCompleted() {
  return 120;
}

function getTotalStatsStarted() {
  return 150;
}

function getCurrentStreak() {
  return "7 Days 🔥";
}

function getHighestStreak() {
  return "15 Days 🔥"; 
}

function getTotalDaysCompleted() {
  return 45;
}

function getTotalTasksMissed() {
  return 15;
}

function getCurrentPoints() {
  return "830 pts ⭐";
}

// Load all stats into HTML
function loadStats() {
  document.getElementById("username").textContent = getUsername();
  document.getElementById("total-stats-completed").textContent = getTotalStatsCompleted();
  document.getElementById("total-stats-started").textContent = getTotalStatsStarted();
  document.getElementById("current-streak").textContent = getCurrentStreak();
  document.getElementById("highest-streak").textContent = getHighestStreak(); // new line
  document.getElementById("days-completed").textContent = getTotalDaysCompleted();
  document.getElementById("tasks-missed").textContent = getTotalTasksMissed();
  document.getElementById("current-points").textContent = getCurrentPoints();
}

// Dummy calendar data
function getCalendarData() {
  return {
    1741219200: 3, 1741305600: 2, 1741392000: 4, 1741478400: 1,
    1741564800: 5, 1741651200: 2, 1741737600: 3, 1741824000: 4,
    1741910400: 1, 1741996800: 5, 1742083200: 2, 1742169600: 3,
    1742256000: 4, 1742342400: 1, 1742428800: 5
  };
}

// Load calendar
function loadCalendarHeatmap() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  const cal = new CalHeatMap();
  cal.init({
    itemSelector: "#cal-heatmap",
    domain: "month",
    subDomain: "day",
    cellSize: 13,
    range: 12,
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

// Init
document.addEventListener("DOMContentLoaded", () => {
  loadStats();
  loadCalendarHeatmap();
});
