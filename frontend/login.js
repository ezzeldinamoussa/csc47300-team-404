// frontend/login.js
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');

  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault(); // Prevent default form submission

      const formData = new FormData(this);
      // Note: The form input name for username/email is 'username'
      const data = Object.fromEntries(formData.entries());

      try {
        // Make sure your backend is running on http://localhost:5000
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
          // Login successful
          // 1. Save the token
          localStorage.setItem('token', result.token);

          // 2. Redirect to the main app page
          window.location.href = 'tasks.html';
        } else {
          // Show error message from backend
          alert('Error: ' + result.msg);
        }
      } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred. Please try again.');
      }
    });
  }
});
