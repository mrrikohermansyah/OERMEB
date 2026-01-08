// Toast Notification Utility

// Create container if not exists
function getToastContainer() {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    if (document.body) {
      document.body.appendChild(container);
    } else {
      // Fallback if body is not yet ready (should not happen with modules/DOMContentLoaded)
      document.documentElement.appendChild(container);
    }
  }
  return container;
}

export function showToast(message, type = "info") {
  const container = getToastContainer();

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const msgSpan = document.createElement("span");
  msgSpan.className = "toast-message";
  msgSpan.textContent = message;

  toast.appendChild(msgSpan);
  container.appendChild(toast);

  // Trigger animation
  // requestAnimationFrame is sometimes too fast for the transition to register
  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => {
      if (container.contains(toast)) {
        container.removeChild(toast);
      }
    }, 300); // Wait for transition
  }, 3000);
}

export function setPendingToast(message, type = "info") {
  sessionStorage.setItem("toastMessage", message);
  sessionStorage.setItem("toastType", type);
  console.log("Toast set:", message); // Debug
}

export function checkPendingToast() {
  const message = sessionStorage.getItem("toastMessage");
  const type = sessionStorage.getItem("toastType");

  if (message) {
    console.log("Toast found:", message); // Debug
    showToast(message, type);
    sessionStorage.removeItem("toastMessage");
    sessionStorage.removeItem("toastType");
  }
}
