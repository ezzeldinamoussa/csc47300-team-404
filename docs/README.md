# Documentation Index

This directory contains comprehensive documentation for all major features of the application.

---

## Available Documentation

### Core Features

1. **[Authentication (Login & Signup)](login_signup_doc.md)**
   - User registration and login
   - JWT token authentication
   - Password hashing with bcrypt
   - User model and schema

2. **[Tasks Management](tasks_management.md)**
   - Creating, updating, and deleting tasks
   - Daily task records
   - Points calculation system
   - Task locking and date validation
   - Daily rollover system

3. **[Stats & Gamification](stats_gamification.md)**
   - User statistics (points, streaks, tasks)
   - Calendar heatmap visualization
   - Streak calculation and tracking
   - Points system
   - Daily completion summary

4. **[Friends & Leaderboard](friends_leaderboard.md)**
   - Friend request system
   - User search functionality
   - Leaderboard with friends
   - Auto-accept logic for mutual requests
   - Friend management (add, remove, accept, deny)

5. **[Admin Dashboard](admin_dashboard.md)**
   - User management interface
   - Ban/unban functionality
   - Warning system with auto-ban
   - User deletion with cascade
   - Admin authentication and authorization

6. **[Task History](history_doc.md)**
   - Historical task viewing
   - Nested accordion interface
   - Year > Month > Day drilldown
   - Task completion status tracking

### Reference Documentation

7. **[API Reference](API_REFERENCE.md)**
   - Complete API endpoint documentation
   - Request/response formats
   - Authentication requirements
   - Error responses
   - Common patterns

---

## Quick Links

### For Developers
- [API Reference](API_REFERENCE.md) - Complete API documentation
- [Tasks Management](tasks_management.md) - Task CRUD operations
- [Authentication](login_signup_doc.md) - Auth implementation details

### For Users
- [Friends & Leaderboard](friends_leaderboard.md) - How to use friends feature
- [Stats & Gamification](stats_gamification.md) - Understanding your stats
- [Task History](history_doc.md) - Viewing past tasks

### For Administrators
- [Admin Dashboard](admin_dashboard.md) - Admin features and usage

---

## Feature Checklist

See [checklist.md](checklist.md) for a comprehensive testing checklist for all features.

---

## Architecture Overview

### Backend
- **Framework**: Express.js (Node.js)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Language**: TypeScript

### Frontend
- **Framework**: Vanilla TypeScript + React (for admin)
- **Build Tool**: Vite
- **Styling**: CSS
- **API Communication**: Fetch API

### Key Technologies
- JWT for authentication
- MongoDB for data persistence
- TypeScript for type safety
- React for admin dashboard
- Cal-Heatmap for calendar visualization

---

## Getting Started

1. **Setup**: See project README for installation instructions
2. **Authentication**: Read [login_signup_doc.md](login_signup_doc.md) for auth flow
3. **API Usage**: See [API_REFERENCE.md](API_REFERENCE.md) for endpoint details
4. **Feature Implementation**: See individual feature docs for implementation details

---

## Contributing

When adding new features:
1. Update relevant feature documentation
2. Update API reference if new endpoints are added
3. Update checklist.md with new test cases
4. Follow existing documentation format

---

## Last Updated

Documentation last updated: December 2025

