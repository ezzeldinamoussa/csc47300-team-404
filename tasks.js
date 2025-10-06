// Track progress and update the bar
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const todayTasks = document.querySelectorAll("#today-list .task-item");
const completeButtons = document.querySelectorAll(".complete-btn");
const cancelButtons = document.querySelectorAll(".cancel-btn");

let completedCount = 0;
const totalTasks = todayTasks.length;

function updateProgress() {
  const percent = Math.round((completedCount / totalTasks) * 100);
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${percent}% Complete`;
}

// Handle task completion
completeButtons.forEach(button => {
  button.addEventListener("click", () => {
    const task = button.closest(".task-item");
    if (!task.classList.contains("completed")) {
      task.classList.add("completed");
      task.parentElement.appendChild(task); // move to bottom
      completedCount++;
      updateProgress();
    }
  });
});

// Handle tomorrow task canceling
cancelButtons.forEach(button => {
  button.addEventListener("click", () => {
    const task = button.closest(".task-item");
    if (!task.classList.contains("canceled")) {
      task.classList.add("canceled");
      task.parentElement.appendChild(task); // move to bottom
    }
  });
});

updateProgress();
