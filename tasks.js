document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const todayTasks = document.getElementById("today-tasks");
  const tomorrowTasks = document.getElementById("tomorrow-tasks");
  const progressFill = document.querySelector(".progress-fill");
  const progressText = document.querySelector(".progress-text");

  const modal = document.getElementById("addTaskModal");
  const closeBtn = document.querySelector(".close-btn");
  const addTaskButtons = document.querySelectorAll(".add-task-btn");
  const addTaskForm = document.getElementById("addTaskForm");

  // Update progress bar
  function updateProgress() {
    const tasks = todayTasks.querySelectorAll(".task-item");
    const completed = todayTasks.querySelectorAll(".task-item[data-status='completed']");
    const percent = tasks.length ? Math.round((completed.length / tasks.length) * 100) : 0;
    progressFill.style.width = `${percent}%`;
    progressText.textContent = `${percent}% Complete`;
  }

  // Toggle completion for today's tasks
  todayTasks.addEventListener("click", (e) => {
    if (e.target.classList.contains("complete-btn")) {
      const task = e.target.closest(".task-item");
      const isCompleted = task.dataset.status === "completed";

      if (isCompleted) {
        task.dataset.status = "pending";
        e.target.textContent = "Mark Complete";
        task.classList.remove("completed");
        todayTasks.prepend(task); // move back to top
      } else {
        task.dataset.status = "completed";
        e.target.textContent = "Undo";
        task.classList.add("completed");
        todayTasks.appendChild(task); // move to bottom
      }

      updateProgress();
    }
  });

  // Toggle cancel for tomorrow's tasks
  tomorrowTasks.addEventListener("click", (e) => {
    if (e.target.classList.contains("cancel-btn")) {
      const task = e.target.closest(".task-item");
      const isCanceled = task.dataset.status === "canceled";

      if (isCanceled) {
        task.dataset.status = "pending";
        e.target.textContent = "Cancel";
        task.classList.remove("canceled");
        tomorrowTasks.prepend(task);
      } else {
        task.dataset.status = "canceled";
        e.target.textContent = "Undo";
        task.classList.add("canceled");
        tomorrowTasks.appendChild(task);
      }
    }
  });

  // Open modal
  addTaskButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      modal.style.display = "flex";
      document.getElementById("taskList").value = btn.dataset.list;
    });
  });

  // Close modal
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  // Add task form submission
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
    modal.style.display = "none";
  });

  // Initial progress update
  updateProgress();
});
