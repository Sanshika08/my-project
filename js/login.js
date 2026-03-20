import { auth, db } from "./firebase_config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const loginBtn = document.getElementById("loginBtn");
const btnText = document.getElementById("btnText");
const btnLoader = document.getElementById("btnLoader");

loginBtn.addEventListener("click", async () => {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  try {
    // 🔄 Show loader
    loginBtn.disabled = true;
    btnText.style.display = "none";
    btnLoader.style.display = "inline-block";

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error("User role not found");
    }

    const role = userSnap.data().role;

    if (role !== "ngo") {
      throw new Error("Access denied");
    }

    // ⏳ Keep loader for 2 seconds
   setTimeout(() => {

  // Fade out page
  document.body.classList.add("fade-out");

  // Wait for fade animation
  setTimeout(() => {
    window.location.replace("../html/home_screen.html");
  }, 600);

}, 1500);

  } catch (error) {

    // ❌ Reset button if error
    loginBtn.disabled = false;
    btnText.style.display = "inline";
    btnLoader.style.display = "none";

    alert("Login failed: " + error.message);
  }

});
document.getElementById("loginBtn").addEventListener("click", function () {
  let email = document.getElementById("email").value.trim();
  let password = document.getElementById("password").value.trim();

  let correctEmail = "ngosarrs@gmail.com";
  let correctPassword = "1234";

  if (email === "" || password === "") {
    alert("Please enter email and password");
  } 
  else if (email === correctEmail && password === correctPassword) {
    window.location.href = "home_screen.html";
  } 
  else {
    alert("Wrong email or password");
  }
});

// Show / Hide Password
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