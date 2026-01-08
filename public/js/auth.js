import {
  auth,
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  doc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
  getDocs,
  query,
  where,
} from "./firebase.js";
import {
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { showToast, setPendingToast, checkPendingToast } from "./toast.js";

const ACCESS_CODE = "OER2024"; // Hardcoded for demo
const ADMIN_EMAILS = ["devi.armanda@meitech-ekabintan.com"]; // Simple admin check or use Firestore role

// Auth State Listener
onAuthStateChanged(auth, async (user) => {
  const path = window.location.pathname;
  const filename = path.split("/").pop();
  let isRedirecting = false;

  if (user) {
    const ref = doc(db, "users", user.uid);
    let userDoc = await getDoc(ref);
    if (!userDoc.exists()) {
      const role = ADMIN_EMAILS.includes(user.email) ? "admin" : "user";
      await setDoc(ref, {
        email: user.email,
        role: role,
        createdAt: new Date(),
      });
      userDoc = await getDoc(ref);
    }
    const role = userDoc.data()?.role;
    if (role !== "admin") {
      alert("Akses ditolak. Khusus Admin.");
      isRedirecting = true;
      try {
        await auth.signOut();
      } catch (e) {}
      window.location.href = "login.html";
    } else {
      if (
        filename === "login.html" ||
        filename === "register.html" ||
        filename === "" ||
        filename === "index.html"
      ) {
        if (sessionStorage.getItem("loggingIn")) {
          setPendingToast("Login berhasil!", "success");
          sessionStorage.removeItem("loggingIn");
        }
        isRedirecting = true;
        window.location.href = "admin.html";
      }
    }
  } else {
    // User is logged out
    if (filename !== "login.html" && filename !== "register.html") {
      isRedirecting = true;
      window.location.href = "login.html";
    }
  }

  // Check for pending toast messages (e.g. after redirect)
  if (!isRedirecting) {
    checkPendingToast();
  }
});

// Login Form
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorMsg = document.getElementById("error-msg");

    try {
      sessionStorage.setItem("loggingIn", "true");
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect handled by onAuthStateChanged
    } catch (error) {
      sessionStorage.removeItem("loggingIn");
      console.error(error);
      errorMsg.style.display = "block";
      errorMsg.textContent = "Login gagal: " + error.message;
    }
  });
}

// Register Form
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const accessCode = document.getElementById("access-code").value;
    const errorMsg = document.getElementById("error-msg");

    if (accessCode !== ACCESS_CODE) {
      errorMsg.style.display = "block";
      errorMsg.textContent = "Password akses salah!";
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Create user document
      // Check if email is in admin list to auto-assign admin role (optional helper)
      const role = ADMIN_EMAILS.includes(email) ? "admin" : "user";

      await setDoc(doc(db, "users", user.uid), {
        email: email,
        role: role,
        createdAt: new Date(),
      });

      setPendingToast("Registrasi berhasil!", "success");
      // Redirect handled by onAuthStateChanged
    } catch (error) {
      console.error(error);
      errorMsg.style.display = "block";
      errorMsg.textContent = "Registrasi gagal: " + error.message;
    }
  });
}

// Check pending toast when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  checkPendingToast();

  // Logout function setup
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      // Check if Swal is available
      if (typeof Swal !== "undefined") {
        Swal.fire({
          title: "Logout?",
          text: "Anda yakin ingin keluar?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Ya, Logout",
          cancelButtonText: "Batal",
        }).then(async (result) => {
          if (result.isConfirmed) {
            performLogout();
          }
        });
      } else {
        // Fallback if Swal not loaded
        if (confirm("Anda yakin ingin keluar?")) {
          performLogout();
        }
      }
    });
  }
});

async function performLogout() {
  try {
    setPendingToast("Berhasil logout", "info");
    await auth.signOut();
  } catch (error) {
    console.error("Logout error", error);
  }
}
