# Feature Documentation: Friends & Leaderboard

## Overview
The **Friends & Leaderboard** feature allows users to connect with other users, send friend requests, and compete on a leaderboard. Users can search for friends, manage friend requests, and view a ranked leaderboard showing themselves and their friends sorted by total points.

---

## 1. File Overview

| File | Path | Description |
|------|------|-------------|
| `friends.ts` | `backend/routes/friends.ts` | Backend API routes for friends functionality |
| `friends.html` | `frontend/friends.html` | Friends page UI |
| `friends.ts` | `frontend/friends.ts` | Frontend logic for friends and leaderboard |
| `friends.css` | `frontend/friends.css` | Styling for friends page |
| `User.ts` | `backend/models/User.ts` | User model with friends and friendRequests fields |

---

## 2. Data Model

### 2.1 User Model Extensions

The User model includes two new fields:
- `friends`: Array of usernames (users who are friends)
- `friendRequests`: Array of usernames (users who sent friend requests)

Both fields default to empty arrays.

---

## 3. Backend Implementation

### 3.1 API Endpoints

#### GET `/api/friends/leaderboard`
**Description:** Get leaderboard with user and their friends  
**Authentication:** Required  
**Response:**
```json
[
  {
    "username": "user1",
    "total_points": 1500,
    "current_streak": 10,
    "highest_streak": 25
  },
  {
    "username": "user2",
    "total_points": 1200,
    "current_streak": 5,
    "highest_streak": 15
  }
]
```

**Features:**
- Returns current user + all their friends
- Sorted by `total_points` (descending)
- Shows username, points, current streak, highest streak

#### GET `/api/friends/search?username=xxx`
**Description:** Search for users by username  
**Authentication:** Required  
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

**Validation:**
- Cannot search for yourself
- Returns user status (friend, request status, etc.)

#### POST `/api/friends/request`
**Description:** Send a friend request  
**Authentication:** Required  
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

**Special Rules:**
- **Auto-accept**: If both users send requests to each other, they automatically become friends
- Prevents duplicate requests
- Prevents sending to yourself
- Prevents sending if already friends

#### GET `/api/friends/requests`
**Description:** Get incoming friend requests  
**Authentication:** Required  
**Response:**
```json
["username1", "username2"]
```

Returns array of usernames who have sent friend requests.

#### POST `/api/friends/accept`
**Description:** Accept a friend request  
**Authentication:** Required  
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

**Features:**
- Removes request from both users' `friendRequests`
- Adds each other to both users' `friends` arrays
- Updates both user records atomically

#### POST `/api/friends/deny`
**Description:** Deny a friend request  
**Authentication:** Required  
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

**Features:**
- Removes request from current user's `friendRequests`
- Does not affect the requester's records

#### POST `/api/friends/remove`
**Description:** Remove a friend  
**Authentication:** Required  
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

**Features:**
- Removes friend from both users' `friends` arrays
- Updates both user records

---

## 4. Frontend Implementation

### 4.1 Page Layout

The friends page has three main sections:

1. **Leaderboard Section**
   - Displays user + friends sorted by points
   - Shows username, points, current streak, highest streak
   - "Remove" button for each friend (not self)

2. **Add Friends Section**
   - Search input for username
   - Search results with action buttons
   - Shows user status (friend, request sent, etc.)

3. **Friend Requests Section**
   - Lists incoming friend requests
   - Accept/Deny buttons for each request
   - Shows "No pending requests" when empty

### 4.2 User Search Flow

1. User enters username in search box
2. Frontend calls `/api/friends/search`
3. Results display based on status:
   - **Already friends**: Shows message
   - **Request already sent**: Shows message
   - **Incoming request**: Shows accept button
   - **Can send request**: Shows "Send Friend Request" button

### 4.3 Friend Request Flow

**Sending Request:**
1. User clicks "Send Friend Request"
2. Frontend validates (checks for duplicates)
3. Sends POST to `/api/friends/request`
4. Shows success notification
5. Refreshes search results to show updated state

**Auto-Accept:**
- If both users send requests simultaneously, they automatically become friends
- Shows special notification: "Friend request auto-accepted!"

**Accepting Request:**
1. User clicks "Accept" button
2. Sends POST to `/api/friends/accept`
3. Updates leaderboard
4. Removes request from list
5. Shows success notification

**Denying Request:**
1. User clicks "Deny" button
2. Sends POST to `/api/friends/deny`
3. Removes request from list
4. Shows info notification

### 4.4 Leaderboard Display

- Shows current user first (marked with "(You)")
- Shows all friends sorted by total points
- Displays streaks and points for each user
- "Remove" button allows unfriending
- Updates automatically after friend actions

---

## 5. Special Features

### 5.1 Auto-Accept Logic

If User A sends a request to User B, and User B has already sent a request to User A:
- Both requests are automatically accepted
- Both users are added to each other's `friends` arrays
- Requests are removed from both users' `friendRequests`
- Special notification is shown

### 5.2 Duplicate Prevention

**Frontend:**
- Pre-checks before sending requests
- Validates user status before API calls
- Refreshes search results after actions

**Backend:**
- Checks if request already exists
- Prevents duplicate requests
- Double-checks to prevent race conditions

### 5.3 Real-time Updates

- Leaderboard refreshes after friend actions
- Search results update after sending requests
- Friend requests list updates after accept/deny
- All updates happen without page refresh

---

## 6. Notification System

All friend-related actions use HTML toast notifications:
- **Success**: Green notifications for successful actions
- **Error**: Red notifications for errors
- **Info**: Purple notifications for informational messages

No browser popups are used.

---

## 7. Security Features

| Feature | Implementation |
|---------|----------------|
| JWT Authentication | All endpoints require valid token |
| User Isolation | Users can only manage their own friend relationships |
| Input Validation | Server-side validation prevents invalid operations |
| Duplicate Prevention | Multiple layers prevent duplicate requests |

---

## 8. User Experience

- **Search Functionality**: Easy username search
- **Clear Status Indicators**: Shows relationship status clearly
- **Quick Actions**: Accept/deny/remove with single click
- **Visual Feedback**: Toast notifications for all actions
- **Leaderboard Competition**: Motivates users to earn more points
- **Social Connection**: Encourages user engagement

---

## 9. Error Handling

- **User not found**: Clear error message
- **Already friends**: Informative message
- **Request already sent**: Prevents duplicate actions
- **Network errors**: Graceful error handling with notifications
- **Authentication errors**: Redirects to login page

