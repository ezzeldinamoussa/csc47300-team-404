import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminDashboard from './AdminDashboard';

const root = document.getElementById('react-admin-root');

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <AdminDashboard />
    </React.StrictMode>
  );
}