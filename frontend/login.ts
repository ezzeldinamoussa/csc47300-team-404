// frontend/login.ts
// TypeScript version of login.js
// Preserves full functionality: form handling, API call, banner message, and conditional redirect

import { API_BASE } from './config.js';

interface LoginResponse {
  token?: string;
  msg?: string;
  user?: {
    id: string;
    username: string;
    email: string;
    isAdmin: boolean; 
    // 🛑 NEW FIELD: Include the numeric admin level 🛑
    adminLevel: number; 
  };
}

interface BannerMessageElement extends HTMLElement {
  _hideTimeout?: number;
}

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form") as HTMLFormElement | null;

  if (!loginForm) return;

  loginForm.addEventListener("submit", async (e: SubmitEvent) => {
    e.preventDefault(); // Stop normal form submission

    // Collect form data
    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    try {
      // Send login request to backend
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result: LoginResponse = await response.json();

      // Function to display banner messages
      const showBanner = (msg: string, status: "success" | "error" | "hidden" = "hidden"): void => {
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

        // Hide banner after 4 seconds
        bannerMessage._hideTimeout = window.setTimeout(() => {
          bannerMessage.classList.add("hidden");
        }, 4000);
      };

      if (response.ok && result.token) {
        // Login successful
        localStorage.setItem("token", result.token);
        let redirectUrl = "tasks.html"; // Default for normal users

        // Saving admin status and checking for redirect
        if (result.user) {
            // 🛑 CRITICAL CHANGE 1: Store the numeric adminLevel 🛑
            localStorage.setItem("adminLevel", result.user.adminLevel.toString());

            // 🛑 CRITICAL CHANGE 2: Check if adminLevel is greater than 0 for admin access 🛑
            if (result.user.adminLevel > 0) {
                localStorage.setItem("isAdmin", "true"); // Still set the boolean flag for compatibility
                redirectUrl = "admin.html"; // Redirect Admin 1 or Admin 2
            } else {
                localStorage.setItem("isAdmin", "false");
            }
        }

        // Redirect to the determined page
        window.location.href = redirectUrl; 
      } else {
        // Login failed — show message from backend
        showBanner(result.msg ?? "Login failed. Please try again.", "error");
      }
    } catch (error) {
      console.error("Login error:", error);
      const bannerMessage = document.getElementById("bannerMessage") as BannerMessageElement | null;
      if (bannerMessage) {
        const bannerText = document.getElementById("bannerText") as HTMLElement | null;
        if (bannerText) bannerText.textContent = "An error occurred. Please try again.";
        bannerMessage.classList.remove("hidden", "success");
        bannerMessage.classList.add("error");
        bannerMessage._hideTimeout = window.setTimeout(() => {
          bannerMessage.classList.add("hidden");
        }, 4000);
      }
    }
  });
});