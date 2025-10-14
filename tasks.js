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

  // Progress Bar
  function updateProgress() {
    const tasks = todayTasks.querySelectorAll(".task-item");
    const completed = todayTasks.querySelectorAll(".task-item[data-status='completed']");
    const percent = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${percent}% Complete`;
  }

  // Toggle Complete
  todayTasks.addEventListener("click", (e) => {
    if (e.target.classList.contains("complete-btn")) {
      const task = e.target.closest(".task-item");
      const isCompleted = task.dataset.status === "completed";

      if (isCompleted) {
        task.dataset.status = "pending";
        e.target.textContent = "Mark Complete";
        todayTasks.prepend(task);
      } else {
        task.dataset.status = "completed";
        e.target.textContent = "Undo";
        todayTasks.appendChild(task);
      }
      updateProgress();
    }
  });

  // Toggle Cancel
  tomorrowTasks.addEventListener("click", (e) => {
    if (e.target.classList.contains("cancel-btn")) {
      const task = e.target.closest(".task-item");
      const isCanceled = task.dataset.status === "canceled";

      if (isCanceled) {
        task.dataset.status = "pending";
        e.target.textContent = "Cancel";
        tomorrowTasks.prepend(task);
      } else {
        task.dataset.status = "canceled";
        e.target.textContent = "Undo";
        tomorrowTasks.appendChild(task);
      }
    }
  });

  // Open Sidebar
  addTaskButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      sidebar.style.display = "flex";
      document.getElementById("taskList").value = btn.dataset.list;
    });
  });

  // Close Sidebar
  closeBtn.addEventListener("click", () => {
    sidebar.style.display = "none";
  });

  // Add Task
  addTaskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("taskName").value.trim();
    const difficulty = document.getElementById("taskDifficulty").value;
    const list = document.getElementById("taskList").value;

    if (!name) return;

    const task = document.createElement("li");
    task.classList.add("task-item");
    task.dataset.status = "pending";
    task.innerHTML = `
      <div class="task-info">
        <span class="task-name">${name}</span>
        <span class="task-difficulty">${difficulty}</span>
      </div>
      <button class="${list === 'today' ? 'complete-btn' : 'cancel-btn'}">
        ${list === 'today' ? 'Mark Complete' : 'Cancel'}
      </button>
    `;

    if (list === "today") {
      todayTasks.appendChild(task);
      updateProgress();
    } else {
      tomorrowTasks.appendChild(task);
    }

    addTaskForm.reset();
    sidebar.style.display = "none";
  });

  // Countdown Timer (until 11:59:59 PM)
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
  updateProgress();
  updateCountdown();
});
