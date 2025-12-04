// frontend/nav.ts
document.addEventListener("DOMContentLoaded", () => {
    const isAdmin = localStorage.getItem("isAdmin") === "true";
    const friendsBtn = document.getElementById("nav-friends-btn") as HTMLAnchorElement;

    if (isAdmin && friendsBtn) {
        friendsBtn.textContent = "Admin View";
        friendsBtn.href = "admin.html";
    }
});