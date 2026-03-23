import { auth, db } from "./firebase_config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const loginBtn = document.getElementById("loginBtn");
const btnText = document.getElementById("btnText");
const btnLoader = document.getElementById("btnLoader");

loginBtn.addEventListener("click", async () => {

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    // 🔄 Show loader
    loginBtn.disabled = true;
    btnText.style.display = "none";
    btnLoader.style.display = "inline-block";

    // ✅ Firebase login
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ✅ Check role from Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User role not found");
    }

    const role = userSnap.data().role;

    if (role !== "ngo") {
      throw new Error("Access denied");
    }

    // ✅ Smooth transition
    setTimeout(() => {
      document.body.classList.add("fade-out");

      setTimeout(() => {
        window.location.replace("../html/home_screen.html");
      }, 600);

    }, 2000);

  } catch (error) {

    // ❌ Reset UI on error
    loginBtn.disabled = false;
    btnText.style.display = "inline";
    btnLoader.style.display = "none";

    alert("Login failed: " + error.message);
  }
});

// 👁 Show / Hide Password
document.getElementById("togglePassword").addEventListener("click", function () {
  let passwordField = document.getElementById("password");

  if (passwordField.type === "password") {
    passwordField.type = "text";
    this.textContent = "Hide";
  } else {
    passwordField.type = "password";
    this.textContent = "Show";
  }
});