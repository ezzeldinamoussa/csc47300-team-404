// backend/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./db.js";

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // parses JSON bodies

// Routes (example placeholder)
app.get("/", (req, res) => {
  res.send("Backend API is running...");
});

// Example: basic users endpoint (we’ll hook up your real model soon)
app.get("/api/users", (req, res) => {
  res.json({ message: "Users endpoint working!" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
