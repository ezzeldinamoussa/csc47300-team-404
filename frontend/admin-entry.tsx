import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminDashboard from './AdminDashboard';

const root = document.getElementById('react-admin-root');

// --- CRITICAL: Check authentication and admin level before rendering ---

const token = localStorage.getItem('token');
// Retrieve the stored numeric admin level (default to 0 if not found)
const adminLevel = parseInt(localStorage.getItem('adminLevel') || '0', 10); 

if (!token) {
  // 1. No token - redirect to login
  window.location.href = 'login.html';
} else if (adminLevel < 1) {
  // 2. Not an admin (Level 0) - redirect to tasks page
  // This ensures regular users who might manually navigate here are blocked.
  window.location.href = 'tasks.html';
} else if (root) {
  // 3. User is authenticated and is an admin (Level 1 or Level 2) - render dashboard
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AdminDashboard />
    </React.StrictMode>
  );
}