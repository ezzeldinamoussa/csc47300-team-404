import React, { useState, useEffect } from 'react';
import './style.css';
import './admin.css'; 
import { API_BASE } from './config.js'; 

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
  action: 'ban' | 'warn' | 'delete' | 'restore' | 'unban' | ''; 
  userId: string; 
  username: string;
}

// 🛑 NEW: State for the Create Admin Modal 🛑
interface CreateAdminModalState {
    isOpen: boolean;
    username: string;
    email: string;
    password: string;
    adminLevel: number;
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
  
  const [createAdminModal, setCreateAdminModal] = useState<CreateAdminModalState>({ 
    isOpen: false, 
    username: '', 
    email: '', 
    password: '', 
    adminLevel: 1 
  }); 

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
        if (!res.ok) throw new Error(`Failed to fetch ${key}`);
        const data: User[] = await res.json();
        setters[key as AdminTab]!(data);
        return data;
      } catch (err) {
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
  
  const openCreateAdminModal = () => {
      setCreateAdminModal({ isOpen: true, username: '', email: '', password: '', adminLevel: 1 });
  };
  const closeCreateAdminModal = () => {
      setCreateAdminModal(prev => ({ ...prev, isOpen: false }));
  };

  const executeAction = async () => {
    closeModal();
    const token = localStorage.getItem('token');
    if (!token) { handleUnauthorized(); return; }

    let url = '';
    let method = 'POST';
    let bodyData: any = {};

    if (modal.action === 'ban' || modal.action === 'unban') {
      url = `${API_BASE}/api/users/${modal.userId}/ban`; 
      bodyData = { isBanned: modal.action === 'ban' };
    }
    else if (modal.action === 'warn') url = `${API_BASE}/api/users/${modal.userId}/warn`;
    else if (modal.action === 'delete') {
      url = `${API_BASE}/api/users/${modal.userId}`;
      method = 'DELETE';
    } else if (modal.action === 'restore') { 
      url = `${API_BASE}/api/users/${modal.userId}/restore`; 
      method = 'POST';
    }

    if (url) {
      try {
        const res = await fetch(url, {
          method,
          body: method === 'DELETE' ? undefined : JSON.stringify(bodyData),
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (res.status === 401) { handleUnauthorized(); return; }
        if (modal.action === 'delete' && res.status === 403) {
            alert('🚫 Deletion Failed: Only Admin Level 2 users can soft-delete accounts.');
            return; 
        }
        if (res.status === 403) { alert('🚫 Action Forbidden.'); return; }
        if (!res.ok) throw new Error(`Action failed`);
        fetchAllUsers();
      } catch (err) {
        alert('An error occurred.');
      }
    }
  };

  const executeCreateAdmin = async () => {
      const { username, email, password, adminLevel: level } = createAdminModal;
      closeCreateAdminModal();
      if (!username || !email || !password || !level) {
          alert('All fields required.');
          return;
      }
      const token = localStorage.getItem('token');
      try {
          const res = await fetch(`${API_BASE}/api/admin/create-admin`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, email, password, adminLevel: level })
          });
          if (res.status === 403) alert('🚫 Creation Failed: Level 2 privilege required.');
          const result = await res.json();
          if (res.ok) { alert(`Success: ${result.msg}`); fetchAllUsers(); }
      } catch (err) { alert('Error during admin creation.'); }
  };

  const getModalContent = () => {
    switch (modal.action) {
      case 'ban': return { title: 'Confirm Ban?', text: `Ban ${modal.username}?`, btnColor: '#dc2626' };
      case 'unban': return { title: 'Confirm Unban?', text: `Unban ${modal.username}?`, btnColor: '#10b981' };
      case 'warn': return { title: 'Warn User?', text: `Send warning to ${modal.username}?`, btnColor: '#f59e0b' };
      case 'delete': return { title: 'Soft Delete?', text: `Soft delete ${modal.username}?`, btnColor: '#dc2626' };
      case 'restore': return { title: 'Restore User?', text: `Restore ${modal.username}?`, btnColor: '#10b981' };
      default: return { title: '', text: '', btnColor: '' };
    }
  };

  const content = getModalContent();
  const activeData = activeTab === 'currentUsers' ? currentUsers : activeTab === 'deletedUsers' ? deletedUsers : activeTab === 'currentAdmins' ? currentAdmins : deletedAdmins;
  
  const isAdminTab = activeTab.includes('Admins');
  const isDeletedTab = activeTab.includes('deleted');
  const tableColSpan = isAdminTab ? 7 : 9;

  return (
    <div className="admin-panel">
        <h2>User Management Overview</h2>

        <div className="tab-navigation">
          <button className={activeTab === 'currentUsers' ? 'nav-button active-tab' : 'nav-button'} onClick={() => setActiveTab('currentUsers')}>Current Users</button>
          <button className={activeTab === 'currentAdmins' ? 'nav-button active-tab' : 'nav-button'} onClick={() => setActiveTab('currentAdmins')}>Current Admins</button>
          {adminLevel >= 2 && (
            <>
              <button className={activeTab === 'deletedUsers' ? 'nav-button active-tab' : 'nav-button'} onClick={() => setActiveTab('deletedUsers')}>Deleted Users</button>
              <button className={activeTab === 'deletedAdmins' ? 'nav-button active-tab' : 'nav-button'} onClick={() => setActiveTab('deletedAdmins')}>Deleted Admins</button>
            </>
          )}
        </div>
        
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <h3>{activeTab.replace(/([A-Z])/g, ' $1').trim()} ({activeData.length})</h3>
          {adminLevel >= 2 && <button onClick={openCreateAdminModal} className="btn-action" style={{backgroundColor: '#059669', padding: '10px 20px'}}>+ Create New Admin</button>}
        </div>

        <table>
          <thead>
            <tr>
              <th></th>
              <th>Username</th><th>Email</th><th>Joined</th>
              {!isAdminTab && <><th>Points</th><th>Warnings</th></>}
              <th>{isAdminTab ? 'Level' : 'Status'}</th>
              {!isAdminTab && !isDeletedTab && <th>Actions</th>}
              {adminLevel >= 2 && <th>Manage</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={tableColSpan} style={{textAlign: 'center'}}>Loading...</td></tr>
            ) : activeData.length === 0 ? (
              <tr><td colSpan={tableColSpan} style={{textAlign: 'center'}}>No results found.</td></tr>
            ) : ( activeData.map(user => (
              <React.Fragment key={user._id}>
              <tr>
                <td><button className='expandButton' onClick={() => toggleExpand(user._id)}>{expanded[user._id] ? '▾' : '›'}</button></td>
                <td>{user.username}</td><td>{user.email}</td><td>{new Date(user.join_date).toLocaleDateString()}</td>
                {!isAdminTab && <><td>{user.total_points || 0}</td><td>{user.warnCount || 0}</td></>}
                <td>{isAdminTab ? `Level ${user.adminLevel}` : (user.isBanned ? 'Banned' : 'Active')}</td>
                
                {!isAdminTab && !isDeletedTab && (
                  <td style={{textAlign: 'center', minWidth: '150px'}}>
                    {user.isBanned ? (
                        <button onClick={() => openModal('unban', user)} className="btn-action" style={{background: '#10b981'}}>Unban</button>
                    ) : (
                      <><button onClick={() => openModal('ban', user)} className="btn-action" style={{background: 'red'}}>Ban</button><button onClick={() => openModal('warn', user)} className="btn-action" style={{background: 'orange'}}>Warn</button></>
                    )}
                  </td>
                )}

                {adminLevel >= 2 && (
                  <td style={{textAlign: 'center'}}>
                    {isDeletedTab ? (
                      <button onClick={() => openModal('restore', user)} className="btn-action" style={{background: 'green'}}>Restore</button>
                    ) : (
                      <button onClick={() => openModal('delete', user)} className="btn-delete">Demote/Delete</button>
                    )}
                  </td>
                )}
              </tr>
              {expanded[user._id] && (
                <tr className="details-row">
                  <td colSpan={tableColSpan} className="details-cell">
                    <div className="details-grid">
                      <div><strong>User ID:</strong> {user.user_id}</div>
                      <div><strong>Current Streak:</strong> {user.current_streak}</div>
                      <div><strong>Total Tasks:</strong> {user.total_tasks_completed}</div>
                    </div>
                  </td>
                </tr>
              )}
              </React.Fragment>
            )))}
          </tbody>
        </table>

        {modal.isOpen && (
        <div className="modal-overlay"> 
          <div className="modal-box">
            <h3 className="modal-title">{content.title}</h3>
            <p className="modal-text">{content.text}</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={closeModal}>Cancel</button>
              <button className="btn-confirm" onClick={executeAction} style={{ backgroundColor: content.btnColor }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

        {createAdminModal.isOpen && (
            <div className="modal-overlay">
                <div className="modal-box">
                    <h3 className="modal-title">Create New Admin</h3>
                    <div className="admin-form-group"><label>Username</label><input type="text" value={createAdminModal.username} onChange={(e) => setCreateAdminModal({...createAdminModal, username: e.target.value})}/></div>
                    <div className="admin-form-group"><label>Email</label><input type="email" value={createAdminModal.email} onChange={(e) => setCreateAdminModal({...createAdminModal, email: e.target.value})}/></div>
                    <div className="admin-form-group"><label>Password</label><input type="password" value={createAdminModal.password} onChange={(e) => setCreateAdminModal({...createAdminModal, password: e.target.value})}/></div>
                    <div className="admin-form-group"><label>Admin Level</label>
                        <select value={createAdminModal.adminLevel} onChange={(e) => setCreateAdminModal({...createAdminModal, adminLevel: parseInt(e.target.value, 10)})}>
                            <option value={1}>Level 1 (Moderator)</option>
                            <option value={2}>Level 2 (Super Admin)</option>
                        </select>
                    </div>
                    <div className="modal-buttons">
                        <button className="btn-cancel" onClick={closeCreateAdminModal}>Cancel</button>
                        <button className="btn-confirm" onClick={executeCreateAdmin} style={{ backgroundColor: '#059669' }}>Create Admin</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
export default AdminDashboard;