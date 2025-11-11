// frontend/stats.ts
// Typed conversion of frontend/stats.js
// Preserves functionality: populate stats and render Cal-Heatmap calendar.

// Cal-Heatmap from CDN — minimal typing so TS won't complain.
declare class CalHeatMap {
  init(opts: Record<string, any>): void;
}

type CalendarData = Record<string, number>;

// --- Dummy data functions (same values as original JS) ---
function getUsername(): string {
  return "User123";
}

function getTotalStatsCompleted(): number {
  return 120;
}

function getTotalStatsStarted(): number {
  return 150;
}

function getCurrentStreak(): string {
  return "7 Days 🔥";
}

function getHighestStreak(): string {
  return "15 Days 🔥";
}

function getTotalDaysCompleted(): number {
  return 45;
}

function getTotalTasksMissed(): number {
  return 15;
}

function getCurrentPoints(): string {
  return "830 pts ⭐";
}

// --- Populate DOM with stats (safe null checks) ---
function loadStats(): void {
  const usernameEl = document.getElementById("username");
  const totalCompletedEl = document.getElementById("total-stats-completed");
  const totalStartedEl = document.getElementById("total-stats-started");
  const currentStreakEl = document.getElementById("current-streak");
  const highestStreakEl = document.getElementById("highest-streak");
  const daysCompletedEl = document.getElementById("days-completed");
  const tasksMissedEl = document.getElementById("tasks-missed");
  const currentPointsEl = document.getElementById("current-points");

  if (usernameEl) usernameEl.textContent = getUsername();
  if (totalCompletedEl) totalCompletedEl.textContent = String(getTotalStatsCompleted());
  if (totalStartedEl) totalStartedEl.textContent = String(getTotalStatsStarted());
  if (currentStreakEl) currentStreakEl.textContent = getCurrentStreak();
  if (highestStreakEl) highestStreakEl.textContent = getHighestStreak();
  if (daysCompletedEl) daysCompletedEl.textContent = String(getTotalDaysCompleted());
  if (tasksMissedEl) tasksMissedEl.textContent = String(getTotalTasksMissed());
  if (currentPointsEl) currentPointsEl.textContent = getCurrentPoints();
}

// --- Dummy calendar data (same keys/values as original) ---
function getCalendarData(): CalendarData {
  return {
    "1741219200": 3, "1741305600": 2, "1741392000": 4, "1741478400": 1,
    "1741564800": 5, "1741651200": 2, "1741737600": 3, "1741824000": 4,
    "1741910400": 1, "1741996800": 5, "1742083200": 2, "1742169600": 3,
    "1742256000": 4, "1742342400": 1, "1742428800": 5
  };
}

// --- Initialize Cal-Heatmap calendar (safe guard for global) ---
function loadCalendarHeatmap(): void {
  // Check DOM target exists
  const mountEl = document.getElementById("cal-heatmap");
  if (!mountEl) {
    console.warn("Cal-heatmap mount element not found (#cal-heatmap). Skipping calendar render.");
    return;
  }

  // Make sure CalHeatMap is available on window (loaded via CDN in HTML)
  const globalAny = window as any;
  if (typeof globalAny.CalHeatMap !== "function") {
    console.warn("CalHeatMap library not found. Ensure CDN script is loaded in stats.html.");
    return;
  }

  const now = new Date();
  // start on first day of month 11 months ago (match original)
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  const cal = new globalAny.CalHeatMap() as CalHeatMap;
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

// --- Init on DOM ready ---
document.addEventListener("DOMContentLoaded", () => {
  loadStats();
  loadCalendarHeatmap();
});