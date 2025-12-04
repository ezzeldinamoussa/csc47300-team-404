// frontend/admin.ts

let targetUserId: string = '';
let targetAction: string = ''; // 'ban', 'warn', or 'delete'

document.addEventListener('DOMContentLoaded', () => {
    fetchUsers();
});

async function fetchUsers() {
    const list = document.getElementById('user-list');
    if (!list) return;

    try {
        const res = await fetch('http://localhost:5000/api/users');
        const users = await res.json();
        list.innerHTML = ''; 

        users.forEach((user: any) => {
            const tr = document.createElement('tr');
            const dateJoined = new Date(user.join_date).toLocaleDateString();
            
            // 1. Actions Column
            const actions = user.isBanned 
                ? `<span style="color:red; font-weight:bold;">BANNED</span>`
                : `<button onclick="showModal('ban', '${user._id}', '${user.username}')" class="btn-action" style="background:red;">Ban</button> 
                   <button onclick="showModal('warn', '${user._id}', '${user.username}')" class="btn-action" style="background:orange;">Warn</button>`;

            // 2. Delete Column
            const deleteBtn = `<button onclick="showModal('delete', '${user._id}', '${user.username}')" class="btn-delete">X</button>`;

            tr.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${dateJoined}</td>
                <td>${user.total_points || 0}</td>
                <td>${user.warnCount || 0}</td>
                <td>${actions}</td>
                <td style="text-align:center;">${deleteBtn}</td>
            `;
            list.appendChild(tr);
        });
    } catch (err) { console.error(err); }
}


// Confirmation logic
(window as any).showModal = (action: string, id: string, username: string) => {
    targetAction = action;
    targetUserId = id;

    const modal = document.getElementById('confirmation-modal');
    const title = document.getElementById('modal-title');
    const text = document.getElementById('modal-text');
    const confirmBtn = document.getElementById('btn-confirm-action');

    if (!modal || !title || !text || !confirmBtn) return;

    if (action === 'ban') {
        title.textContent = 'Ban User?';
        text.textContent = `Are you sure you want to BAN ${username}?`;
        confirmBtn.style.backgroundColor = '#dc2626'; 
    } else if (action === 'warn') {
        title.textContent = 'Warn User?';
        text.textContent = `Send a warning to ${username}?`;
        confirmBtn.style.backgroundColor = '#f59e0b'; 
    } else if (action === 'delete') {
        title.textContent = 'Delete User?';
        text.textContent = `PERMANENTLY delete ${username}? This cannot be undone.`;
        confirmBtn.style.backgroundColor = '#dc2626'; 
    }

    modal.style.display = 'flex'; 
};

(window as any).closeModal = () => {
    const modal = document.getElementById('confirmation-modal');
    if (modal) modal.style.display = 'none';
};

(window as any).executeAction = async () => {
    (window as any).closeModal();

    let url = '';
    let method = 'POST';

    if (targetAction === 'ban') {
        url = `http://localhost:5000/api/users/${targetUserId}/ban`;
    } else if (targetAction === 'warn') {
        url = `http://localhost:5000/api/users/${targetUserId}/warn`;
    } else if (targetAction === 'delete') {
        url = `http://localhost:5000/api/users/${targetUserId}`;
        method = 'DELETE';
    }

    if (url) {
        await fetch(url, { method: method });
        fetchUsers(); 
    }
};