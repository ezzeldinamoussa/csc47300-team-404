# Feature Documentation: Task History

## Overview
The **Task History** feature allows users to view a complete, read-only log of all their past tasks. The feature is secured by **jsonwebtoken (JWT)** and fetches all daily records associated with the logged-in user.

The data is presented in a nested **accordion** interface, allowing users to drill down from **Year** > **Month** > **Day** to see the specific tasks and their completion status (`completed` or `missed`). The frontend dynamically builds this UI from the data returned by the backend using the Fetch API.

---

## 1. File Overview

| File | Path | Description |
|------|------|-------------|
| `task-history.html` | `frontend/task-history.html` | The HTML structure and container for the history page. |
| `task-history.js` | `frontend/task-history.js` | Fetches task data and dynamically builds the accordion UI. |
| `tasks.css` | `frontend/tasks.css` | Contains all CSS styles for the history accordions. |
| `dailyrecords.js` | `backend/routes/dailyrecords.js` | (Assumed) Contains the `/getAllTasks` route to fetch user data. |

---

## 2. Backend Implementation (Inferred)

### Route:  
`GET /api/dailyrecords/getAllTasks`  
**Defined in:** `backend/routes/dailyrecords.js` (Assumed)

**Function:**
```js
// This route is protected by an auth middleware that verifies the JWT
router.get('/getAllTasks', authMiddleware, async (req, res) => { ... });


### Workflow:
1.  Authenticates the user from the `Authorization: Bearer <token>` header.
2.  Retrieves the `user_id` from the validated JWT.
3.  Queries the MongoDB `DailyRecords` collection for all records matching the `user_id`.
4.  Returns a complete array of all daily record objects for that user.

### Success Response
A JSON array of `DailyRecord` objects.
```json
[
  {
    "_id": "60c72b2f5f1b2c001f6e1b3a",
    "user_id": "user123_abc",
    "date": "2025-10-13T04:00:00.000Z",
    "tasks": [
      { "title": "Finish proposal", "difficulty": "Medium", "completed": "true" },
      { "title": "Clean workspace", "difficulty": "Easy", "completed": "false" }
    ],
    "daily_goal_met": false
  },
  {
    "_id": "60c72b2f5f1b2c001f6e1b3b",
    "user_id": "user123_abc",
    "date": "2025-10-12T04:00:00.000Z",
    "tasks": [
      { "title": "Read 20 pages", "difficulty": "Easy", "completed": "true" }
    ],
    "daily_goal_met": true
  }
]


## 3. Frontend Implementation

### 3.1 Data Fetching — `frontend/task-history.js`
-   On page load (`DOMContentLoaded`), the script immediately checks `localStorage` for `token`.
-   If no token is found, the user is redirected to `login.html`.
-   It calls `fetchAllTasks()`, which sends a `GET` request to `/api/dailyrecords/getAllTasks` with the token in the `Authorization` header.

### 3.2 Data Processing — `frontend/task-history.js`
-   The script takes the flat array of `DailyRecord` objects returned from the backend.
-   It iterates through this array and sorts all tasks into a deeply-nested `sortedTasks` object.
-   The final structure of this object is: `Year > Month Name > Date > [Array of Tasks]`
    ```js
    sortedTasks = {
      "2025": {
        "October": {
          "2025-10-13T...": [ { ... }, { ... } ],
          "2025-10-12T...": [ { ... } ]
        }
      }
    }
    ```

### 3.3 UI Generation — `frontend/task-history.js`
The script uses a set of recursive functions to dynamically build the nested accordion UI:
-   **`createAccordion(title, contentGenerator)`:** The core function. It creates an `.accordion` `div` with a clickable `.accordion-header` and a hidden `.accordion-content`. It adds a click listener to toggle the `.open` class, which makes the content visible via CSS.
-   **`generateMonths(months)`:** Called by the "Year" accordion. It maps over the `months` object and creates a new `createAccordion` for each month.
-   **`generateDays(days)`:** Called by the "Month" accordion. It maps over the `days` object (where each key is a full date string), creates a `.task-day` `div` for each, and calculates the completion percentage for that day. It also generates the hidden `.task-list` for that day.
-   **`generateTaskList(tasks)`:** Called by `generateDays`. It creates the final `.task-item-history` elements, sorts them by completion status, and adds a `data-status` attribute (`completed` or `missed`) for CSS styling.


## 4. Security Features

| Feature | Implementation |
|----------|----------------|
| JWT Authorization | The request to `/api/dailyrecords/getAllTasks` is protected. The frontend must send a valid JWT in the `Authorization` header. |
| Client-Side Auth Check | `task-history.js` checks for the `token` in `localStorage` on page load. If it's missing, the user is immediately redirected to `login.html`. |



# Task History: Feature Testing Checklist

| **Feature** | **Checklist Item** | **Goal** | **Expected Result** |
|--------------|--------------------|-----------|----------------------|
| **Security** | Load `task-history.html` while logged out (no token) | Test auth redirect | Page should immediately redirect to `login.html`. |
| **Data Fetch** | Load `task-history.html` while logged in | Test successful data fetch and render | Top-level accordions for each "Year" with data should appear. |
| **UI** | Click on a "Year" accordion | Test year-to-month drilldown | Accordion opens, revealing "Month" accordions inside. |
| **UI** | Click on a "Month" accordion | Test month-to-day drilldown | Accordion opens, revealing `.task-day` elements with dates and completion %. |
| **UI** | Click on a `.task-day` element | Test day-to-task drilldown | A `.task-list` appears below the day, showing individual tasks. |
| **Data** | Inspect a task in the list | Verify task data is correct | Task shows correct name, difficulty, and "completed" / "missed" status. |
| **Styling** | Check a "completed" task | Verify visual status indicator | Task has a green border (from `.task-item-history[data-status="completed"]`). |
| **Styling** | Check a "missed" task | Verify visual status indicator | Task has a red border (from `.task-item-history[data-status="missed"]`). |