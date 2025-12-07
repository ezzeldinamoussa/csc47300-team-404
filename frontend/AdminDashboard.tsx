import React, { useState, useEffect } from 'react';
import './style.css';
import './admin.css'; // Importing your CSS ensures it gets bundled
import { API_BASE } from './config.js';

interface User {
  _id: string;
  username: string;
  email: string;
  join_date: string;
  total_points: number;
  warnCount: number;
  isBanned: boolean;
  current_streak: number;
  total_tasks_completed: number;
  user_id: string;
}

interface ModalState {
  isOpen: boolean;
  action: 'ban' | 'unban' | 'warn' | 'delete' | '';
  userId: string;
  username: string;
}

// Notification system
type NotificationType = 'success' | 'error' | 'info';

const showNotification = (message: string, type: NotificationType = 'info', duration: number = 4000): void => {
  const container = document.getElementById('notification-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `notification-toast ${type}`;

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <span class="notification-icon">${icons[type]}</span>
    <span class="notification-message">${message}</span>
    <button class="notification-close" aria-label="Close">×</button>
  `;

  container.appendChild(toast);

  // Auto-remove after duration
  const autoRemove = setTimeout(() => {
    removeNotification(toast);
  }, duration);

  // Manual close button
  const closeBtn = toast.querySelector('.notification-close');
  closeBtn?.addEventListener('click', () => {
    clearTimeout(autoRemove);
    removeNotification(toast);
  });
};

const removeNotification = (toast: HTMLElement): void => {
  toast.classList.add('hiding');
  setTimeout(() => {
    toast.remove();
  }, 300);
};

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, action: '', userId: '', username: '' });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = 'login.html';
        return;
      }

      const res = await fetch(`${API_BASE}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401 || res.status === 403) {
        // Unauthorized or forbidden - redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        window.location.href = 'login.html';
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch users: ${res.status}`);
      }

      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (action: 'ban' | 'unban' | 'warn' | 'delete', user: User) => {
    setModal({ isOpen: true, action, userId: user._id, username: user.username });
  };

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  const executeAction = async () => {
    closeModal();
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    let url = '';
    let method = 'POST';

    if (modal.action === 'ban' || modal.action === 'unban') {
      // Both ban and unban use the same endpoint (it toggles the status)
      url = `${API_BASE}/api/users/${modal.userId}/ban`;
    } else if (modal.action === 'warn') {
      url = `${API_BASE}/api/users/${modal.userId}/warn`;
    } else if (modal.action === 'delete') {
      url = `${API_BASE}/api/users/${modal.userId}`;
      method = 'DELETE';
    }

    if (url) {
      try {
        const res = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (res.status === 401 || res.status === 403) {
          // Unauthorized or forbidden - redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('isAdmin');
          window.location.href = 'login.html';
          return;
        }

        if (!res.ok) {
          throw new Error(`Action failed: ${res.status}`);
        }

        // Refresh user list after successful action
        fetchUsers();
        showNotification('Action completed successfully', 'success');
      } catch (err) {
        console.error('Error executing action:', err);
        showNotification('Failed to execute action. Please try again.', 'error');
      }
    }
  };

  const getModalContent = () => {
    switch (modal.action) {
      case 'ban': return { title: 'Ban User?', text: `Ban ${modal.username}?`, btnColor: '#dc2626' };
      case 'unban': return { title: 'Unban User?', text: `Unban ${modal.username}?`, btnColor: '#16a34a' };
      case 'warn': return { title: 'Warn User?', text: `Warn ${modal.username}?`, btnColor: '#f59e0b' };
      case 'delete': return { title: 'Delete User?', text: `Permanently delete ${modal.username}?`, btnColor: '#dc2626' };
      default: return { title: '', text: '', btnColor: '' };
    }
  };
  
  const content = getModalContent();

  return (
    <div className="admin-panel">
        <h2>User Management</h2>
        <table>
          <thead>
            <tr>
              <th></th><th>Username</th><th>Email</th><th>Joined</th><th>Points</th><th>Warnings</th><th>Actions</th><th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{textAlign: 'center'}}>Loading...</td></tr> : users.map(user => (
              <React.Fragment key={user._id}>
              <tr>
                <td><button className='expandButton' onClick={() => toggleExpand(user._id)}>{expanded[user._id] ? '▾' : '›'}</button></td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{new Date(user.join_date).toLocaleDateString()}</td>
                <td>{user.total_points || 0}</td>
                <td>{user.warnCount || 0}</td>
                <td style={{textAlign: 'center'}}>
                  {user.isBanned ? (
                    <button onClick={() => openModal('unban', user)} className="btn-action" style={{background: '#16a34a'}}>Unban</button>
                  ) : (
                    <>
                      <button onClick={() => openModal('ban', user)} className="btn-action" style={{background: 'red'}}>Ban</button>
                      <button onClick={() => openModal('warn', user)} className="btn-action" style={{background: 'orange'}}>Warn</button>
                    </>
                  )}
                </td>
                <td style={{textAlign: 'center'}}>
                  <button onClick={() => openModal('delete', user)} className="btn-delete">X</button>
                </td>
              </tr>

              {expanded[user._id] && (
                <tr id={`details-${user._id}`} className="details-row">
                  <td colSpan={8} className="details-cell">
                    <div className="details-grid">
                      <div><strong>User ID:</strong> {user.user_id}</div>
                      <div><strong>Current Streak:</strong> {user.current_streak}</div>
                      <div><strong>Total Tasks Completed:</strong> {user.total_tasks_completed}</div>
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {modal.isOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal-box">
            <h3 className="modal-title">{content.title}</h3>
            <p className="modal-text">{content.text}</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="btn-confirm" onClick={executeAction} style={{ backgroundColor: content.btnColor }}>Yes, Do it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminDashboard;