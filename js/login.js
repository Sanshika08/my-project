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
      window.location.replace("../html/home_screen.html");
    }, 2000);

  } catch (error) {

    // ❌ Reset button if error
    loginBtn.disabled = false;
    btnText.style.display = "inline";
    btnLoader.style.display = "none";

    alert("Login failed: " + error.message);
  }

});