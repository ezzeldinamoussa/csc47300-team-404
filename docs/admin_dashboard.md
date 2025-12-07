# Feature Documentation: Admin Dashboard

## Overview
The **Admin Dashboard** is a React-based interface that allows administrators to manage all users in the system. Admins can view user information, ban/unban users, warn users (with auto-ban after 5 warnings), and delete users along with all their associated data.

---

## 1. File Overview

| File | Path | Description |
|------|------|-------------|
| `userRoutes.ts` | `backend/routes/userRoutes.ts` | Backend API routes for admin operations |
| `adminMiddleware.ts` | `backend/middleware/adminMiddleware.ts` | Authentication/authorization middleware for admin routes |
| `AdminDashboard.tsx` | `frontend/AdminDashboard.tsx` | React component for admin dashboard |
| `admin-entry.tsx` | `frontend/admin-entry.tsx` | React entry point with auth checks |
| `admin.html` | `frontend/admin.html` | HTML page for admin dashboard |
| `admin.css` | `frontend/admin.css` | Styling for admin dashboard |

---

## 2. Admin Authentication

### 2.1 Admin Identification

A user is considered an admin if:
- Their `username` is exactly `"admin"`, OR
- Their `isAdmin` field is `true`

### 2.2 Admin Middleware

**File:** `backend/middleware/adminMiddleware.ts`

**Function:**
1. Verifies JWT token from `Authorization` header
2. Extracts `user_id` from token
3. Fetches user from database
4. Checks if user is admin (username === "admin" OR isAdmin === true)
5. Returns 401/403 if not authorized

**Usage:**
All admin routes are protected with `adminMiddleware`.

---

## 3. Backend Implementation

### 3.1 API Endpoints

#### GET `/api/users`
**Description:** Get all users (admin only)  
**Authentication:** Required (admin middleware)  
**Response:**
```json
[
  {
    "_id": "...",
    "user_id": "user123",
    "username": "user1",
    "email": "user1@example.com",
    "join_date": "2025-01-01",
    "total_points": 500,
    "current_streak": 5,
    "total_tasks_completed": 50,
    "warnCount": 0,
    "isBanned": false,
    "isAdmin": false
  }
]
```

**Features:**
- Returns all users (excluding password hashes)
- Includes admin fields (isBanned, warnCount)
- Includes stats (points, streaks, tasks)

#### POST `/api/users/:id/ban`
**Description:** Ban or unban a user (toggle)  
**Authentication:** Required (admin middleware)  
**URL Parameters:**
- `id`: MongoDB `_id` of the user

**Response:**
```json
{
  "_id": "...",
  "username": "user1",
  "isBanned": true
}
```

**Features:**
- Toggles `isBanned` field (true ↔ false)
- Banned users cannot log in (checked in login route)

#### POST `/api/users/:id/warn`
**Description:** Warn a user (with auto-ban after 5 warnings)  
**Authentication:** Required (admin middleware)  
**URL Parameters:**
- `id`: MongoDB `_id` of the user

**Response:**
```json
{
  "_id": "...",
  "username": "user1",
  "warnCount": 3,
  "isBanned": false
}
```

**Features:**
- Increments `warnCount` by 1
- Auto-bans user if `warnCount >= 5`
- Returns updated user object

#### DELETE `/api/users/:id`
**Description:** Delete a user and all associated data  
**Authentication:** Required (admin middleware)  
**URL Parameters:**
- `id`: MongoDB `_id` of the user

**Response:**
```json
{
  "msg": "User and all associated data deleted successfully"
}
```

**Features:**
- Deletes user from User collection
- **Cascade deletion**: Deletes all DailyRecord entries for the user
- Logs number of records deleted
- Permanent operation (cannot be undone)

---

## 4. Frontend Implementation

### 4.1 Admin Dashboard Component

**File:** `frontend/AdminDashboard.tsx`

**Features:**
- React functional component with hooks
- State management for users, loading, modals, expanded rows
- Fetches users on component mount
- Displays users in a table format

### 4.2 User Table

**Columns:**
1. Expand button (shows/hides details)
2. Username
3. Email
4. Join date
5. Total points
6. Warning count
7. Actions (Ban/Warn buttons, or "BANNED" status)
8. Delete button

**Expandable Details:**
- User ID
- Current streak
- Total tasks completed

### 4.3 Actions

**Ban/Unban:**
1. Admin clicks "Ban" button
2. Confirmation modal appears
3. Admin confirms action
4. POST request to `/api/users/:id/ban`
5. Table refreshes with updated status

**Warn:**
1. Admin clicks "Warn" button
2. Confirmation modal appears
3. Admin confirms action
4. POST request to `/api/users/:id/warn`
5. Warning count increments
6. Auto-ban if count reaches 5

**Delete:**
1. Admin clicks "X" delete button
2. Confirmation modal appears
3. Admin confirms action
4. DELETE request to `/api/users/:id`
5. User and all data are permanently deleted
6. Table refreshes

### 4.4 Authentication Protection

**File:** `frontend/admin-entry.tsx`

**Checks:**
1. Verifies token exists in localStorage
2. Verifies `isAdmin` flag is true
3. Redirects to login if no token
4. Redirects to tasks page if not admin
5. Only renders dashboard if authenticated and authorized

---

## 5. Security Features

| Feature | Implementation |
|---------|----------------|
| JWT Authentication | All routes require valid token |
| Admin Authorization | Middleware verifies admin status |
| Frontend Protection | Entry point checks admin status before rendering |
| API Security | All requests include Authorization header |
| Error Handling | Handles 401/403 responses gracefully |

---

## 6. Notification System

All admin actions use HTML toast notifications:
- **Success**: Green notifications for successful actions
- **Error**: Red notifications for errors
- **Info**: Purple notifications for informational messages

No browser popups are used.

---

## 7. User Management Features

### 7.1 Ban System

- **Manual Toggle**: Admins can ban/unban users
- **Auto-Ban**: Users are auto-banned after 5 warnings
- **Login Prevention**: Banned users cannot log in (403 error)

### 7.2 Warning System

- **Warning Count**: Tracks number of warnings per user
- **Auto-Ban Threshold**: 5 warnings = automatic ban
- **Persistent**: Warning count persists across sessions

### 7.3 User Deletion

- **Cascade Deletion**: Deletes user and all DailyRecord entries
- **Permanent**: Cannot be undone
- **Confirmation Required**: Modal confirmation before deletion
- **Data Cleanup**: Ensures no orphaned records

---

## 8. UI/UX Features

- **Expandable Rows**: Click to view additional user details
- **Color Coding**: Banned users shown in red
- **Loading States**: Shows "Loading..." while fetching data
- **Confirmation Modals**: Prevents accidental actions
- **Real-time Updates**: Table refreshes after actions
- **Responsive Design**: Works on different screen sizes

---

## 9. Error Handling

- **Authentication Errors**: Redirects to login page
- **Authorization Errors**: Shows error notification
- **Network Errors**: Shows error notification with retry option
- **Validation Errors**: Shows clear error messages

---

## 10. Admin Access

**How to Create Admin:**
1. Create user with username "admin", OR
2. Set `isAdmin: true` in database for existing user

**Security Note:**
- Admin status is checked on every request
- Cannot be bypassed by client-side manipulation
- Server-side validation is required

