##  Feature Testing Checklist

| **Feature** | **Checklist Item** | **Goal** | **Expected Result** |
|--------------|--------------------|-----------|----------------------|
| **Signup** | Check that all input fields (`Username`, `Email`, `Password`, `Confirm Password`) are visible and labeled correctly | Ensure all fields are available to the user | All input fields are displayed with correct placeholders and labels |
| **Signup** | Try submitting the form with one or more fields left empty | Test form validation for required inputs | Error message: *“Please enter all fields.”* |
| **Signup** | Enter mismatched `Password` and `Confirm Password` | Verify password confirmation logic | Error message: *“Passwords do not match.”* |
| **Signup** | Register with an already used username or email | Test backend duplicate account prevention | Error message: *“User with this email or username already exists.”* |
| **Signup** | Enter valid details for a new user | Confirm successful user creation and redirection | Alert: *“User registered successfully! Please login.”* and redirect to `login.html` |
| **Signup** | Check password hashing in the database | Ensure password security | `password_hash` stored as hashed string |
| **Login** | Check that `Username or Email` and `Password` inputs are visible | Ensure clear access to login form | Fields are correctly labeled and visible |
| **Login** | Try logging in with missing fields | Validate required inputs | Error message: *“Please provide credentials.”* |
| **Login** | Try logging in with invalid username or email | Test backend user existence check | Error message: *“Invalid credentials.”* |
| **Login** | Try logging in with incorrect password | Verify password comparison using bcrypt | Error message: *“Invalid credentials.”* |
| **Login** | Enter valid credentials for a registered user | Confirm successful authentication | JWT token returned; user redirected to `tasks.html` |
| **Login** | Inspect localStorage after successful login | Verify token persistence | `token` key exists in localStorage |
| **Tasks** | Try creating task without all fields filled out | Validate required inputs | Error message: *“Please fill out this field.” | 
| **Tasks** | Allow creating tasks for today and tomorrow | Adding new task details will be shown on tasks card | Creating a task without errors stores it under today or tomorrow cards |
| **Tasks** | Tasks created for tomorrow can't be changed by end of day | Backend stores tasks until date and time are EOD | Tasks can't be changed later than EOD |
| **Tasks** | Tasks created for tomorrow can be viewed the next day | Backend fetches previous day's tasks made to show on today's card | Creating tasks for tomorrow can be viewed without altering the next day |
| **Tasks** | Restrict task creation to today or tomorrow and task deletion to tomorrow and enforce server-side validation | User can only create tasks for today or tomorrow and delete tasks for tomorrow| Use of buttons in UI allows for deletion of today's tasks and insertion of today's and tomorrow's tasks without errors | 
---


# History Feature Testing Checklist

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