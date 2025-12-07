# Feature Documentation: Stats & Gamification

## Overview
The **Stats & Gamification** feature provides users with comprehensive statistics about their task completion, including points, streaks, and a visual calendar heatmap. The system tracks user progress over time and provides gamification elements to encourage consistent task completion.

---

## 1. File Overview

| File | Path | Description |
|------|------|-------------|
| `stats.ts` | `backend/routes/stats.ts` | Backend API endpoint for user statistics |
| `stats.html` | `frontend/stats.html` | Stats page UI |
| `stats.ts` | `frontend/stats.ts` | Frontend logic for displaying stats |
| `stats.css` | `frontend/stats.css` | Styling for stats page |
| `dailyRollover.ts` | `backend/utils/dailyRollover.ts` | Streak calculation logic |

---

## 2. Backend Implementation

### 2.1 API Endpoint

#### GET `/api/stats`
**Description:** Get comprehensive user statistics  
**Authentication:** Required (JWT token)  
**Access:** Private (user can only see their own stats)

**Response:**
```json
{
  "username": "user123",
  "total_tasks_completed": 150,
  "total_tasks_started": 200,
  "tasks_missed": 50,
  "total_points": 1250,
  "current_streak": 7,
  "highest_streak": 15,
  "calendar_heatmap_data": {
    "1701388800": 3,
    "1701475200": 5,
    "1701561600": 2
  }
}
```

**Data Processing:**
1. Processes daily rollover on first API call of the day
2. Fetches user from database
3. Calculates `tasks_missed` = `total_tasks_started` - `total_tasks_completed`
4. Converts `daily_completion_summary` to calendar heatmap format (Unix timestamps)
5. Returns all statistics

### 2.2 Calendar Heatmap Data

The `daily_completion_summary` is a Map structure:
- **Key**: Date string (YYYY-MM-DD)
- **Value**: Number of tasks completed on that date

This is converted to Unix timestamps (seconds) for the Cal-Heatmap library:
- Parses date string to Date object (using local time)
- Converts to Unix timestamp
- Returns as object with timestamp keys

---

## 3. Frontend Implementation

### 3.1 Stats Display

The stats page displays:

1. **User Information**
   - Username
   - Total points

2. **Task Statistics**
   - Total tasks completed
   - Total tasks started
   - Tasks missed (calculated)

3. **Streak Information**
   - Current streak (days)
   - Highest streak (days)

4. **Calendar Heatmap**
   - Visual representation of task completion over time
   - Color intensity indicates number of tasks completed
   - Shows last 12 months of data

### 3.2 Calendar Heatmap Integration

Uses **Cal-Heatmap** library:
- Displays calendar view with color-coded dates
- Hover tooltips show exact completion counts
- Responsive design for different screen sizes
- Date range automatically adjusts to show current month

---

## 4. Gamification Elements

### 4.1 Points System

**Point Values:**
- Easy tasks: 5 points
- Medium tasks: 10 points
- Hard tasks: 20 points

**Point Tracking:**
- Points are awarded when tasks are completed
- Points are stored in `User.total_points`
- Points are removed if completed tasks are deleted

### 4.2 Streak System

**Streak Rules:**
- **Continues** if user completes at least 1 task on a day
- **Resets** if user completes 0 tasks on a day
- **Resets** if user doesn't log in on a day

**Streak Tracking:**
- `current_streak`: Current consecutive days with at least 1 task completed
- `highest_streak`: All-time highest streak achieved
- Updated daily via rollover process

### 4.3 Daily Completion Summary

Tracks completion count per day:
- Updated when tasks are completed
- Used for calendar heatmap visualization
- Provides historical completion data

---

## 5. Daily Rollover Integration

The stats endpoint automatically triggers daily rollover:
1. Checks if rollover has been processed today
2. If not, processes yesterday's completion
3. Updates streaks based on yesterday's performance
4. Locks yesterday's record
5. Updates `last_rollover_date`

This ensures stats are always up-to-date when viewed.

---

## 6. Data Calculations

### 6.1 Tasks Missed

```typescript
tasks_missed = total_tasks_started - total_tasks_completed
```

This represents tasks that were created but never completed.

### 6.2 Calendar Data Conversion

```typescript
// Convert YYYY-MM-DD to Unix timestamp
const [year, month, day] = dateStr.split('-').map(Number);
const date = new Date(year, month - 1, day); // Local time
const unixTimestamp = Math.floor(date.getTime() / 1000);
```

---

## 7. Security Features

| Feature | Implementation |
|---------|----------------|
| JWT Authentication | Requires valid token in `Authorization` header |
| User Isolation | Users can only access their own statistics |
| Automatic Rollover | Processes daily rollover on first API call |

---

## 8. User Experience

- **Real-time Updates**: Stats refresh automatically
- **Visual Feedback**: Calendar heatmap provides visual progress tracking
- **Motivation**: Streaks and points encourage consistent engagement
- **Historical View**: Calendar shows long-term patterns
- **Responsive Design**: Works on all screen sizes

---

## 9. Date Handling

All date calculations use **local time** (not UTC):
- Ensures calendar displays correct dates for user's timezone
- Prevents date offset issues
- Consistent with task management date handling

