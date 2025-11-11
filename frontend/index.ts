// frontend/index.ts
// Minimal, typed conversion of frontend/index.js
// Behavior preserved: show mascot after 2s, clicking mascot -> signup.html

document.addEventListener("DOMContentLoaded", () => {
  const mascot = document.getElementById("signup-mascot") as HTMLElement | null;

  if (!mascot) return;

  // Show the mascot after 2 seconds
  setTimeout(() => {
    mascot.classList.add("visible");
  }, 2000);

  // Clicking the mascot navigates to signup page
  mascot.addEventListener("click", () => {
    window.location.href = "signup.html";
  });
});
