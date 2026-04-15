import { db } from "./firebase_config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// ✅ Load Footer
export function loadFooter() {
  fetch("../html/footer.html")
    .then(res => res.text())
    .then(data => {
      const container = document.getElementById("footerContainer");
      if (container) {
        container.innerHTML = data;

        // ✅ Run after footer loads
        updateServerStatus();
      }
    });
}

// ✅ Server Status Function
async function updateServerStatus() {
  const statusEl = document.getElementById("server-status");
  if (!statusEl) return;

  try {
    await getDoc(doc(db, "reports", "test"));

    statusEl.innerHTML = "🟢 Server: Connected";
    statusEl.style.color = "#22c55e";
  } catch (error) {
    statusEl.innerHTML = "🔴 Server: Disconnected";
    statusEl.style.color = "#ef4444";
  }
}

// ✅ Listen for network changes
window.addEventListener("online", updateServerStatus);
window.addEventListener("offline", updateServerStatus);