import { API_BASE } from './config.js';

interface LeaderboardUser {
  username: string;
  total_points: number;
  current_streak: number;
  highest_streak: number;
}

interface SearchResult {
  exists: boolean;
  username?: string;
  isFriend?: boolean;
  hasIncomingRequest?: boolean;
  hasOutgoingRequest?: boolean;
  canSendRequest?: boolean;
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
}

function removeNotification(toast: HTMLElement): void {
  toast.classList.add('hiding');
  setTimeout(() => {
    toast.remove();
  }, 300);
}

// Get current user's username from token (we'll need to fetch it)
let currentUsername: string | null = null;

async function getCurrentUsername(): Promise<string | null> {
  if (currentUsername) return currentUsername;
  
  const token = getToken();
  if (!token) return null;

  try {
    // Decode JWT to get username (or fetch from stats endpoint)
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

// Fetch leaderboard
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
      const errorData = await res.json().catch(() => ({ msg: 'Failed to fetch leaderboard' }));
      throw new Error(errorData.msg || 'Failed to fetch leaderboard');
    }

    const users: LeaderboardUser[] = await res.json();
    const username = await getCurrentUsername();
    
    // Handle case where users array might be empty or missing expected friends
    // (This could happen if friends were deleted/banned - backend auto-cleans them)
    if (users.length === 0) {
      // This is fine - user just has no friends yet
    } else if (username) {
      // Check if current user is in the list (should always be)
      const currentUserInList = users.find(u => u.username === username);
      if (!currentUserInList) {
        console.warn('Current user not found in leaderboard results');
      }
    }
    
    displayLeaderboard(users, username);
  } catch (err: any) {
    console.error('Error fetching leaderboard:', err);
    showNotification('Failed to load leaderboard. Please refresh the page.', 'error');
  }
}

// Display leaderboard
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
    
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <span class="name">${user.username}${isCurrentUser ? ' (You)' : ''}</span>
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

  // Add event listeners for remove buttons
  document.querySelectorAll('.remove-friend-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const username = (e.target as HTMLElement).getAttribute('data-username');
      if (username) {
        await removeFriend(username);
      }
    });
  });
}

// Update search results display
function updateSearchResults(result: SearchResult): void {
  const searchResults = document.getElementById('search-results');
  if (!searchResults) return;

  if (!result.exists) {
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
        <button class="accept-btn-search" data-username="${result.username}" style="padding: 6px 12px; background: #16a34a; color: white; border: none; border-radius: 4px; cursor: pointer;">Accept</button>
      </div>
    `;
    document.querySelector('.accept-btn-search')?.addEventListener('click', async () => {
      await acceptFriendRequest(result.username!);
      const searchInput = document.getElementById('friend-search-input') as HTMLInputElement;
      if (searchInput) searchInput.value = '';
      searchResults.innerHTML = '';
    });
  } else if (result.canSendRequest) {
    searchResults.innerHTML = `
      <div>
        <p style="margin-bottom: 8px;">Found: ${result.username}</p>
        <button class="send-request-btn" data-username="${result.username}" style="padding: 6px 12px; background: #7c3aed; color: white; border: none; border-radius: 4px; cursor: pointer;">Send Friend Request</button>
      </div>
    `;
    document.querySelector('.send-request-btn')?.addEventListener('click', async () => {
      const success = await sendFriendRequest(result.username!);
      if (success) {
        const searchInput = document.getElementById('friend-search-input') as HTMLInputElement;
        if (searchInput) searchInput.value = '';
        searchResults.innerHTML = '';
      }
    });
  }
}

// Search user
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

    if (!res.ok) {
      const data = await res.json();
      if (res.status === 400) {
        return { exists: false, ...data };
      }
      throw new Error('Search failed');
    }

    return await res.json();
  } catch (err) {
    console.error('Error searching user:', err);
    return null;
  }
}

// Send friend request
async function sendFriendRequest(username: string): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  // Double-check before sending to prevent duplicate requests
  const searchResult = await searchUser(username);
  if (searchResult && searchResult.hasOutgoingRequest) {
    showNotification('Friend request already sent to this user', 'error');
    return false;
  }

  if (searchResult && searchResult.isFriend) {
    showNotification('You are already friends with this user', 'error');
    return false;
  }

  try {
    const res = await fetch(`${API_BASE}/api/friends/request`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    });

    if (res.status === 401) {
      window.location.href = 'login.html';
      return false;
    }

    if (!res.ok) {
      const data = await res.json();
      showNotification(data.msg || 'Failed to send request', 'error');
      // Refresh search results to show updated state
      const updatedResult = await searchUser(username);
      if (updatedResult) {
        updateSearchResults(updatedResult);
      }
      return false;
    }

    const data = await res.json();
    if (data.autoAccepted) {
      showNotification('Friend request auto-accepted! You are now friends!', 'success');
      fetchLeaderboard();
      fetchFriendRequests();
    } else {
      showNotification('Friend request sent!', 'success');
      // Refresh search results to show updated state (request already sent)
      const updatedResult = await searchUser(username);
      if (updatedResult) {
        updateSearchResults(updatedResult);
      }
    }
    return true;
  } catch (err) {
    console.error('Error sending friend request:', err);
    showNotification('Failed to send friend request. Please try again.', 'error');
    return false;
  }
}

// Fetch friend requests
async function fetchFriendRequests(): Promise<void> {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/friends/requests`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    if (!res.ok) {
      throw new Error('Failed to fetch requests');
    }

    const requests: string[] = await res.json();
    displayFriendRequests(requests);
  } catch (err) {
    console.error('Error fetching friend requests:', err);
  }
}

