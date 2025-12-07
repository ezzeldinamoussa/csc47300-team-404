import { API_BASE } from './config.js';

interface LeaderboardUser {
  username: string;
  total_points: number;
  current_streak: number;
  highest_streak: number;
  isBanned?: boolean;
  isDeleted?: boolean;
}

interface SearchResult {
  exists: boolean;
  username?: string;
  isFriend?: boolean;
  hasIncomingRequest?: boolean;
  hasOutgoingRequest?: boolean;
  canSendRequest?: boolean;
  isDeleted?: boolean;
}

// Get auth token
function getToken(): string | null {
  return localStorage.getItem('token');
}

// Check if user is logged in
function checkAuth(): void {
  const token = getToken();
  if (!token) {
    window.location.href = 'login.html';
  }
}

// Notification system
type NotificationType = 'success' | 'error' | 'info';

function showNotification(message: string, type: NotificationType = 'info', duration: number = 4000): void {
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

  const autoRemove = setTimeout(() => {
    removeNotification(toast);
  }, duration);

  const closeBtn = toast.querySelector('.notification-close');
  closeBtn?.addEventListener('click', () => {
    clearTimeout(autoRemove);
    removeNotification(toast);
  });
}

function removeNotification(toast: HTMLElement): void {
  toast.classList.add('hiding');
  setTimeout(() => {
    toast.remove();
  }, 300);
}

let currentUsername: string | null = null;

async function getCurrentUsername(): Promise<string | null> {
  if (currentUsername) return currentUsername;

  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/api/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      currentUsername = data.username;
      return currentUsername;
    }
  } catch (err) {
    console.error('Error fetching current username:', err);
  }
  return null;
}

async function fetchLeaderboard(): Promise<void> {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/friends/leaderboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    if (!res.ok) {
      throw new Error('Failed to fetch leaderboard');
    }

    const users: LeaderboardUser[] = await res.json();
    const username = await getCurrentUsername();
    displayLeaderboard(users, username);
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
  }
}

function displayLeaderboard(users: LeaderboardUser[], currentUsername: string | null): void {
  const list = document.querySelector('.people-list ol');
  if (!list) return;

  list.innerHTML = '';

  if (users.length === 0) {
    list.innerHTML = '<li style="padding: 20px; text-align: center; color: #666;">No friends yet. Add friends to see the leaderboard!</li>';
    return;
  }

  users.forEach((user) => {
    const isCurrentUser = currentUsername && user.username === currentUsername;

    let statusLabel = '';
    let statusColor = '';
    if (user.isDeleted) {
      statusLabel = ' (Deleted)';
      statusColor = '#dc2626';
    } else if (user.isBanned) {
      statusLabel = ' (Banned)';
      statusColor = '#f59e0b';
    }

    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <span class="name">
          ${user.username}${isCurrentUser ? ' (You)' : ''}
          ${statusLabel ? `<span style="color: ${statusColor}; font-weight: 600; margin-left: 4px;">${statusLabel}</span>` : ''}
        </span>
        <div style="font-size: 12px; color: #666; margin-top: 4px;">
          ${user.current_streak} day streak | Best: ${user.highest_streak}
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="pts">${user.total_points} pts</span>
        ${!isCurrentUser ? `<button class="remove-friend-btn" data-username="${user.username}" style="padding: 4px 8px; font-size: 12px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove</button>` : ''}
      </div>
    `;
    list.appendChild(li);
  });

  document.querySelectorAll('.remove-friend-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const username = (e.target as HTMLElement).getAttribute('data-username');
      if (username) {
        await removeFriend(username);
      }
    });
  });
}

function updateSearchResults(result: SearchResult): void {
  const searchResults = document.getElementById('search-results');
  if (!searchResults) return;

  // 🛑 FIX: Treat deleted accounts or non-existent accounts as "User not found" 🛑
  if (!result.exists || result.isDeleted) {
    searchResults.innerHTML = '<p style="color: #dc2626;">User not found</p>';
    return;
  }

  if (result.isFriend) {
    searchResults.innerHTML = `<p style="color: #666;">Already friends with ${result.username}</p>`;
  } else if (result.hasOutgoingRequest) {
    searchResults.innerHTML = `<p style="color: #666;">Friend request already sent to ${result.username}</p>`;
  } else if (result.hasIncomingRequest) {
    searchResults.innerHTML = `
      <div>
        <p style="margin-bottom: 8px;">${result.username} has sent you a friend request!</p>
        <button id="accept-search-btn" style="padding: 6px 12px; background: #16a34a; color: white; border: none; border-radius: 4px; cursor: pointer;">Accept</button>
      </div>
    `;
    document.getElementById('accept-search-btn')?.addEventListener('click', async () => {
      await acceptFriendRequest(result.username!);
      const searchInput = document.getElementById('friend-search-input') as HTMLInputElement;
      if (searchInput) searchInput.value = '';
      searchResults.innerHTML = '';
    });
  } else if (result.canSendRequest) {
    searchResults.innerHTML = `
      <div>
        <p style="margin-bottom: 8px;">Found: ${result.username}</p>
        <button id="send-request-btn" style="padding: 6px 12px; background: #7c3aed; color: white; border: none; border-radius: 4px; cursor: pointer;">Send Friend Request</button>
      </div>
    `;
    document.getElementById('send-request-btn')?.addEventListener('click', async () => {
      const success = await sendFriendRequest(result.username!);
      if (success) {
        const searchInput = document.getElementById('friend-search-input') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
        searchResults.innerHTML = '';
      }
    });
  }
}

async function searchUser(username: string): Promise<SearchResult | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/api/friends/search?username=${encodeURIComponent(username)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      window.location.href = 'login.html';
      return null;
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error searching user:', err);
    return null;
  }
}

async function sendFriendRequest(username: string): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE}/api/friends/request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    });

    const data = await res.json();

    if (!res.ok) {
      showNotification(data.msg || 'Failed to send request', 'error');
      return false;
    }

    if (data.autoAccepted) {
      showNotification('Friend request auto-accepted! You are now friends!', 'success');
      fetchLeaderboard();
      fetchFriendRequests();
    } else {
      showNotification('Friend request sent!', 'success');
    }
    return true;
  } catch (err) {
    console.error('Error sending friend request:', err);
    showNotification('Failed to send friend request.', 'error');
    return false;
  }
}

async function fetchFriendRequests(): Promise<void> {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/friends/requests`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.ok) {
      const requests: string[] = await res.json();
      displayFriendRequests(requests);
    }
  } catch (err) {
    console.error('Error fetching friend requests:', err);
  }
}

