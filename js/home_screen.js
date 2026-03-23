import { db } from "./firebase_config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const tableBody = document.getElementById("tableBody");

// 🔥 Global state
let allReports = [];
let currentFilter = "all";

let total = 0;
let pending = 0;
let resolved = 0;

// 🔥 Firestore Real-time Listener
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

  // 🔥 Render based on current filter
  filterReports(currentFilter);

  // 🔢 Update counters
  document.getElementById("totalReports").innerText = total;
  document.getElementById("pendingReports").innerText = pending;
  document.getElementById("resolvedReports").innerText = resolved;
  filterReports("all", document.querySelector(".filter-box button"));

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
        <td colspan="6" style="text-align:center; padding:20px; color:#777;">
          ${message}
        </td>
      </tr>
    `;
    return;
  }

  // ✅ Normal data rendering
  data.forEach((data) => {

    let statusClass = data.status === "Resolved"
      ? "status-resolved"
      : "status-pending";

    const row = `
    <tr>
      <td>${data.id.substring(0, 6)}</td>

      <td>
        <img src="${data.imageUrl}" 
        style="width:90px;height:70px;border-radius:10px;object-fit:cover;">
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


// 🔍 Search Function (works with filter)
window.searchTable = function () {
  let input = document.getElementById("searchInput").value.toLowerCase();

  const filtered = allReports.filter((report) => {
    const location = report.location?.address?.toLowerCase() || "";
    const matchesSearch = location.includes(input);

    const matchesFilter =
      currentFilter === "all" ||
      report.status?.toLowerCase() === currentFilter;

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


// 🔐 Logout
function logout() {
  window.location.href = "login.html";
}


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
window.logout = function (event) {
    if (event) event.preventDefault();

    const popup = document.getElementById("logoutPopup");
    if (popup) {
        popup.style.display = "flex";
    }
};

window.closeLogoutPopup = function () {
    const popup = document.getElementById("logoutPopup");
    if (popup) {
        popup.style.display = "none";
    }

    document.getElementById("logoutEmail").value = "";
    document.getElementById("logoutPassword").value = "";
};

window.checkLogout = function () {
    const email = document.getElementById("logoutEmail").value.trim();
    const password = document.getElementById("logoutPassword").value.trim();

    if (email !== "ngosarrs@gmail.com") {
        alert("Wrong Email");
    } else if (password !== "1234") {
        alert("Wrong Password");
    } else {
        alert("Logout Successful");
        window.location.href = "login.html"; // apni login file ka exact naam likho
    }
};

window.onload = () => {
  const firstBtn = document.querySelector(".filter-box button");
  if (firstBtn) firstBtn.classList.add("active");

}