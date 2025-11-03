# Feature Documentation: User Authentication (Login & Signup)

## Overview
The **User Authentication** feature enables users to securely register and log in to the system using a username, email, and password.  
It is implemented with a **Node.js + Express.js backend**, **MongoDB database**, and **bcryptjs** and **jsonwebtoken (JWT)** for password hashing and authentication.  
The **frontend** provides user-friendly signup and login forms that interact with the backend using the **Fetch API**.

---

## 1. File Overview

| File | Path | Description |
|------|------|-------------|
| `server.js` | `backend/server.js` | Initializes Express server, connects to MongoDB, and sets up routes. |
| `auth.js` | `backend/routes/auth.js` | Contains `/register` and `/login` routes that handle authentication. |
| `User.js` | `backend/models/User.js` | Defines the schema for user data in MongoDB. |
| `signup.html` / `signup.js` | `frontend/` | Signup page and script for new user registration. |
| `login.html` / `login.js` | `frontend/` | Login page and script for user authentication. |

---

## 2. Backend Implementation

### 2.1 Server Setup — `backend/server.js`
```js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./db.js');
const authRoutes = require('./routes/auth');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Mount authentication routes
app.use('/api/auth', authRoutes);
```
 **Responsibilities:**
- Connects to MongoDB via `connectDB()`
- Parses JSON request bodies
- Mounts all authentication endpoints under `/api/auth`

---

### 2.2 User Schema — `backend/models/User.js`
```js
const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  join_date: { type: String },
  preferred_theme: { type: String, enum: ['light', 'dark'], default: 'light' },
  total_points: { type: Number, default: 0 }
});
```
 **Responsibilities:**
- Ensures each username and email are unique
- Stores securely hashed passwords (no plaintext)
- Includes metadata for user profile tracking

---

## 3. Signup (Registration)

### Route:  
`POST /api/auth/register`  
**Defined in:** `backend/routes/auth.js`

**Function:**
```js
router.post('/register', async (req, res) => { ... });
```

### Workflow:
1. Extracts input from `req.body`.
2. Validates fields and password confirmation.
3. Checks duplicates in MongoDB.
4. Hashes password using bcrypt.
5. Saves new user and returns success message.

### Success Response
```json
{
  "msg": "User registered successfully! Please login."
}
```

### Failure Responses
| Condition | Response | Description |
|------------|-----------|-------------|
| Missing fields | `{ "msg": "Please enter all fields." }` | User didn’t fill all required fields. |
| Password mismatch | `{ "msg": "Passwords do not match." }` | `password` and `confirm-password` don’t match. |
| Existing user | `{ "msg": "User with this email or username already exists." }` | Username or email already registered. |
| Server error | `"Server error"` | Unexpected failure while saving user. |

---

### Frontend Handling — `frontend/signup.js`
```js
if (response.ok) {
  alert(result.msg);
  window.location.href = 'login.html';
} else {
  alert('Error: ' + result.msg);
}
```
 Displays a success alert and redirects to login page or shows specific backend error.

---

## 4. Login

### Route:  
`POST /api/auth/login`  
**Defined in:** `backend/routes/auth.js`

**Function:**
```js
router.post('/login', async (req, res) => { ... });
```

### Workflow:
1. Extracts credentials.
2. Validates required fields.
3. Finds user by username or email.
4. Verifies password using bcrypt.
5. Returns signed JWT token if valid.

### Success Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Failure Responses
| Condition | Response | Description |
|------------|-----------|-------------|
| Missing credentials | `{ "msg": "Please provide credentials." }` | Empty login field(s). |
| Invalid username/email | `{ "msg": "Invalid credentials." }` | No matching account found. |
| Incorrect password | `{ "msg": "Invalid credentials." }` | bcrypt comparison failed. |
| Server error | `"Server error"` | Unhandled backend failure. |

---

### Frontend Handling — `frontend/login.js`
```js
if (response.ok) {
  localStorage.setItem('token', result.token);
  window.location.href = 'tasks.html';
} else {
  alert('Error: ' + result.msg);
}
```
 Stores token and redirects on success, or displays server message on failure.

---

## 5. Security Features

| Feature | Implementation |
|----------|----------------|
| Password Hashing | Uses `bcrypt.genSalt(10)` and `bcrypt.hash()` before saving passwords. |
| JWT Authentication | Tokens generated with `jsonwebtoken` and secret key `process.env.JWT_SECRET`. |
| Token Expiration | Tokens expire in 1 hour to reduce exposure. |
| Input Validation | Ensures all required fields are provided and passwords match. |
| Unique Constraints | Enforced via Mongoose schema (`unique: true` for email/username). |

---


