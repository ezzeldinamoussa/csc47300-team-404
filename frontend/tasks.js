/* frontend/tasks.js
   - Auth-aware: reads token from localStorage
   - Loads today's and tomorrow's DailyRecord (creates them if missing)
   - Persists changes with PATCH to /api/dailyrecords/:id
   - Keeps UI behavior identical to previous version
*/

document.addEventListener("DOMContentLoaded", () => {
  const todayTasks = document.getElementById("today-tasks");
  const tomorrowTasks = document.getElementById("tomorrow-tasks");
  const progressFill = document.querySelector(".progress-fill");
  const progressText = document.querySelector(".progress-text");

  const sidebar = document.getElementById("addTaskSidebar");
  const closeBtn = document.querySelector(".close-btn");
  const addTaskButtons = document.querySelectorAll(".add-task-btn");
  const addTaskForm = document.getElementById("addTaskForm");

  const countdownEl = document.getElementById("countdown");

  // Page state
  let todayRecord = null;      // will hold the record object from backend (including _id)
  let tomorrowRecord = null;
  const token = localStorage.getItem("token");

  // Redirect to login if no token
  if (!token) {
    console.warn("No auth token found — redirecting to login.");
    window.location.href = "login.html";
    return;
  }

  // =========================
  // Helpers
  // =========================
  function isoDateToday(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
  }

  function headers() {
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    };
  }

  function clearList(listEl) {
    while (listEl.firstChild) listEl.removeChild(listEl.firstChild);
  }

  function createTaskElement({ title, difficulty = "Medium", completed = false }, listType) {
    const li = document.createElement("li");
    li.classList.add("task-item");
    li.dataset.status = completed ? "completed" : "pending";

    li.innerHTML = `
      <div class="task-info">
        <span class="task-name">${escapeHtml(title)}</span>
        <span class="task-difficulty">${escapeHtml(difficulty)}</span>
      </div>
      <button class="${listType === 'today' ? 'complete-btn' : 'cancel-btn'}">
        ${listType === 'today' ? (completed ? 'Undo' : 'Mark Complete') : (completed ? 'Undo' : 'Cancel')}
      </button>
    `;
    return li;
  }

  // Basic HTML escape
  function escapeHtml(unsafe) {
    return String(unsafe || "").replace(/[&<>"'`=\/]/g, function (s) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
      })[s];
    });
  }

  // =========================
  // API interactions
  // =========================
  async function fetchRecordsByDate(date) {
    const url = `${API_BASE}/api/dailyrecords?date=${encodeURIComponent(date)}`;
    const res = await fetch(url, { headers: headers(), cache: "no-store" });
    if (!res.ok) throw new Error(`GET ${url} returned ${res.status}`);
    const data = await res.json();
    // expecting an array of records; return first one (or undefined)
    if (Array.isArray(data)) return data[0];
    // if backend returns single object
    if (data && typeof data === 'object') return data;
    return undefined;
  }

  async function createRecordForDate(date) {
    const url = `${API_BASE}/api/dailyrecords`;
    const res = await fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ date })
    });
    if (!res.ok) throw new Error(`POST ${url} returned ${res.status}`);
    const created = await res.json();
    return created;
  }

  async function patchRecord(recordId, patchBody) {
    const url = `${API_BASE}/api/dailyrecords/${recordId}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(patchBody)
    });
    if (!res.ok) {
      // Try to fetch the error body for better debugging
      let errorText = `${res.status}`;
      try { const e = await res.json(); errorText = e.msg || JSON.stringify(e); } catch(_) {}
      throw new Error(`PATCH ${url} failed: ${errorText}`);
    }
    return await res.json();
  }

  // =========================
  // Rendering & state sync
  // =========================
  function renderTasksFromRecord(record, listEl, listType) {
    if (!record || !Array.isArray(record.tasks)) return;
    clearList(listEl);
    record.tasks.forEach(t => {
      const difficulty = t.difficulty || inferDifficultyFromTitle(t.title) || 'Medium';
      const li = createTaskElement({ title: t.title, difficulty, completed: !!t.completed }, listType);
      listEl.appendChild(li);
    });
  }

  function inferDifficultyFromTitle(title) {
    const t = String(title || '').toLowerCase();
    if (t.includes('workout') || t.includes('project')) return 'Hard';
    if (t.includes('read') || t.includes('plan')) return 'Easy';
    return 'Medium';
  }

  // Update DB with the local record.tasks for a given record object
  async function saveRecordTasks(record) {
    if (!record || !record._id) {
      console.warn("No record id to save.");
      return;
    }
    try {
      // Send the entire tasks array. Backend should compute derived fields if needed.
      const patch = { tasks: record.tasks };
      const updated = await patchRecord(record._id, patch);
      // update local reference
      if (updated) {
        record.tasks = updated.tasks || record.tasks;
      }
    } catch (err) {
      console.error("Failed to save record:", err);
      // Keep UI updated locally, but inform user if desired (e.g. toast)
    }
  }

  // When toggling a task: update page state and call saveRecordTasks
  function toggleTaskState(taskEl, listType) {
    const isToday = listType === 'today';
    const record = isToday ? todayRecord : tomorrowRecord;
    if (!record) return;

    const title = taskEl.querySelector(".task-name")?.textContent || "";
    const status = taskEl.dataset.status;
    const completedNow = status !== "completed";
    taskEl.dataset.status = completedNow ? "completed" : "pending";
    const btn = taskEl.querySelector("button");
    if (btn) btn.textContent = completedNow ? "Undo" : "Mark Complete";

    // Update corresponding task in record.tasks (match by title)
    const idx = record.tasks.findIndex(t => t.title === title);
    if (idx !== -1) {
      record.tasks[idx].completed = completedNow;
    } else {
      // If we couldn't match by title (rare), push a new task
      record.tasks.push({ title, completed: completedNow });
    }

    updateProgress();
    // persist
    saveRecordTasks(record);
  }

  // When canceling a tomorrow task (toggle canceled)
  function toggleTomorrowCancel(taskEl) {
    const record = tomorrowRecord;
    if (!record) return;

    const title = taskEl.querySelector(".task-name")?.textContent || "";
    const isCanceled = taskEl.dataset.status === "canceled";

    if (isCanceled) {
      taskEl.dataset.status = "pending";
      taskEl.querySelector("button").textContent = "Cancel";
    } else {
      taskEl.dataset.status = "canceled";
      taskEl.querySelector("button").textContent = "Undo";
    }

    // We'll store canceled as completed = false and maybe add a flag; schema does not have canceled,
    // so we treat canceled tasks as completed=false and leave the status in UI only.
    const idx = record.tasks.findIndex(t => t.title === title);
    if (idx !== -1) {
      record.tasks[idx].completed = false;
    } else {
      record.tasks.push({ title, completed: false });
    }

    // persist
    saveRecordTasks(record);
  }

  // Update the progress bar based on todayTask items
  function updateProgress() {
    const tasks = todayTasks.querySelectorAll(".task-item");
    const completed = todayTasks.querySelectorAll(".task-item[data-status='completed']");
    const percent = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;
    progressFill.style.width = isNaN(percent) ? "0%" : `${percent}%`;
    progressText.textContent = `${percent}% Complete`;
  }

  // =========================
  // Difficulty bars rendering (same as before)
  // =========================
  function renderDifficultyBars() {
    document.querySelectorAll(".task-difficulty").forEach(span => {
      let difficulty = span.dataset.difficulty || span.textContent.trim().toLowerCase();
      span.dataset.difficulty = difficulty;
      const levels = { easy: 1, medium: 2, hard: 3 }[difficulty] || 0;
      span.textContent = "";
      const barsContainer = document.createElement("div");
      barsContainer.classList.add("difficulty-bars");
      for (let i = 1; i <= 3; i++) {
        const bar = document.createElement("div");
        bar.classList.add("difficulty-bar");
        if (i <= levels) bar.classList.add("filled");
        barsContainer.appendChild(bar);
      }
      span.appendChild(barsContainer);
    });
  }

  // =========================
  // Event delegation: Complete / Cancel / Add Task
  // =========================
  todayTasks.addEventListener("click", (e) => {
    if (e.target.classList.contains("complete-btn")) {
      const task = e.target.closest(".task-item");
      toggleTaskState(task, 'today');
    }
  });

  tomorrowTasks.addEventListener("click", (e) => {
    if (e.target.classList.contains("cancel-btn")) {
      const task = e.target.closest(".task-item");
      toggleTomorrowCancel(task);
    }
  });

  addTaskButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      sidebar.style.display = "flex";
      document.getElementById("taskList").value = btn.dataset.list;
    });
  });

  closeBtn.addEventListener("click", () => {
    sidebar.style.display = "none";
  });

  addTaskForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("taskName").value.trim();
    const difficulty = document.getElementById("taskDifficulty").value;
    const list = document.getElementById("taskList").value;

    if (!name) return;

    const taskObj = { title: name, description: "", completed: false, difficulty };

    if (list === "today") {
      // append locally and to record
      if (!todayRecord) {
        // create record if somehow missing
        try {
          todayRecord = await createRecordForDate(isoDateToday(0));
          todayRecord.tasks = todayRecord.tasks || [];
        } catch (err) {
          console.error("Failed to create today's record:", err);
        }
      }
      todayRecord.tasks.push(taskObj);
      renderTasksFromRecord(todayRecord, todayTasks, 'today');
      updateProgress();
      saveRecordTasks(todayRecord);
    } else {
      if (!tomorrowRecord) {
        try {
          tomorrowRecord = await createRecordForDate(isoDateToday(1));
          tomorrowRecord.tasks = tomorrowRecord.tasks || [];
        } catch (err) {
          console.error("Failed to create tomorrow's record:", err);
        }
      }
      tomorrowRecord.tasks.push(taskObj);
      renderTasksFromRecord(tomorrowRecord, tomorrowTasks, 'tomorrow');
      saveRecordTasks(tomorrowRecord);
    }

    renderDifficultyBars();
    addTaskForm.reset();
    sidebar.style.display = "none";
  });

  // =========================
  // Countdown Timer (until 11:59:59 PM)
  // =========================
  function updateCountdown() {
    const now = new Date();
    const target = new Date();
    target.setHours(23, 59, 59, 999);

    const diff = target - now;
    if (diff <= 0) {
      countdownEl.textContent = "00:00:00";
      return;
    }

    const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
    const minutes = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
    const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");

    countdownEl.textContent = `${hours}:${minutes}:${seconds}`;
  }

  setInterval(updateCountdown, 1000);
  updateCountdown();

  // =========================
  // Boot sequence: load today's and tomorrow's record (create if missing)
  // =========================
  async function boot() {
    const todayStr = isoDateToday(0);
    const tomorrowStr = isoDateToday(1);

    try {
      // load today
      let recToday = await fetchRecordsByDate(todayStr);
      if (!recToday) {
        // create
        recToday = await createRecordForDate(todayStr);
      }
      todayRecord = recToday || { tasks: [] };

      // load tomorrow
      let recTomorrow = await fetchRecordsByDate(tomorrowStr);
      if (!recTomorrow) {
        recTomorrow = await createRecordForDate(tomorrowStr);
      }
      tomorrowRecord = recTomorrow || { tasks: [] };

      // Render from DB (if tasks exist), otherwise keep fallback static items
      if (todayRecord && Array.isArray(todayRecord.tasks) && todayRecord.tasks.length) {
        renderTasksFromRecord(todayRecord, todayTasks, 'today');
      }
      if (tomorrowRecord && Array.isArray(tomorrowRecord.tasks) && tomorrowRecord.tasks.length) {
        renderTasksFromRecord(tomorrowRecord, tomorrowTasks, 'tomorrow');
      }

      renderDifficultyBars();
      updateProgress();
    } catch (err) {
      console.error("Error during boot loading records:", err);
      // fallback: leave static DOM in place
      renderDifficultyBars();
      updateProgress();
    }
  }

  // Start
  boot();
});
