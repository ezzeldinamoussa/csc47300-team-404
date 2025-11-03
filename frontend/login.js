// frontend/login.js
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault(); // Prevent default form submission

      const formData = new FormData(this);
      // Note: The form input name for username/email is 'username'
      const data = Object.fromEntries(formData.entries());

      try {
        // Make sure your backend is running on http://localhost:5000
        const response = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();
        const showBanner = (msg, status = "hidden", hideBanner = true) => {
          const bannerMessage = document.getElementById("bannerMessage");
          const bannerText = document.getElementById("bannerText");

          bannerText.textContent = msg;
          bannerMessage.classList.remove("hidden", "success", "error");
          bannerMessage.classList.add(status);

          clearTimeout(bannerMessage._hideTimeout);
          bannerMessage._hideTimeout = setTimeout(
            () => bannerMessage.classList.add("hidden"),
            4000
          );
        };
        if (response.ok) {
          // Login successful
          // 1. Save the token
          localStorage.setItem("token", result.token);

          // 2. Redirect to the main app page
          window.location.href = "tasks.html";
        } else {
          // Show error message from backend
          //alert("Error: " + result.msg);
          showBanner(result.msg, "error");
        }
      } catch (error) {
        console.error("Login error:", error);
        showBanner("An error occurred. Please try again.", "error");
        //alert("An error occurred. Please try again.");
      }
    });
  }
});
