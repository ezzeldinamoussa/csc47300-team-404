// frontend/signup.js
document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');

  if (signupForm) {
    signupForm.addEventListener('submit', async function (e) {
      e.preventDefault(); // Prevent default form submission

      // Get form data
      const formData = new FormData(this);
      const data = Object.fromEntries(formData.entries());

      try {
        // Send data to the backend
        // Make sure your backend is running on http://localhost:5000
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
          alert(result.msg); // "User registered successfully! Please login."
          // Redirect to login page
          window.location.href = 'login.html';
        } else {
          // Show error message from backend
          alert('Error: ' + result.msg);
        }
      } catch (error) {
        console.error('Signup error:', error);
        alert('An error occurred. Please try again.');
      }
    });
  }
});
