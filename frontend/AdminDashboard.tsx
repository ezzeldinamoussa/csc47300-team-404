import React, { useState, useEffect } from 'react';
import './style.css';
import './admin.css'; // Importing your CSS ensures it gets bundled

interface User {
  _id: string;
  username: string;
  email: string;
  join_date: string;
  total_points: number;
  warnCount: number;
  isBanned: boolean;
}

interface ModalState {
  isOpen: boolean;
  action: 'ban' | 'warn' | 'delete' | '';
  userId: string;
  username: string;
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, action: '', userId: '', username: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (action: 'ban' | 'warn' | 'delete', user: User) => {
    setModal({ isOpen: true, action, userId: user._id, username: user.username });
  };

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  const executeAction = async () => {
    closeModal();
    let url = '';
    let method = 'POST';

    if (modal.action === 'ban') url = `http://localhost:5000/api/users/${modal.userId}/ban`;
    else if (modal.action === 'warn') url = `http://localhost:5000/api/users/${modal.userId}/warn`;
    else if (modal.action === 'delete') {
      url = `http://localhost:5000/api/users/${modal.userId}`;
      method = 'DELETE';
    }

    if (url) {
      await fetch(url, { method });
      fetchUsers();
    }
  };

  const getModalContent = () => {
    switch (modal.action) {
      case 'ban': return { title: 'Ban User?', text: `Ban ${modal.username}?`, btnColor: '#dc2626' };
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
              <th>Username</th><th>Email</th><th>Joined</th><th>Points</th><th>Warnings</th><th>Actions</th><th>Delete?</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{textAlign: 'center'}}>Loading...</td></tr> : users.map(user => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{new Date(user.join_date).toLocaleDateString()}</td>
                <td>{user.total_points || 0}</td>
                <td>{user.warnCount || 0}</td>
                <td>
                  {user.isBanned ? <span style={{color: 'red'}}>BANNED</span> : (
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