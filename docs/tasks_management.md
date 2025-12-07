# Feature Documentation: Tasks Management

## Overview
The **Tasks Management** feature allows users to create, update, complete, and delete daily tasks. Tasks are organized by date (today and tomorrow), and each task has a title, difficulty level (Easy, Medium, Hard), and completion status. The system automatically calculates points based on difficulty and tracks task completion statistics.

---

## 1. File Overview

| File | Path | Description |
|------|------|-------------|
| `dailyrecords.ts` | `backend/routes/dailyrecords.ts` | Backend routes for task CRUD operations |
| `DailyRecord.ts` | `backend/models/DailyRecord.ts` | Mongoose schema for daily task records |
| `tasks.html` | `frontend/tasks.html` | Main tasks page UI |
| `tasks.ts` | `frontend/tasks.ts` | Frontend logic for task management |
| `tasks.css` | `frontend/tasks.css` | Styling for tasks page |
| `dailyRollover.ts` | `backend/utils/dailyRollover.ts` | Daily rollover logic for task status updates |

---

## 2. Backend Implementation

### 2.1 Data Model — `DailyRecord`

Each daily record contains:
- `user_id`: Unique identifier for the user
- `date`: Date string in YYYY-MM-DD format
- `tasks`: Array of task objects
- `locked`: Boolean indicating if the day is locked (past days)
- `points_earned`: Total points earned for the day

Each task object contains:
- `title`: Task name/description
- `difficulty`: "Easy", "Medium", or "Hard"
- `completed`: Boolean indicating completion status
- `status`: "pending", "completed", or "failed"

### 2.2 API Endpoints

#### GET `/api/dailyrecords`
**Description:** Fetch daily record for a specific date  
**Authentication:** Required (JWT token)  
**Query Parameters:**
- `date`: Date string (YYYY-MM-DD)

**Response:**
```json
{
  "_id": "...",
  "user_id": "user123",
  "date": "2025-12-01",
  "tasks": [
    {
      "title": "Complete project",
      "difficulty": "Hard",
      "completed": true,
      "status": "completed"
    }
  ],
  "locked": false,
  "points_earned": 20
}
```

#### POST `/api/dailyrecords/addTask`
**Description:** Add a new task to today or tomorrow  
**Authentication:** Required  
**Request Body:**
```json
{
  "date": "2025-12-01",
  "title": "New task",
  "difficulty": "Medium"
}
```

**Response:**
```json
{
  "msg": "Task added successfully",
  "record": { ... }
}
```

**Validation:**
- Only allows adding tasks for today or tomorrow
- Requires title and difficulty
- Increments `total_tasks_created` in User model

#### PATCH `/api/dailyrecords/updateTask`
**Description:** Update task completion status  
**Authentication:** Required  
**Request Body:**
```json
{
  "date": "2025-12-01",
  "taskIndex": 0,
  "completed": true
}
```

**Response:**
```json
{
  "msg": "Task updated successfully",
  "record": { ... }
}
```

**Features:**
- Calculates and awards points based on difficulty:
  - Easy: 5 points
  - Medium: 10 points
  - Hard: 20 points
- Updates `total_tasks_completed` in User model
- Updates `daily_completion_summary` (Map of date → completion count)
- Updates `total_points` in User model

#### DELETE `/api/dailyrecords/deleteTask`
**Description:** Delete a task (only allowed for tomorrow's tasks)  
**Authentication:** Required  
**Request Body:**
```json
{
  "date": "2025-12-02",
  "taskIndex": 0
}
```

**Response:**
```json
{
  "msg": "Task deleted successfully"
}
```

**Validation:**
- Only allows deletion of tomorrow's tasks
- Prevents deletion of locked (past) days
- Decrements `total_tasks_created` if task was completed
- Removes points if task was completed

---

## 3. Frontend Implementation

### 3.1 Task Display

The tasks page displays two main sections:
- **Today's Tasks**: Shows tasks for the current date
- **Tomorrow's Tasks**: Shows tasks for the next day

Each task card displays:
- Task title
- Difficulty level (with color coding)
- Completion checkbox
- Delete button (only for tomorrow's tasks)
- Progress percentage for the day

### 3.2 Task Operations

**Adding Tasks:**
1. User fills out form (title, difficulty)
2. Selects date (today or tomorrow)
3. Clicks "Add Task" button
4. Frontend sends POST request to `/api/dailyrecords/addTask`
5. UI updates with new task

**Completing Tasks:**
1. User clicks checkbox on a task
2. Frontend sends PATCH request to `/api/dailyrecords/updateTask`
3. Points are calculated and added
4. Progress bar updates
5. User stats are updated in real-time

**Deleting Tasks:**
1. User clicks delete button (only visible for tomorrow's tasks)
2. Frontend sends DELETE request to `/api/dailyrecords/deleteTask`
3. Task is removed from UI
4. Points are removed if task was completed

---

## 4. Daily Rollover System

### 4.1 Automatic Processing

The daily rollover system runs automatically on the first API call of each day:

1. **Checks last rollover date**: Compares `last_rollover_date` with today
2. **Processes yesterday's tasks**: 
   - Marks incomplete tasks as "failed"
   - Locks yesterday's record
3. **Updates streaks**: 
   - Calculates current streak based on yesterday's completion
   - Updates highest streak if needed
4. **Updates rollover date**: Sets `last_rollover_date` to today

### 4.2 Streak Calculation

- **Streak continues** if user completed at least 1 task yesterday
- **Streak resets** if user completed 0 tasks yesterday
- **Streak resets** if user didn't log in yesterday

---

## 5. Points System

### 5.1 Point Calculation

Points are awarded when a task is marked as completed:
- **Easy tasks**: 5 points
- **Medium tasks**: 10 points
- **Hard tasks**: 20 points

### 5.2 Point Tracking

- Points are stored in `DailyRecord.points_earned` (daily total)
- Points are aggregated in `User.total_points` (lifetime total)
- Points are removed if a completed task is deleted

---

## 6. Security Features

| Feature | Implementation |
|---------|----------------|
| JWT Authentication | All endpoints require valid JWT token in `Authorization` header |
| User Isolation | Users can only access their own daily records |
| Date Validation | Server-side validation prevents manipulation of dates |
| Task Locking | Past days are locked to prevent modification |
| Delete Restrictions | Only tomorrow's tasks can be deleted |

---

## 7. Date Handling

All date calculations use **local time** (not UTC) to ensure consistency:
- `getTodayString()`: Returns today's date in YYYY-MM-DD format
- `getTomorrowString()`: Returns tomorrow's date
- `getYesterdayString()`: Returns yesterday's date

This ensures that users see tasks for their local day, regardless of timezone.

---

## 8. User Experience Features

- **Real-time Updates**: UI updates immediately after API calls
- **Progress Tracking**: Visual progress bar shows daily completion percentage
- **Color Coding**: Difficulty levels are color-coded (Easy=green, Medium=yellow, Hard=red)
- **Validation**: Client-side and server-side validation prevent invalid operations
- **Error Handling**: Clear error messages for failed operations

