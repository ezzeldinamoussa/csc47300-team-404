document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("history-container");

  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  async function fetchAllTasks() {
    const response = await fetch(
      `http://localhost:5000/api/dailyrecords/getAllTasks`,
      {
        method: "GET",
        headers,
      }
    );
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    return await response.json();
  }
  const tasks = await fetchAllTasks();
  
  // Fake task data
  const historyData = {
    2025: {
      October: {
        "Monday - 10/13/2025": [
          {
            name: "Finish proposal",
            difficulty: "Medium",
            status: "completed",
          },
          { name: "Clean workspace", difficulty: "Easy", status: "missed" },
        ],
        "Sunday - 10/12/2025": [
          { name: "Read 20 pages", difficulty: "Easy", status: "completed" },
          { name: "Workout", difficulty: "Hard", status: "missed" },
        ],
      },
      September: {
        "Friday - 9/26/2025": [
          { name: "Team meeting", difficulty: "Medium", status: "completed" },
          { name: "Send report", difficulty: "Easy", status: "completed" },
        ],
      },
    },
    2024: {
      November: {
        "Tuesday - 11/12/2024": [
          {
            name: "Finish project notes",
            difficulty: "Medium",
            status: "completed",
          },
          { name: "Exercise", difficulty: "Easy", status: "missed" },
        ],
      },
    },
  };

  function createAccordion(title, contentGenerator) {
    const accordion = document.createElement("div");
    accordion.classList.add("accordion");

    const header = document.createElement("div");
    header.classList.add("accordion-header");
    header.textContent = title;

    const arrow = document.createElement("span");
    arrow.textContent = "▼";
    header.appendChild(arrow);

    const content = document.createElement("div");
    content.classList.add("accordion-content");

    header.addEventListener("click", () => {
      accordion.classList.toggle("open");
      arrow.textContent = accordion.classList.contains("open") ? "▲" : "▼";
    });

    content.appendChild(contentGenerator());
    accordion.appendChild(header);
    accordion.appendChild(content);
    return accordion;
  }

  function generateTaskList(tasks) {
    const list = document.createElement("div");
    list.classList.add("task-list");

    tasks
      .sort((a, b) => (a.completed === "true" ? 1 : -1)) // completed first
      .forEach((task) => {
        const item = document.createElement("div");
        item.classList.add("task-item-history");
        item.dataset.status = task.completed ? 'completed' : 'missed';

        item.innerHTML = `
          <span>${task.title}</span>
          <span class="task-difficulty">${task.difficulty} — ${task.completed === "true" ? "completed" : "missed"}</span>
        `;

        list.appendChild(item);
      });

    return list;
  }

  function generateDays(days) {
    const wrapper = document.createElement("div");

    Object.entries(days).forEach(([day, tasks]) => {
      const dayDiv = document.createElement("div");
      dayDiv.classList.add("task-day");

      const completion = Math.round(
        (tasks.filter((t) => t.status === "completed").length / tasks.length) *
          100
      );

      dayDiv.textContent = `${day} — ${completion}% complete`;

      const taskList = generateTaskList(tasks);
      dayDiv.addEventListener("click", () => {
        taskList.classList.toggle("show");
      });

      wrapper.appendChild(dayDiv);
      wrapper.appendChild(taskList);
    });

    return wrapper;
  }

  function generateMonths(months) {
    const wrapper = document.createElement("div");
    Object.entries(months).forEach(([month, days]) => {
      wrapper.appendChild(createAccordion(month, () => generateDays(days)));
    });
    return wrapper;
  }

  const sortedTasks = {};
  console.log("tasks", tasks);

  tasks.forEach((value) => {
    const date = new Date(value.date);
    const year = date.getFullYear();
    const monthName = date.toLocaleString('default', {month : 'long'});

    if (!sortedTasks[year]) {
      sortedTasks[year] = {};
    } 
    if (!sortedTasks[year][monthName]){
      sortedTasks[year][monthName] = {};
    }
    if (!sortedTasks[year][monthName][value.date]){
      sortedTasks[year][monthName][value.date] = value.tasks || [];
    }
  });

  // Build full accordion hierarchy
  Object.entries(sortedTasks)
    .sort(([a], [b]) => b - a) // newest year first
    .forEach(([year, months]) => {
      container.appendChild(
        createAccordion(year, () => generateMonths(months))
      );
    });
});
