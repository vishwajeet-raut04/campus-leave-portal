/* ============================================================
   script.js
   ------------------------------------------------------------
   Handles the public student leave application form:
   - Live "Total Days" calculation
   - Client-side validation
   - Submitting data to Firestore
   - Success / error UI states
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {

  // ---------- Element references ----------
  const form = document.getElementById("leaveForm");
  const formState = document.getElementById("formState");
  const successState = document.getElementById("successState");
  const summaryBox = document.getElementById("summaryBox");
  const newApplicationBtn = document.getElementById("newApplicationBtn");

  const submitBtn = document.getElementById("submitBtn");
  const submitBtnText = document.getElementById("submitBtnText");
  const submitSpinner = document.getElementById("submitSpinner");

  const loadingOverlay = document.getElementById("loadingOverlay");
  const toastWrap = document.getElementById("toastWrap");

  const leaveFromInput = document.getElementById("leaveFrom");
  const leaveToInput = document.getElementById("leaveTo");
  const totalDaysInput = document.getElementById("totalDays");

  document.getElementById("year").textContent = new Date().getFullYear();

  // Prevent selecting past dates for "Leave From"
  const todayStr = new Date().toISOString().split("T")[0];
  leaveFromInput.setAttribute("min", todayStr);
  leaveToInput.setAttribute("min", todayStr);

  // ---------- Auto-calculate total leave days ----------
  function calculateTotalDays() {
    const fromVal = leaveFromInput.value;
    const toVal = leaveToInput.value;

    if (!fromVal || !toVal) {
      totalDaysInput.value = "";
      return null;
    }

    const fromDate = new Date(fromVal);
    const toDate = new Date(toVal);
    const diffTime = toDate - fromDate;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive of both days

    if (diffDays <= 0) {
      totalDaysInput.value = "Invalid date range";
      return null;
    }

    totalDaysInput.value = diffDays + (diffDays === 1 ? " day" : " days");
    return diffDays;
  }

  leaveFromInput.addEventListener("change", () => {
    // "Leave To" cannot be before "Leave From"
    leaveToInput.setAttribute("min", leaveFromInput.value || todayStr);
    calculateTotalDays();
  });
  leaveToInput.addEventListener("change", calculateTotalDays);

  // ---------- Validation helpers ----------
  function setError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById("err-" + fieldId);
    if (input) input.classList.add("error");
    if (errorEl) errorEl.textContent = message;
  }

  function clearError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById("err-" + fieldId);
    if (input) input.classList.remove("error");
    if (errorEl) errorEl.textContent = "";
  }

  function clearAllErrors() {
    ["studentName", "rollNumber", "studentClass", "department", "mobile", "email", "leaveFrom", "leaveTo", "reason"]
      .forEach(clearError);
  }

  function validateForm(data) {
    clearAllErrors();
    let isValid = true;

    if (!data.studentName) { setError("studentName", "Please enter your full name."); isValid = false; }
    else if (data.studentName.length < 3) { setError("studentName", "Name looks too short."); isValid = false; }

    if (!data.rollNumber) { setError("rollNumber", "Roll number is required."); isValid = false; }

    if (!data.studentClass) { setError("studentClass", "Class is required."); isValid = false; }

    if (!data.department) { setError("department", "Department is required."); isValid = false; }

    if (!data.mobile) { setError("mobile", "Mobile number is required."); isValid = false; }
    else if (!/^[0-9]{10}$/.test(data.mobile)) { setError("mobile", "Enter a valid 10-digit mobile number."); isValid = false; }

    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setError("email", "Enter a valid email address.");
      isValid = false;
    }

    if (!data.leaveFrom) { setError("leaveFrom", "Select a start date."); isValid = false; }
    if (!data.leaveTo) { setError("leaveTo", "Select an end date."); isValid = false; }

    if (data.leaveFrom && data.leaveTo) {
      const totalDays = calculateTotalDays();
      if (totalDays === null) {
        setError("leaveTo", "End date must be on or after the start date.");
        isValid = false;
      }
    }

    if (!data.reason) { setError("reason", "Please provide a reason for your leave."); isValid = false; }
    else if (data.reason.length < 5) { setError("reason", "Please provide a bit more detail."); isValid = false; }

    return isValid;
  }

  // ---------- Toasts ----------
  function showToast(message, type = "success") {
    const icon = type === "success" ? "fa-circle-check" : "fa-circle-exclamation";
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
    toastWrap.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
  }

  // ---------- Form submission ----------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      studentName: document.getElementById("studentName").value.trim(),
      rollNumber: document.getElementById("rollNumber").value.trim(),
      class: document.getElementById("studentClass").value.trim(),
      department: document.getElementById("department").value.trim(),
      mobile: document.getElementById("mobile").value.trim(),
      email: document.getElementById("email").value.trim(),
      leaveFrom: leaveFromInput.value,
      leaveTo: leaveToInput.value,
      reason: document.getElementById("reason").value.trim(),
    };

    // Re-map validation fields to match input IDs used in validateForm()
    const validationData = {
      studentName: data.studentName,
      rollNumber: data.rollNumber,
      studentClass: data.class,
      department: data.department,
      mobile: data.mobile,
      email: data.email,
      leaveFrom: data.leaveFrom,
      leaveTo: data.leaveTo,
      reason: data.reason
    };

    if (!validateForm(validationData)) {
      showToast("Please fix the errors highlighted below.", "error");
      return;
    }

    const totalDays = calculateTotalDays();

    // ---------- Disable button + show loading ----------
    submitBtn.disabled = true;
    submitBtnText.classList.add("hidden");
    submitSpinner.classList.remove("hidden");
    loadingOverlay.classList.add("show");

    try {
      const docData = {
        studentName: data.studentName,
        rollNumber: data.rollNumber,
        class: data.class,
        department: data.department,
        mobile: data.mobile,
        email: data.email || "",
        leaveFrom: data.leaveFrom,
        leaveTo: data.leaveTo,
        totalDays: totalDays,
        reason: data.reason,
        
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection(LEAVE_COLLECTION).add(docData);

      // ---------- Show success state ----------
      summaryBox.innerHTML = `
        <div><div class="label">Student</div><div class="value">${escapeHtml(data.studentName)}</div></div>
        <div><div class="label">Roll No.</div><div class="value">${escapeHtml(data.rollNumber)}</div></div>
        <div><div class="label">Leave From</div><div class="value">${formatDate(data.leaveFrom)}</div></div>
        <div><div class="label">Leave To</div><div class="value">${formatDate(data.leaveTo)}</div></div>
        <div><div class="label">Total Days</div><div class="value">${totalDays} ${totalDays === 1 ? "day" : "days"}</div></div>
        
      `;

      formState.classList.add("hidden");
      successState.classList.remove("hidden");
      showToast("Leave application submitted successfully!", "success");
      form.reset();
      totalDaysInput.value = "";

    } catch (err) {
      console.error("Error submitting application:", err);
      showToast("Something went wrong. Please try again.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtnText.classList.remove("hidden");
      submitSpinner.classList.add("hidden");
      loadingOverlay.classList.remove("show");
    }
  });

  // ---------- Reset back to a fresh form ----------
  newApplicationBtn.addEventListener("click", () => {
    successState.classList.add("hidden");
    formState.classList.remove("hidden");
    clearAllErrors();
  });

  // ---------- Helpers ----------
  function formatDate(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // Only allow numeric input for mobile field
  document.getElementById("mobile").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  });
});
