/* ============================================================
   admin.js
   ------------------------------------------------------------
   Simple fixed-credential admin login (NO Firebase Authentication).

   IMPORTANT (production note):
   Hard-coding credentials in client-side JS is only acceptable for
   small/internal tools or demos, because anyone can view this file
   in the browser and read the password. For a real production
   deployment, replace this with Firebase Authentication or a
   server-side check. This project intentionally uses a fixed
   login as per the requirements of this build.
   ============================================================ */

// ---------- Fixed Admin Credentials ----------
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "Admin@123";

// Session storage key used to mark the admin as logged in.
// dashboard.html checks this key on load to guard the page.
const SESSION_KEY = "isAdminLoggedIn";

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");

  // admin.js is also loaded on dashboard.html (to reuse SESSION_KEY),
  // but the login form only exists on admin.html — skip login wiring if absent.
  if (!loginForm) return;

  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginAlert = document.getElementById("loginAlert");
  const toggleEye = document.getElementById("toggleEye");

  const loginBtn = document.getElementById("loginBtn");
  const loginBtnText = document.getElementById("loginBtnText");
  const loginSpinner = document.getElementById("loginSpinner");

  // If already logged in, skip straight to the dashboard
  if (sessionStorage.getItem(SESSION_KEY) === "true") {
    window.location.href = "dashboard.html";
    return;
  }

  // Toggle password visibility
  toggleEye.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    toggleEye.classList.toggle("fa-eye");
    toggleEye.classList.toggle("fa-eye-slash");
  });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    loginAlert.classList.remove("show");

    const enteredUsername = usernameInput.value.trim();
    const enteredPassword = passwordInput.value;

    // Small artificial delay so the loading state is visible (feels more "real")
    loginBtn.disabled = true;
    loginBtnText.classList.add("hidden");
    loginSpinner.classList.remove("hidden");

    setTimeout(() => {
      if (enteredUsername === ADMIN_USERNAME && enteredPassword === ADMIN_PASSWORD) {
        // Mark session as authenticated, then redirect
        sessionStorage.setItem(SESSION_KEY, "true");
        window.location.href = "dashboard.html";
      } else {
        loginAlert.classList.add("show");
        loginBtn.disabled = false;
        loginBtnText.classList.remove("hidden");
        loginSpinner.classList.add("hidden");
        passwordInput.value = "";
        passwordInput.focus();
      }
    }, 500);
  });
});
