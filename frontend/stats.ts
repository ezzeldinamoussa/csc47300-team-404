// frontend/stats.ts
// Fetches real user statistics from backend API and renders Cal-Heatmap calendar.

// Cal-Heatmap from CDN — minimal typing so TS won't complain.
declare class CalHeatMap {
  init(opts: Record<string, any>): void;
}

type CalendarData = Record<string, number>;

// API response interface
interface StatsResponse {
  username: string;
  total_tasks_completed: number;
  total_tasks_started: number;
  tasks_missed: number;
  total_points: number;
  calendar_heatmap_data: CalendarData;
}

// Import API configuration
import { API_BASE } from './config.js';

// --- Fetch user stats from API ---
async function fetchUserStats(): Promise<StatsResponse> {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(`${API_BASE}/api/stats`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = "login.html";
      throw new Error("Unauthorized - redirecting to login");
    }
    throw new Error(`Failed to fetch stats: ${response.status}`);
  }

  return await response.json();
}

// --- Populate DOM with stats (safe null checks) ---
async function loadStats(): Promise<void> {
  try {
    const stats = await fetchUserStats();

    const usernameEl = document.getElementById("username");
    const totalCompletedEl = document.getElementById("total-stats-completed");
    const totalStartedEl = document.getElementById("total-stats-started");
    const currentStreakEl = document.getElementById("current-streak");
    const highestStreakEl = document.getElementById("highest-streak");
    const daysCompletedEl = document.getElementById("days-completed");
    const tasksMissedEl = document.getElementById("tasks-missed");
    const currentPointsEl = document.getElementById("current-points");

    if (usernameEl) usernameEl.textContent = stats.username;
    if (totalCompletedEl) totalCompletedEl.textContent = String(stats.total_tasks_completed);
    if (totalStartedEl) totalStartedEl.textContent = String(stats.total_tasks_started);
    
    // Streak fields - not available yet, show placeholder
    if (currentStreakEl) currentStreakEl.textContent = "0 Days 🔥";
    if (highestStreakEl) highestStreakEl.textContent = "0 Days 🔥";
    
    // Days completed - count dates with tasks in calendar data
    const daysCompleted = Object.keys(stats.calendar_heatmap_data).length;
    if (daysCompletedEl) daysCompletedEl.textContent = String(daysCompleted);
    
    if (tasksMissedEl) tasksMissedEl.textContent = String(stats.tasks_missed);
    if (currentPointsEl) currentPointsEl.textContent = `${stats.total_points} pts ⭐`;
  } catch (error) {
    console.error("Error loading stats:", error);
    // Show error message to user
    const usernameEl = document.getElementById("username");
    if (usernameEl) usernameEl.textContent = "Error loading stats";
    
    // Set all stats to error state
    const statElements = [
      "total-stats-completed",
      "total-stats-started",
      "current-streak",
      "highest-streak",
      "days-completed",
      "tasks-missed",
      "current-points"
    ];
    
    statElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = "Error";
    });
  }
}

// --- Fetch calendar data from API ---
async function getCalendarData(): Promise<CalendarData> {
  try {
    const stats = await fetchUserStats();
    return stats.calendar_heatmap_data || {};
  } catch (error) {
    console.error("Error fetching calendar data:", error);
    return {};
  }
}

// --- Initialize Cal-Heatmap calendar (safe guard for global) ---
async function loadCalendarHeatmap(): Promise<void> {
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

  try {
    // Fetch calendar data from API
    const calendarData = await getCalendarData();

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
      data: calendarData,
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
  } catch (error) {
    console.error("Error loading calendar heatmap:", error);
  }
}

// --- Check authentication and init on DOM ready ---
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is authenticated
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // Load stats and calendar
  loadStats();
  loadCalendarHeatmap();
});