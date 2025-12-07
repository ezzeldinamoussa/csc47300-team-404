import React, { useState, useEffect } from 'react';
import './style.css';
import './admin.css'; // Importing your CSS ensures it gets bundled
import { API_BASE } from './config.js'; // Using the configurable API base URL

// Define the type for the four sections
type AdminTab = 'currentUsers' | 'deletedUsers' | 'currentAdmins' | 'deletedAdmins';

interface User {
  _id: string;
  username: string;
  email: string;
  join_date: string;
  total_points: number;
  warnCount: number;
  isBanned: boolean;
  isAdmin: boolean; 
  adminLevel: number; 
  current_streak: number; 
  total_tasks_completed: number; 
  user_id: string; 
}

interface ModalState {
  isOpen: boolean;
  action: 'ban' | 'warn' | 'delete' | 'restore' | 'unban' | ''; // Added 'unban'
  userId: string; // Mongoose _id
  username: string;
}

const AdminDashboard: React.FC = () => {
  const [currentUsers, setCurrentUsers] = useState<User[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<User[]>([]);
  const [currentAdmins, setCurrentAdmins] = useState<User[]>([]);
  const [deletedAdmins, setDeletedAdmins] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('currentUsers');

  const [loading, setLoading] = useState<boolean>(true);
  const [modal, setModal] = useState<ModalState>({ isOpen: false, action: '', userId: '', username: '' });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({}); 
  const [adminLevel, setAdminLevel] = useState<number>(0); 

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    const level = parseInt(localStorage.getItem('adminLevel') || '0', 10);
    setAdminLevel(level);

    if (level === 1 && (activeTab === 'deletedUsers' || activeTab === 'deletedAdmins')) {
        setActiveTab('currentUsers');
    }

    fetchAllUsers(); 
  }, [adminLevel, activeTab]); 

  const handleUnauthorized = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminLevel');
    window.location.href = 'login.html';
  };

  const fetchAllUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      handleUnauthorized();
      return;
    }
    
    const urls: Partial<Record<AdminTab, string>> = {};
    const setters: Partial<Record<AdminTab, React.Dispatch<React.SetStateAction<User[]>>>> = {};

    urls.currentUsers = `${API_BASE}/api/admin/data/current-users`; setters.currentUsers = setCurrentUsers;
    urls.currentAdmins = `${API_BASE}/api/admin/data/current-admins`; setters.currentAdmins = setCurrentAdmins;

    if (adminLevel >= 2) {
        urls.deletedUsers = `${API_BASE}/api/admin/data/deleted-users`; setters.deletedUsers = setDeletedUsers;
        urls.deletedAdmins = `${API_BASE}/api/admin/data/deleted-admins`; setters.deletedAdmins = setDeletedAdmins;
    }

    const fetches = Object.entries(urls).map(async ([key, url]) => {
      try {
        const res = await fetch(url!, { headers: { 'Authorization': `Bearer ${token}` } });
        
        if (res.status === 401) {
          handleUnauthorized();
          return [];
        }
        
        if (res.status === 403) {
            setters[key as AdminTab]!([]); 
            return []; 
        }

        if (!res.ok) {
          throw new Error(`Failed to fetch ${key}: ${res.status}`);
        }
        const data: User[] = await res.json();
        setters[key as AdminTab]!(data);
        return data;
      } catch (err) {
        console.error(`Error fetching ${key}:`, err);
        return [];
      }
    });

    await Promise.all(fetches);
    setLoading(false);
  };

  const openModal = (action: 'ban' | 'warn' | 'delete' | 'restore' | 'unban', user: User) => {
    setModal({ isOpen: true, action, userId: user._id, username: user.username });
  };

  const closeModal = () => setModal(prev => ({ ...prev, isOpen: false }));

  const executeAction = async () => {
    closeModal();
    const token = localStorage.getItem('token');
    if (!token) {
      handleUnauthorized();
      return;
    }

    let url = '';
    let method = 'POST';
    let action = modal.action;

    // 🛑 NEW: 'ban' and 'unban' use the same base route but may imply different payloads/logic 🛑
    if (action === 'ban' || action === 'unban') url = `${API_BASE}/api/users/${modal.userId}/ban`; 
    else if (action === 'warn') url = `${API_BASE}/api/users/${modal.userId}/warn`;
    else if (action === 'delete') {
      url = `${API_BASE}/api/users/${modal.userId}`;
      method = 'DELETE';
    } else if (action === 'restore') { 
      url = `${API_BASE}/api/users/${modal.userId}/restore`; 
      method = 'POST';
    }

    if (url) {
      try {
        const res = await fetch(url, {
          method,
          // 🛑 NEW: Send the required action (true/false) in the body for the /ban route 🛑
          body: JSON.stringify({ isBanned: action === 'ban' }),
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });

        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        
        if (modal.action === 'delete' && res.status === 403) {
            alert('🚫 Deletion Failed: Only Admin Level 2 users can soft-delete user accounts.');
            return; 
        }
        
        if (res.status === 403) {
            alert('🚫 Action Failed: You do not have the required admin privilege for this action.');
            return;
        }

        if (!res.ok) {
          throw new Error(`Action failed: ${res.status}`);
        }
        
        const result = await res.json();
        alert(`Success: ${result.msg || 'Action executed successfully.'}`);

        fetchAllUsers();
      } catch (err) {
        console.error('Error executing action:', err);
        alert('A server error occurred. Please check the console.');
      }
    }
  };

  const getModalContent = () => {
    switch (modal.action) {
      case 'ban': return { title: 'Confirm Ban?', text: `Are you sure you want to BAN ${modal.username}?`, btnColor: '#dc2626' };
      case 'unban': return { title: 'Confirm Unban?', text: `Are you sure you want to UNBAN ${modal.username}?`, btnColor: '#10b981' };
      case 'warn': return { title: 'Warn User?', text: `Send warning to ${modal.username}? (Warning count will increase)`, btnColor: '#f59e0b' };
      case 'delete': return { title: 'Soft Delete User?', text: `Soft delete ${modal.username}? This is an Admin Level 2 action.`, btnColor: '#dc2626' };
      case 'restore': return { title: 'Restore User?', text: `Restore ${modal.username} from soft-delete?`, btnColor: '#10b981' };
      default: return { title: '', text: '', btnColor: '' };
    }
  };
  
  const content = getModalContent();

  const getActiveData = (): User[] => {
    switch (activeTab) {
      case 'currentUsers': return currentUsers;
      case 'deletedUsers': return deletedUsers;
      case 'currentAdmins': return currentAdmins;
      case 'deletedAdmins': return deletedAdmins;
      default: return [];
    }
  };

  const activeData = getActiveData();

  return (
    <div className="admin-panel">
        <h2>User Management Overview</h2>

        <div className="tab-navigation">
          <button 
            className={activeTab === 'currentUsers' ? 'nav-button active-tab' : 'nav-button'} 
            onClick={() => setActiveTab('currentUsers')}
          >
            Current Users
          </button>
          <button 
            className={activeTab === 'currentAdmins' ? 'nav-button active-tab' : 'nav-button'} 
            onClick={() => setActiveTab('currentAdmins')}
          >
            Current Admins
          </button>
          
          {adminLevel >= 2 && (
            <>
              <button 
                className={activeTab === 'deletedUsers' ? 'nav-button active-tab' : 'nav-button'} 
                onClick={() => setActiveTab('deletedUsers')}
              >
                Deleted Users
              </button>
              <button 
                className={activeTab === 'deletedAdmins' ? 'nav-button active-tab' : 'nav-button'} 
                onClick={() => setActiveTab('deletedAdmins')}
              >
                Deleted Admins
              </button>
            </>
          )}
        </div>
        
        <h3>{activeTab.replace(/([A-Z])/g, ' $1').trim()} ({activeData.length})</h3>

        <table>
          <thead>
            <tr>
              <th></th>
              <th>Username</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Points</th>
              <th>Warnings</th>
              <th>{activeTab.includes('Admins') ? 'Level' : 'Status'}</th>
              <th>Actions</th>
              {adminLevel >= 2 && (activeTab === 'deletedUsers' || activeTab === 'deletedAdmins' || activeTab === 'currentUsers') && <th>Delete/Restore</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{textAlign: 'center'}}>Loading...</td></tr>
            ) : activeData.length === 0 ? (
              <tr><td colSpan={9} style={{textAlign: 'center'}}>No users found in this category.</td></tr>
            ) : ( activeData.map(user => (
              <React.Fragment key={user._id}>
              <tr>
                <td><button className='expandButton' onClick={() => toggleExpand(user._id)}>{expanded[user._id] ? '▾' : '›'}</button></td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{new Date(user.join_date).toLocaleDateString()}</td>
                <td>{user.total_points || 0}</td>
                <td>{user.warnCount || 0}</td>
                <td>{activeTab.includes('Admins') ? `Level ${user.adminLevel}` : (user.isBanned ? 'Banned' : 'Active')}</td>
                <td style={{textAlign: 'center', minWidth: '150px'}}>
                  {/* Ban/Warn/Unban only for Current Users */}
                  {activeTab === 'currentUsers' && (
                    user.isBanned ? (
                        // 🛑 NEW: Unban button for banned users 🛑
                        <button onClick={() => openModal('unban', user)} className="btn-action" style={{background: '#10b981'}}>Unban</button>
                    ) : (
                      <>
                        <button onClick={() => openModal('ban', user)} className="btn-action" style={{background: 'red'}}>Ban</button>
                        <button onClick={() => openModal('warn', user)} className="btn-action" style={{background: 'orange'}}>Warn</button>
                      </>
                    )
                  )}
                  {activeTab === 'currentAdmins' && adminLevel >= 2 && (
                    <button onClick={() => openModal('delete', user)} className="btn-delete" style={{backgroundColor: '#e38400'}}>Demote/Delete</button>
                  )}
                  {activeTab === 'currentAdmins' && adminLevel === 1 && (
                      <span style={{color: '#9ca3af'}}>View Only</span>
                  )}
                </td>
                
                {adminLevel >= 2 && (activeTab === 'deletedUsers' || activeTab === 'deletedAdmins' || activeTab === 'currentUsers') && (
                  <td style={{textAlign: 'center'}}>
                    {(activeTab === 'deletedUsers' || activeTab === 'deletedAdmins') ? (
                      <button onClick={() => openModal('restore', user)} className="btn-action" style={{background: 'green'}}>Restore</button>
                    ) : (
                      <button onClick={() => openModal('delete', user)} className="btn-delete">X</button>
                    )}
                  </td>
                )}
              </tr>

              {expanded[user._id] && (
                <tr id={`details-${user._id}`} className="details-row">
                  <td colSpan={9} className="details-cell">
                    <div className="details-grid">
                      <div><strong>User ID:</strong> {user.user_id}</div>
                      <div><strong>Current Streak:</strong> {user.current_streak}</div>
                      <div><strong>Total Tasks Completed:</strong> {user.total_tasks_completed}</div>
                      {user.adminLevel > 0 && <div><strong>Admin Status:</strong> Level {user.adminLevel}</div>}
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
            )))}
          </tbody>
        </table>

        {/* 🛑 MODAL IMPLEMENTATION (Restored to Overlay) 🛑 */}
        {modal.isOpen && (
        <div className="modal-overlay"> 
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