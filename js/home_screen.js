import { db } from "./firebase_config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { auth } from "./firebase_config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const tableBody = document.getElementById("tableBody");
const tableLoader = document.getElementById("tableLoader");


document.addEventListener("DOMContentLoaded", function () {
  // Fade in page when loaded
  document.body.classList.add("fade-in");

  const logoutBtn = document.getElementById("logoutBtn");
  const dropdownLogout = document.getElementById("dropdownLogout");

  function logoutUser(event) {
    event.preventDefault();

    const loader = document.getElementById("logoutLoader");

    if (loader) loader.classList.add("active");

    document.body.classList.add("fade-out");

    localStorage.clear();

    setTimeout(() => {
      window.location.href = "login.html";
    }, 800);
  }

  if (logoutBtn) logoutBtn.addEventListener("click", logoutUser);
  if (dropdownLogout) dropdownLogout.addEventListener("click", logoutUser);
});


// Open modal
window.openLogoutModal = function () {
  document.getElementById("confirmLogoutModal").style.display = "flex";
};

// Close modal
window.closeLogoutModal = function () {
  document.getElementById("confirmLogoutModal").style.display = "none";
};

// Final logout
window.confirmLogout = function () {
  const loader = document.getElementById("logoutLoader");

  document.getElementById("confirmLogoutModal").style.display = "none";

  if (loader) loader.classList.add("active");

  document.body.classList.add("fade-out");

  localStorage.clear();

  setTimeout(() => {
    window.location.href = "login.html";
  }, 800);
};


onAuthStateChanged(auth, async (user) => {
  if (user) {
    const uid = user.uid;

    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      let name = "Admin";
      if (userSnap.exists()) {
        const data = userSnap.data();
        name = data.name || "Admin";
      }

      const email = user.email;

      // ✅ UI Update
      document.querySelector(".profile-top h3").innerText = name;
      document.querySelector(".profile-top p").innerText = email;

      // 🔥 IMPORTANT FIX (USE EMAIL NOT NAME)
      const firstLetter = email.charAt(0).toUpperCase();
      document.querySelector(".avatar").innerText = firstLetter;

    } catch (error) {
      console.error("Error fetching user:", error);
    }

  } else {
    window.location.href = "login.html";
  }
});



// 🔥 Global state
let allReports = [];
let currentFilter = "all";

let total = 0;
let pending = 0;
let resolved = 0;

// 🔥 Firestore Real-time Listener
// 🔥 Show loader first
if (tableLoader) tableLoader.style.display = "flex";

onSnapshot(collection(db, "reports"), (snapshot) => {

  allReports = [];
  total = 0;
  pending = 0;
  resolved = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    data.id = doc.id;

    allReports.push(data);

    total++;

    if (data.status === "Pending") pending++;
    if (data.status === "Resolved") resolved++;
  });

  // 🔥 Hide loader
  if (tableLoader) tableLoader.style.display = "none";

  // 🔥 Render
  filterReports(currentFilter, document.querySelector(".filter-box button"));

  // 🔢 Counters
  document.getElementById("totalReports").innerText = total;
  document.getElementById("pendingReports").innerText = pending;
  document.getElementById("resolvedReports").innerText = resolved;

});


