import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminDashboard from './AdminDashboard';

const root = document.getElementById('react-admin-root');

// Check authentication and admin status before rendering
const token = localStorage.getItem('token');
const isAdmin = localStorage.getItem('isAdmin') === 'true';

if (!token) {
  // No token - redirect to login
  window.location.href = 'login.html';
} else if (!isAdmin) {
  // Not an admin - redirect to tasks page
  window.location.href = 'tasks.html';
} else if (root) {
  // User is authenticated and is an admin - render dashboard
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AdminDashboard />
    </React.StrictMode>
  );
}