// Display friend requests
function displayFriendRequests(requests: string[]): void {
  const container = document.getElementById('friend-requests-container');
  if (!container) return;

  if (requests.length === 0) {
    container.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No pending friend requests</p>';
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

  // Add event listeners
  document.querySelectorAll('.accept-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const username = (e.target as HTMLElement).getAttribute('data-username');
      if (username) {
        await acceptFriendRequest(username);
      }
    });
  });

  document.querySelectorAll('.deny-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const username = (e.target as HTMLElement).getAttribute('data-username');
      if (username) {
        await denyFriendRequest(username);
      }
    });
  });
}

// Accept friend request
async function acceptFriendRequest(username: string): Promise<void> {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/friends/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    });

    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      showNotification(data.msg || 'Failed to accept request', 'error');
      return;
    }

    showNotification('Friend request accepted!', 'success');
    fetchLeaderboard();
    fetchFriendRequests();
  } catch (err) {
    console.error('Error accepting friend request:', err);
    showNotification('Failed to accept friend request. Please try again.', 'error');
  }
}

// Deny friend request
async function denyFriendRequest(username: string): Promise<void> {
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/friends/deny`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    });

    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      showNotification(data.msg || 'Failed to deny request', 'error');
      return;
    }

    showNotification('Friend request denied', 'info');
    fetchFriendRequests();
  } catch (err) {
    console.error('Error denying friend request:', err);
    showNotification('Failed to deny friend request. Please try again.', 'error');
  }
}

// Show confirmation modal
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

    const cleanup = () => {
      modal.style.display = 'none';
      cancelBtn.onclick = null;
      confirmBtn.onclick = null;
    };

    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };

    confirmBtn.onclick = () => {
      cleanup();
      resolve(true);
    };
  });
}

// Remove friend
async function removeFriend(username: string): Promise<void> {
  const confirmed = await showConfirmModal(
    `Remove ${username} from your friends?`,
    'Remove Friend'
  );
  
  if (!confirmed) {
    return;
  }

  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/api/friends/remove`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    });

    if (res.status === 401) {
      window.location.href = 'login.html';
      return;
    }

    if (!res.ok) {
      const data = await res.json();
      showNotification(data.msg || 'Failed to remove friend', 'error');
      return;
    }

    showNotification(`${username} removed from friends`, 'info');
    fetchLeaderboard();
  } catch (err) {
    console.error('Error removing friend:', err);
    showNotification('Failed to remove friend. Please try again.', 'error');
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  fetchLeaderboard();
  fetchFriendRequests();

  // Search functionality
  const searchInput = document.getElementById('friend-search-input') as HTMLInputElement;
  const searchBtn = document.getElementById('friend-search-btn');
  const searchResults = document.getElementById('search-results');

  if (searchBtn && searchInput && searchResults) {
    // Allow Enter key to trigger search
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchBtn.click();
      }
    });

    searchBtn.addEventListener('click', async () => {
      const username = searchInput.value.trim();
      if (!username) {
        showNotification('Please enter a username', 'error');
        return;
      }

      searchResults.innerHTML = '<p style="color: #666; text-align: center;">Searching...</p>';

      const result = await searchUser(username);
      if (!result) {
        searchResults.innerHTML = '<p style="color: #dc2626;">User not found</p>';
        return;
      }

      updateSearchResults(result);
    });
  }
});

