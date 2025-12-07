# API Reference Documentation

## Overview
This document provides a comprehensive reference for all API endpoints in the application. All endpoints require JWT authentication unless otherwise specified.

---

## Base URL
- **Development**: `http://localhost:5000`
- **Production**: Configured via environment variables

---

## Authentication

All protected endpoints require a JWT token in the request header:
```
Authorization: Bearer <token>
```

Tokens are obtained via the `/api/auth/login` endpoint and expire after 1 hour.

---

## Authentication Endpoints

### POST `/api/auth/register`
**Description:** Register a new user  
**Access:** Public  
**Request Body:**
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "password123",
  "confirm-password": "password123"
}
```

**Response:**
```json
{
  "msg": "User registered successfully! Please login."
}
```

**Error Responses:**
- `400`: Missing fields, passwords don't match, or user already exists

---

### POST `/api/auth/login`
**Description:** Authenticate user and get JWT token  
**Access:** Public  
**Request Body:**
```json
{
  "username": "user123",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user123_abc",
    "username": "user123",
    "email": "user@example.com",
    "isAdmin": false
  }
}
```

**Error Responses:**
- `400`: Invalid credentials
- `403`: User is banned

---

## Daily Records Endpoints

### GET `/api/dailyrecords`
**Description:** Get daily record for a specific date  
**Access:** Private  
**Query Parameters:**
- `date`: Date string (YYYY-MM-DD)

**Response:**
```json
{
  "_id": "...",
  "user_id": "user123",
  "date": "2025-12-01",
  "tasks": [...],
  "locked": false,
  "points_earned": 20
}
```

---

### POST `/api/dailyrecords/addTask`
**Description:** Add a new task  
**Access:** Private  
**Request Body:**
```json
{
  "date": "2025-12-01",
  "title": "Complete project",
  "difficulty": "Easy"
}
```

**Response:**
```json
{
  "msg": "Task added successfully",
  "record": { ... }
}
```

---

### PATCH `/api/dailyrecords/updateTask`
**Description:** Update task completion status  
**Access:** Private  
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

---

### DELETE `/api/dailyrecords/deleteTask`
**Description:** Delete a task (only tomorrow's tasks)  
**Access:** Private  
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

---

## Stats Endpoints

### GET `/api/stats`
**Description:** Get user statistics  
**Access:** Private  
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
    "1701475200": 5
  }
}
```

---

## Friends Endpoints

### GET `/api/friends/leaderboard`
**Description:** Get leaderboard (user + friends)  
**Access:** Private  
**Response:**
```json
[
  {
    "username": "user1",
    "total_points": 1500,
    "current_streak": 10,
    "highest_streak": 25
  }
]
```

---

### GET `/api/friends/search?username=xxx`
**Description:** Search for users by username  
**Access:** Private  
**Query Parameters:**
- `username`: Username to search for

**Response:**
```json
{
  "exists": true,
  "username": "searched_user",
  "isFriend": false,
  "hasIncomingRequest": false,
  "hasOutgoingRequest": false,
  "canSendRequest": true
}
```

---

### POST `/api/friends/request`
**Description:** Send friend request  
**Access:** Private  
**Request Body:**
```json
{
  "username": "target_user"
}
```

**Response:**
```json
{
  "msg": "Friend request sent"
}
```

**Special Response (Auto-accept):**
```json
{
  "msg": "Friend request auto-accepted!",
  "autoAccepted": true
}
```

---

### GET `/api/friends/requests`
**Description:** Get incoming friend requests  
**Access:** Private  
**Response:**
```json
["username1", "username2"]
```

---

### POST `/api/friends/accept`
**Description:** Accept friend request  
**Access:** Private  
**Request Body:**
```json
{
  "username": "requester_username"
}
```

**Response:**
```json
{
  "msg": "Friend request accepted"
}
```

---

### POST `/api/friends/deny`
**Description:** Deny friend request  
**Access:** Private  
**Request Body:**
```json
{
  "username": "requester_username"
}
```

**Response:**
```json
{
  "msg": "Friend request denied"
}
```

---

### POST `/api/friends/remove`
**Description:** Remove a friend  
**Access:** Private  
**Request Body:**
```json
{
  "username": "friend_username"
}
```

**Response:**
```json
{
  "msg": "Friend removed"
}
```

---

## Admin Endpoints

All admin endpoints require admin authentication via `adminMiddleware`.

### GET `/api/users`
**Description:** Get all users  
**Access:** Admin only  
**Response:**
```json
[
  {
    "_id": "...",
    "user_id": "user123",
    "username": "user1",
    "email": "user@example.com",
    "total_points": 500,
    "warnCount": 0,
    "isBanned": false
  }
]
```

---

### POST `/api/users/:id/ban`
**Description:** Ban/unban user (toggle)  
**Access:** Admin only  
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

---

### POST `/api/users/:id/warn`
**Description:** Warn user (auto-ban after 5 warnings)  
**Access:** Admin only  
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

---

### DELETE `/api/users/:id`
**Description:** Delete user and all associated data  
**Access:** Admin only  
**URL Parameters:**
- `id`: MongoDB `_id` of the user

**Response:**
```json
{
  "msg": "User and all associated data deleted successfully"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "msg": "Error message describing the issue"
}
```

### 401 Unauthorized
```json
{
  "msg": "No token, authorization denied"
}
```
or
```json
{
  "msg": "Token is not valid"
}
```

### 403 Forbidden
```json
{
  "msg": "Admin access required"
}
```
or
```json
{
  "msg": "Access denied"
}
```

### 404 Not Found
```json
{
  "msg": "User not found"
}
```

### 500 Internal Server Error
```json
{
  "msg": "Server error"
}
```

---

## Common Patterns

### Authentication Header
All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

### Date Format
All dates use format: `YYYY-MM-DD`

### Points Calculation
- Easy tasks: 5 points
- Medium tasks: 10 points
- Hard tasks: 20 points

### Timezone
All date calculations use **local time** (not UTC).

---

## Rate Limiting

Currently, there is no rate limiting implemented. Consider adding rate limiting for production use.

---

## CORS

CORS is enabled for all origins in development. Configure appropriately for production.

