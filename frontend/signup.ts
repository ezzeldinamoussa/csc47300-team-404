// frontend/signup.ts
// TypeScript version of signup.js
// Handles user registration, banner feedback, and redirects to login on success

interface RegisterResponse {
  msg?: string;
}

interface BannerMessageElement extends HTMLElement {
  _hideTimeout?: number;
}

document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form") as HTMLFormElement | null;

  if (!signupForm) return;

  signupForm.addEventListener("submit", async (e: SubmitEvent) => {
    e.preventDefault(); // Stop normal form submission

    // Collect form data
    const formData = new FormData(signupForm);
    const data = Object.fromEntries(formData.entries());

    // Password confirmation check (optional safety)
    const password = data["password"];
    const confirmPassword = data["confirm-password"];
    if (password !== confirmPassword) {
      showBanner("Passwords do not match.", "error");
      return;
    }

    try {
      // Send signup request to backend
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: RegisterResponse = await response.json();

      if (response.ok) {
        // Account created successfully
        showBanner("Account created successfully!", "success");
        // Redirect after short delay
        setTimeout(() => {
          window.location.href = "login.html";
        }, 2000);
      } else {
        // Show error message from backend
        showBanner(result.msg ?? "Registration failed. Please try again.", "error");
      }
    } catch (error) {
      console.error("Signup error:", error);
      showBanner("An error occurred. Please try again.", "error");
    }
  });
});

/**
 * Displays a banner message at the top of the signup page.
 * @param msg - Message to display
 * @param status - 'success' | 'error' | 'hidden'
 */
function showBanner(msg: string, status: "success" | "error" | "hidden" = "hidden"): void {
  const bannerMessage = document.getElementById("bannerMessage") as BannerMessageElement | null;
  const bannerText = document.getElementById("bannerText") as HTMLElement | null;

  if (!bannerMessage || !bannerText) return;

  bannerText.textContent = msg;
  bannerMessage.classList.remove("hidden", "success", "error");
  bannerMessage.classList.add(status);

  // Clear any existing timeout
  if (bannerMessage._hideTimeout) {
    clearTimeout(bannerMessage._hideTimeout);
  }

  // Hide after 4 seconds
  bannerMessage._hideTimeout = window.setTimeout(() => {
    bannerMessage.classList.add("hidden");
  }, 4000);
}