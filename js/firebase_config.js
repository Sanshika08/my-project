import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCB4OAy8yEvWKwXzgJEY5iTz5RlAHoIPco",
  authDomain: "sarrs-a51aa.firebaseapp.com",
  projectId: "sarrs-a51aa",
  storageBucket: "sarrs-a51aa.firebasestorage.app",
  messagingSenderId: "978640133992",
  appId: "1:978640133992:web:4e41380f63c307aeaf40dd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
const db = getFirestore(app);
const auth = getAuth(app);

// Export
export { db, auth };