// 🔥 Render Table
function renderTable(data) {
  tableBody.innerHTML = "";

  // 🔴 If no data → show message
  if (data.length === 0) {
    let message = "No reports available";

    if (currentFilter === "pending") {
      message = "No pending cases";
    } else if (currentFilter === "resolved") {
      message = "No resolved cases";
    } else if (currentFilter === "assigned") {
      message = "No assigned cases";
    }

    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:20px; color:#777;">
          ${message}
        </td>
      </tr>
    `;
    return;
  }

  // ✅ Normal data rendering
  data.forEach((data) => {

    let statusClass = "";

    if (data.status === "Pending") {
      statusClass = "status-pending";
    } else if (data.status === "Assigned") {
      statusClass = "status-assigned";
    } else if (data.status === "Resolved") {
      statusClass = "status-resolved";
    }
    const row = `
<tr>
  <td>${data.id.substring(0, 6)}</td>

  <td>
    <div class="image-wrapper">
      <div class="img-loader"></div>
      <img 
        src="${data.imageUrl || '../image/no-image.png'}"
        class="history-image"
        onload="this.previousElementSibling.style.display='none'"
        onerror="this.src='../image/no-image.png'; this.previousElementSibling.style.display='none'"
      >
    </div>
  </td>

  <td>
    <strong>${data.animalType}</strong><br>
    <span style="color:#666;font-size:13px;">
      ${data.caseType}
    </span>
  </td>

  <td>
    <span class="status-badge ${statusClass}">
      ${data.status}
    </span>
  </td>

  <td>${data.location?.address || ""}</td>

  <!-- ✅ NEW COLUMN -->
  <td>
    ${data.createdAt
        ? data.createdAt.toDate().toLocaleString()
        : "-"
      }
  </td>

  <td>
    <button class="view-btn" onclick="viewReport('${data.id}')">
      View
    </button>
  </td>
</tr>
`;

    tableBody.innerHTML += row;
  });
}

// 🔥 Filter Function
window.filterReports = function (type, btn) {
  currentFilter = type;

  // ✅ Remove active from all
  document.querySelectorAll(".filter-box button").forEach(button => {
    button.classList.remove("active");
  });

  // ✅ Add active to clicked button
  if (btn) btn.classList.add("active");

  // ✅ Apply filter
  if (type === "all") {
    renderTable(allReports);
    return;
  }

  const filtered = allReports.filter((report) => {
    return report.status?.toLowerCase() === type;
  });

  renderTable(filtered);
};


// 🔍 Enhanced Search Function
window.searchTable = function () {
  let input = document.getElementById("searchInput").value.toLowerCase().trim();

  const filtered = allReports.filter((report) => {

    // 🔹 Fields
    const location = report.location?.address?.toLowerCase() || "";
    const animal = report.animalType?.toLowerCase() || "";
    const volunteer = report.assignedVolunteer?.name?.toLowerCase() || "";
    const reportId = report.id?.toLowerCase() || "";

    // 🔹 Dates (convert to readable string)
    let createdDate = "";
    let resolvedDate = "";

    if (report.createdAt) {
      createdDate = report.createdAt.toDate().toLocaleString().toLowerCase();
    }

    if (report.resolvedAt) {
      resolvedDate = report.resolvedAt.toDate().toLocaleString().toLowerCase();
    }

    // 🔍 Match ANY field
    const matchesSearch =
      location.includes(input) ||
      animal.includes(input) ||
      volunteer.includes(input) ||
      reportId.includes(input) ||
      createdDate.includes(input) ||
      resolvedDate.includes(input);

    // 🔹 Filter (status)
    const matchesFilter =
      currentFilter === "all" ||
      report.status?.toLowerCase() === currentFilter;
    console.log(report);

    return matchesSearch && matchesFilter;
  });

  renderTable(filtered);
};


// 🔍 View Report
window.viewReport = function (id) {
  window.location.href = `report_details.html?id=${id}`;
};


// 📂 Drawer Menu
window.openDrawer = function () {
  document.getElementById("drawer").style.left = "0";
  document.getElementById("drawerOverlay").style.display = "block";
};

window.closeDrawer = function () {
  document.getElementById("drawer").style.left = "-260px";
  document.getElementById("drawerOverlay").style.display = "none";
};



// 🔔 Notification Sidebar
window.openSidebar = function () {
  const sidebar = document.getElementById("notificationSidebar");
  sidebar.style.transform = "translateX(0)";
};

window.closeSidebar = function () {
  const sidebar = document.getElementById("notificationSidebar");
  sidebar.style.transform = "translateX(100%)";
  document.getElementById("overlay").style.display = "none";
}




window.onload = () => {
  const firstBtn = document.querySelector(".filter-box button");
  if (firstBtn) firstBtn.classList.add("active");

}



window.toggleProfileMenu = function () {
  const menu = document.getElementById("profileMenu");

  menu.style.display =
    menu.style.display === "block" ? "none" : "block";
};

// Close when clicking outside
document.addEventListener("click", function (e) {
  const profile = document.querySelector(".profile");
  const menu = document.getElementById("profileMenu");

  if (!profile.contains(e.target)) {
    menu.style.display = "none";
  }
});