const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
let todayList = document.getElementById("today-list");
let tomorrowList = document.getElementById("tomorrow-list");

// Buttons
const addTodayBtn = document.getElementById("add-today-btn");
const addTomorrowBtn = document.getElementById("add-tomorrow-btn");

// Modal
const modal = document.getElementById("add-task-modal");
const closeModal = document.getElementById("close-modal");
const addTaskForm = document.getElementById("add-task-form");

function updateProgress() {
  const todayTasks = todayList.querySelectorAll(".task-item");
  const completedTasks = todayList.querySelectorAll(".completed");
  const percent = todayTasks.length === 0 ? 0 : Math.round((completedTasks.length / todayTasks.length) * 100);
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${percent}% Complete`;
}

// Toggle Complete
todayList.addEventListener("click", e => {
  if (e.target.classList.contains("complete-btn")) {
    const task = e.target.closest(".task-item");
    task.classList.toggle("completed");
    task.parentElement.appendChild(task);
    updateProgress();
  }
});

// Toggle Cancel
tomorrowList.addEventListener("click", e => {
  if (e.target.classList.contains("cancel-btn")) {
    const task = e.target.closest(".task-item");
    task.classList.toggle("canceled");
    task.parentElement.appendChild(task);
  }
});

// Open modal
addTodayBtn.addEventListener("click", () => {
  modal.style.display = "block";
  document.getElementById("task-day").value = "today";
});

addTomorrowBtn.addEventListener("click", () => {
  modal.style.display = "block";
  document.getElementById("task-day").value = "tomorrow";
});

// Close modal
closeModal.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});

// Add new task
addTaskForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("task-name").value.trim();
  const difficulty = document.getElementById("task-difficulty").value;
  const day = document.getElementById("task-day").value;

  if (name === "") return;

  const newTask = document.createElement("li");
  newTask.classList.add("task-item");
  newTask.innerHTML = `
    <div class="task-info">
      <strong>${name}</strong>
      <span>Difficulty: ${difficulty}</span>
    </div>
    <div class="task-actions">
      <button class="${day === "today" ? "complete-btn" : "cancel-btn"}">
        ${day === "today" ? "Mark Complete" : "Cancel"}
      </button>
    </div>
  `;

  if (day === "today") {
    todayList.appendChild(newTask);
    updateProgress();
  } else {
    tomorrowList.appendChild(newTask);
  }

  addTaskForm.reset();
  modal.style.display = "none";
});

updateProgress();
