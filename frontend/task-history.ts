interface Task {
  _id?: string;
  title: string;
  difficulty?: "Easy" | "Medium" | "Hard" | string;
  completed?: boolean;
}

interface DailyRecord {
  _id: string;
  user_id: string;
  date: string;
  tasks: Task[];
  total_tasks?: number;
  completed_tasks?: number;
  completion_rate?: number;
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("history-container") as HTMLElement;
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // Fetch all daily records for the logged-in user
  async function fetchAllTasks(): Promise<DailyRecord[]> {
    const response = await fetch(`http://localhost:5000/api/dailyrecords/getAllTasks`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    return await response.json();
  }

  let records: DailyRecord[] = [];
  try {
    records = await fetchAllTasks();
  } catch (error) {
    console.error("Error fetching tasks:", error);
    container.innerHTML = "<p>Failed to load task history.</p>";
    return;
  }

  // --- Utility: Accordion creation ---
  function createAccordion(
    title: string,
    contentGenerator: () => HTMLElement
  ): HTMLElement {
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

  // --- Generate Task List for a Day ---
  function generateTaskList(tasks: Task[]): HTMLElement {
    const list = document.createElement("div");
    list.classList.add("task-list");

    tasks
      .sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? -1 : 1))
      .forEach((task) => {
        const item = document.createElement("div");
        item.classList.add("task-item-history");
        item.dataset.status = task.completed ? "completed" : "missed";

        item.innerHTML = `
          <span>${task.title}</span>
          <span class="task-difficulty">${task.difficulty} — ${
          task.completed ? "completed" : "missed"
        }</span>
        `;

        list.appendChild(item);
      });

    return list;
  }

  // --- Group records by year/month/date ---
  const sortedTasks: Record<
    number,
    Record<string, Record<string, Task[]>>
  > = {};

  records.forEach((record) => {
    const date = new Date(record.date);
    const year = date.getFullYear();
    const monthName = date.toLocaleString("default", { month: "long" });
    const dayLabel = `${date.toLocaleDateString("en-US", {
      weekday: "long",
    })} - ${date.toLocaleDateString("en-US")}`;

    if (!sortedTasks[year]) {
      sortedTasks[year] = {};
    }
    if (!sortedTasks[year][monthName]) {
      sortedTasks[year][monthName] = {};
    }
    sortedTasks[year][monthName][dayLabel] = record.tasks;
  });

  // --- Generate day blocks within a month ---
  function generateDays(days: Record<string, Task[]>): HTMLElement {
    const wrapper = document.createElement("div");

    Object.entries(days).forEach(([day, tasks]) => {
      const dayDiv = document.createElement("div");
      dayDiv.classList.add("task-day");

      const completionRate = Math.round(
        (tasks.filter((t) => t.completed).length / tasks.length) * 100
      );

      dayDiv.textContent = `${day} — ${completionRate}% complete`;

      const taskList = generateTaskList(tasks);
      dayDiv.addEventListener("click", () => {
        taskList.classList.toggle("show");
      });

      wrapper.appendChild(dayDiv);
      wrapper.appendChild(taskList);
    });

    return wrapper;
  }

  // --- Generate months accordion ---
  function generateMonths(
    months: Record<string, Record<string, Task[]>>
  ): HTMLElement {
    const wrapper = document.createElement("div");
    Object.entries(months).forEach(([month, days]) => {
      wrapper.appendChild(createAccordion(month, () => generateDays(days)));
    });
    return wrapper;
  }

  // --- Render everything ---
  Object.entries(sortedTasks)
    .sort(([a], [b]) => Number(b) - Number(a)) // Newest year first
    .forEach(([year, months]) => {
      container.appendChild(createAccordion(year, () => generateMonths(months)));
    });
});