function displayFriendRequests(requests: string[]): void {
  const container = document.getElementById('friend-requests-container');
  if (!container) return;

  if (requests.length === 0) {
    container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No pending requests</p>';
    return;
  }

  container.innerHTML = requests.map(username => `
    <div class="friend-request-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid #e6e6e6;">
      <span style="font-weight: 600;">${username}</span>
      <div style="display: flex; gap: 8px;">
        <button class="accept-btn" data-username="${username}" style="padding: 6px 12px; background: #16a34a; color: white; border: none; border-radius: 4px; cursor: pointer;">Accept</button>
        <button class="deny-btn" data-username="${username}" style="padding: 6px 12px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer;">Deny</button>
      </div>
    </div>
  `).join('');

  document.querySelectorAll('.accept-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const username = (e.target as HTMLElement).getAttribute('data-username');
      if (username) await acceptFriendRequest(username);
    });
  });

  document.querySelectorAll('.deny-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const username = (e.target as HTMLElement).getAttribute('data-username');
      if (username) await denyFriendRequest(username);
    });
  });
}

async function acceptFriendRequest(username: string): Promise<void> {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/api/friends/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    });

    if (res.ok) {
      showNotification('Friend request accepted!', 'success');
      fetchLeaderboard();
      fetchFriendRequests();
    }
  } catch (err) {
    console.error('Error accepting friend request:', err);
  }
}

async function denyFriendRequest(username: string): Promise<void> {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/api/friends/deny`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    });

    if (res.ok) {
      showNotification('Friend request denied', 'info');
      fetchFriendRequests();
    }
  } catch (err) {
    console.error('Error denying friend request:', err);
  }
}

async function removeFriend(username: string): Promise<void> {
  const confirmed = await showConfirmModal(`Remove ${username}?`, 'Remove Friend');
  if (!confirmed) return;

  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/api/friends/remove`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    });

    if (res.ok) {
      showNotification('Removed friend', 'info');
      fetchLeaderboard();
    }
  } catch (err) {
    console.error('Error removing friend:', err);
  }
}

function showConfirmModal(message: string, title: string = 'Confirm Action'): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-modal-title');
    const messageEl = document.getElementById('confirm-modal-message');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    const confirmBtn = document.getElementById('confirm-modal-confirm');

    if (!modal || !titleEl || !messageEl || !cancelBtn || !confirmBtn) {
      resolve(false);
      return;
    }

    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.style.display = 'flex';

    cancelBtn.onclick = () => {
      modal.style.display = 'none';
      resolve(false);
    };

    confirmBtn.onclick = () => {
      modal.style.display = 'none';
      resolve(true);
    };
  });
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  fetchLeaderboard();
  fetchFriendRequests();

  const searchInput = document.getElementById('friend-search-input') as HTMLInputElement;
  const searchBtn = document.getElementById('friend-search-btn');

  searchBtn?.addEventListener('click', async () => {
    const username = searchInput.value.trim();
    if (!username) return;

    const resultsDiv = document.getElementById('search-results');
    if (resultsDiv) resultsDiv.innerHTML = '<p>Searching...</p>';

    const result = await searchUser(username);
    if (result) updateSearchResults(result);
  });
});