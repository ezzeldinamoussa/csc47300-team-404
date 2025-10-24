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

  const token = localStorage.getItem("token");
  if (!token) { window.location.href = "login.html"; return; }

  const headers = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  });

  function parseJwt(token) {
    try { return JSON.parse(atob(token.split('.')[1])); }
    catch { return null; }
  }
  const userId = parseJwt(token)?.user?.id;

  function isoDateToday(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split("T")[0];
  }

  function clearList(listEl) { while(listEl.firstChild) listEl.removeChild(listEl.firstChild); }

  function createTaskElement(task, listType) {
    const li = document.createElement("li");
    li.classList.add("task-item");
    li.dataset.status = task.completed ? "completed" : "pending";
    li.dataset.taskId = task._id;

    // Fix difficulty fallback
    const difficulty = task.difficulty || "Medium";

    // Map difficulty to number of bars
    const levelMap = { Easy: 1, Medium: 2, Hard: 3 };
    const filledCount = levelMap[difficulty] || 2;

    let barsHTML = '<div class="difficulty-bars">';
    for (let i = 1; i <= 3; i++) {
      barsHTML += `<div class="difficulty-bar${i <= filledCount ? ' filled' : ''}"></div>`;
    }
    barsHTML += '</div>';

    li.innerHTML = `
      <div class="task-info" style="display:flex; align-items:center; gap:8px;">
        <span class="task-name" style="flex:1; text-align:left;">${task.title}</span>
        <span class="task-difficulty">${barsHTML}</span>
      </div>
      <button class="${listType==='today'?'complete-btn':'cancel-btn'}">
        ${task.completed ? 'Undo' : (listType==='today'?'Mark Complete':'Cancel')}
      </button>
    `;
    return li;
  }

  async function fetchTasksByDate(date) {
    const res = await fetch(`${API_BASE}/api/dailyrecords/getTasks?date=${date}`, { headers: headers() });
    if (!res.ok) throw new Error(`GET failed: ${res.status}`);
    return await res.json();
  }

  async function addTaskToBackend(date, title, difficulty) {
    const res = await fetch(`${API_BASE}/api/dailyrecords/addTask`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ date, title, difficulty })
    });
    if (!res.ok) throw new Error(`POST failed: ${res.status}`);
    return await res.json();
  }

  async function updateTaskBackend(date, taskId, completed) {
    const res = await fetch(`${API_BASE}/api/dailyrecords/updateTask`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify({ date, taskId, completed })
    });
    if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
    return await res.json();
  }

  async function deleteTaskBackend(date, taskId) {
    const res = await fetch(`${API_BASE}/api/dailyrecords/deleteTask`, {
      method: "DELETE",
      headers: headers(),
      body: JSON.stringify({ date, taskId })
    });
    if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
    return await res.json();
  }

  function renderTasksFromRecord(tasks, listEl, listType) {
    clearList(listEl);
    tasks.forEach(t => {
      if (!t._id) return;
      const li = createTaskElement(t, listType);
      listEl.appendChild(li);
    });
  }

  function updateProgress() {
    const tasks = todayTasks.querySelectorAll(".task-item");
    const completed = todayTasks.querySelectorAll(".task-item[data-status='completed']");
    const pct = tasks.length ? Math.round(completed.length / tasks.length * 100) : 0;
    progressFill.style.width = `${pct}%`;
    progressText.textContent = `${pct}% Complete`;
  }

  async function toggleTaskState(taskEl, listType, date) {
    const taskId = taskEl.dataset.taskId;
    if (!taskId) return;

    if (listType === "tomorrow" && !taskEl.dataset.status) return;

    const completedNow = taskEl.dataset.status !== 'completed';
    try {
      await updateTaskBackend(date, taskId, completedNow);
      taskEl.dataset.status = completedNow ? "completed" : "pending";
      const btn = taskEl.querySelector("button.complete-btn, button.cancel-btn");
      if (btn) btn.textContent = completedNow ? "Undo" : (listType==='today'?"Mark Complete":"Cancel");
      updateProgress();
    } catch(err) { console.error("Failed to toggle task:", err); }
  }

  async function handleCancelTask(taskEl, date) {
    const taskId = taskEl.dataset.taskId;
    if (!taskId) return;
    try {
      await deleteTaskBackend(date, taskId);
      taskEl.remove();
    } catch(err) { console.error("Failed to delete task:", err); }
  }

  todayTasks.addEventListener("click", e => {
    const taskEl = e.target.closest(".task-item");
    if (!taskEl) return;
    const date = isoDateToday(0);
    if (e.target.classList.contains("complete-btn")) toggleTaskState(taskEl, 'today', date);
  });

  tomorrowTasks.addEventListener("click", e => {
    const taskEl = e.target.closest(".task-item");
    if (!taskEl) return;
    const date = isoDateToday(1);
    if (e.target.classList.contains("cancel-btn")) handleCancelTask(taskEl, date);
  });

  addTaskButtons.forEach(btn => btn.addEventListener("click", () => {
    sidebar.style.display = "flex";
    document.getElementById("taskList").value = btn.dataset.list;
  }));

  closeBtn.addEventListener("click", () => { sidebar.style.display="none"; });

  addTaskForm.addEventListener("submit", async e => {
    e.preventDefault();
    const name = document.getElementById("taskName").value.trim();
    const difficulty = document.getElementById("taskDifficulty").value;
    const list = document.getElementById("taskList").value;
    if (!name) return;

    const date = list === 'today' ? isoDateToday(0) : isoDateToday(1);

    try {
      const newRecord = await addTaskToBackend(date, name, difficulty);
      const tasks = newRecord.tasks || [];
      if (list === 'today') renderTasksFromRecord(tasks, todayTasks, 'today');
      else renderTasksFromRecord(tasks, tomorrowTasks, 'tomorrow');
      updateProgress();
      addTaskForm.reset();
      sidebar.style.display = "none";
    } catch(err) {
      console.error("Failed to add task:", err);
    }
  });

  function updateCountdown() {
    const now = new Date();
    const target = new Date(); target.setHours(23,59,59,999);
    const diff = target - now;
    if(diff <= 0){ countdownEl.textContent="00:00:00"; return; }
    const h = String(Math.floor(diff/3600000)).padStart(2,"0");
    const m = String(Math.floor((diff/60000)%60)).padStart(2,"0");
    const s = String(Math.floor((diff/1000)%60)).padStart(2,"0");
    countdownEl.textContent = `${h}:${m}:${s}`;
  }
  setInterval(updateCountdown,1000); updateCountdown();

  async function boot() {
    try {
      const todayTasksData = await fetchTasksByDate(isoDateToday(0));
      renderTasksFromRecord(todayTasksData, todayTasks, 'today');
      const tomorrowTasksData = await fetchTasksByDate(isoDateToday(1));
      renderTasksFromRecord(tomorrowTasksData, tomorrowTasks, 'tomorrow');
      updateProgress();
    } catch(err){ console.error("Error booting tasks:", err); }
  }

  boot();
});
