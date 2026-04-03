import { db } from "./firebase_config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";
import { auth } from "./firebase_config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";


function formatDateTime(date) {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

const tableBody = document.getElementById("tableBody");
const tableLoader = document.getElementById("tableLoader");

document.addEventListener("DOMContentLoaded", function () {
  // Fade in page
  document.body.classList.add("fade-in");

  const graphFilter = document.getElementById("graphFilter");

  if (graphFilter) {
    // ✅ Sync dropdown with default value
    graphFilter.value = graphRange;

    // ✅ Attach change listener (MOVE HERE)
    graphFilter.addEventListener("change", (e) => {
      graphRange = e.target.value;

      const dailyData = getDailyReportData(allReports);
      renderReportsChart(dailyData);
      updateInsights(dailyData);
    });
  }

  // ✅ FIX: Force initial render (IMPORTANT)
  setTimeout(() => {
    if (allReports.length > 0) {
      const dailyData = getDailyReportData(allReports);
      renderReportsChart(dailyData);
      updateInsights(dailyData);
    }
  }, 300); // small delay to wait for Firestore

  // Logout logic (unchanged)
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

// 📊 GRAPH FUNCTIONS

function getDailyReportData(reports) {
  const last7Days = {};

  let days = 7;

  if (graphRange === "30") days = 30;
  const now = new Date();
  const currentYear = now.getFullYear();

  if (graphRange === "all") {
    // 🔥 Create months instead of days
    for (let m = 0; m < 12; m++) {
      const key = new Date(currentYear, m).toLocaleString("default", { month: "short" });

      last7Days[key] = {
        pending: 0,
        assigned: 0,
        resolved: 0
      };
    }
  } else {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString();

      last7Days[key] = {
        pending: 0,
        assigned: 0,
        resolved: 0
      };
    }
  } 

  // Fill data
  reports.forEach(r => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const limitDate = new Date();
    limitDate.setDate(now.getDate() - days);

    if (!r.createdAt || !r.status) return;

    // Pending → use createdAt
    if (r.status === "Pending" && r.createdAt) {
      const dateObj = r.createdAt.toDate();

      if (graphRange === "all") {
        if (dateObj.getFullYear() !== currentYear) return;

        const key = dateObj.toLocaleString("default", { month: "short" });
        last7Days[key].pending++;
      } else {
        if (dateObj < limitDate) return;

        const key = dateObj.toLocaleDateString();
        if (last7Days[key]) last7Days[key].pending++;
      }
    }

    // Assigned → use assignedAt
    if (r.status === "Assigned" && r.assignedAt) {
      const dateObj = r.assignedAt.toDate();

      if (graphRange === "all") {
        if (dateObj.getFullYear() !== currentYear) return;

        const key = dateObj.toLocaleString("default", { month: "short" });
        last7Days[key].assigned++;
      } else {
        if (dateObj < limitDate) return;

        const key = dateObj.toLocaleDateString();
        if (last7Days[key]) last7Days[key].assigned++;
      }
    }

    // Resolved → use resolvedAt
    if (r.status === "Resolved" && r.resolvedAt) {
      const dateObj = r.resolvedAt.toDate();

      if (graphRange === "all") {
        if (dateObj.getFullYear() !== currentYear) return;

        const key = dateObj.toLocaleString("default", { month: "short" });
        last7Days[key].resolved++;
      } else {
        if (dateObj < limitDate) return;

        const key = dateObj.toLocaleDateString();
        if (last7Days[key]) last7Days[key].resolved++;
      }
    }
  });

  return last7Days;
}


let reportsChart;

function renderReportsChart(data) {
  const ctx = document.getElementById("reportsChart");
  if (!ctx) return;

  const labels = Object.keys(data);

  // 🔥 Extract separate data
  const pendingData = labels.map(d => data[d].pending);
  const assignedData = labels.map(d => data[d].assigned);
  const resolvedData = labels.map(d => data[d].resolved);

  if (reportsChart) reportsChart.destroy();

  const canvasCtx = ctx.getContext("2d");

  // 🔥 Gradient for Pending
  const pendingGradient = canvasCtx.createLinearGradient(0, 0, 0, 200);
  pendingGradient.addColorStop(0, "rgba(245,158,11,0.4)");
  pendingGradient.addColorStop(1, "rgba(245,158,11,0)");

  // 🔥 Gradient for Assigned
  const assignedGradient = canvasCtx.createLinearGradient(0, 0, 0, 200);
  assignedGradient.addColorStop(0, "rgba(59,130,246,0.4)");
  assignedGradient.addColorStop(1, "rgba(59,130,246,0)");

  // 🔥 Gradient for Resolved
  const resolvedGradient = canvasCtx.createLinearGradient(0, 0, 0, 200);
  resolvedGradient.addColorStop(0, "rgba(34,197,94,0.4)");
  resolvedGradient.addColorStop(1, "rgba(34,197,94,0)");

  reportsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Pending",
          data: pendingData,
          fill: true,
          backgroundColor: pendingGradient,
          borderColor: "#f59e0b",
          pointBackgroundColor: "#f59e0b",
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3
        },
        {
          label: "Assigned",
          data: assignedData,
          fill: true,
          backgroundColor: assignedGradient,
          borderColor: "#3b82f6",
          pointBackgroundColor: "#3b82f6",
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3
        },
        {
          label: "Resolved",
          data: resolvedData,
          fill: true,
          backgroundColor: resolvedGradient,
          borderColor: "#22c55e",
          pointBackgroundColor: "#22c55e",
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },

      plugins: {
        legend: {
          display: true, // 🔥 NOW SHOW LEGEND
          labels: {
            color: "#cbd5e1",
            usePointStyle: true
          }
        }
      },

      layout: {
        padding: {
          top: 10,
          bottom: 5
        }
      },

      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: { color: "#cbd5e1", font: { size: 11 } }
        },
        y: {
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: {
            color: "#cbd5e1",
            stepSize: 1,
            font: { size: 11 }
          }
        }
      }
    }
  });
}

function updateInsights(data) {

  const labelMap = {
    "7": "📈 Total This Week",
    "30": "📈 Total Last Month",
    "all": "📈 Total This Year"
  };

  document.getElementById("totalLabel").innerText = labelMap[graphRange];

  const values = Object.values(data);
  const labels = Object.keys(data);

  let total = 0;
  let max = 0;
  let peakLabel = "";

  values.forEach((day, index) => {
    const dayTotal = day.pending + day.assigned + day.resolved;

    total += dayTotal;

    if (dayTotal > max) {
      max = dayTotal;
      peakLabel = labels[index];
    }
  });


  let avg;

  if (graphRange === "all") {
    const activeMonths = values.filter(v => (v.pending + v.assigned + v.resolved) > 0).length;
    avg = activeMonths ? (total / activeMonths).toFixed(1) : 0;
  } else {
    avg = values.length ? (total / values.length).toFixed(1) : 0;
  }
  // ✅ Update UI
  if (graphRange === "all") {
    document.querySelector(".orange span").innerText = "⚡ Avg Per Month";
    document.querySelector(".red span").innerText = "🔥 Peak Month";
  } else {
    document.querySelector(".orange span").innerText = "⚡ Avg Per Day";
    document.querySelector(".red span").innerText = "🔥 Peak Day";
  }
  document.getElementById("weeklyTotal").innerText = total;
  document.getElementById("avgReports").innerText = avg;
  document.getElementById("peakDay").innerText = peakLabel;

  // 🔥 NEW SUMMARY LOGIC
  const totalResolved = values.reduce((sum, d) => sum + d.resolved, 0);
  const totalAssigned = values.reduce((sum, d) => sum + d.assigned, 0);
  const totalPending = values.reduce((sum, d) => sum + d.pending, 0);

  const totalReports = totalResolved + totalAssigned + totalPending;

  const percent = totalReports
    ? Math.round((totalResolved / totalReports) * 100)
    : 0;


  const rangeText =
    graphRange === "7" ? "last 7 days" :
      graphRange === "30" ? "last 30 days" :
        "this year";

  // 📊 Line 1
  document.getElementById("summaryLine").innerHTML =
    `In the ${rangeText}, there were <strong>${totalReports}</strong> reports — 
   <strong>${totalResolved}</strong> resolved,
   <strong>${totalAssigned}</strong> assigned and 
   <strong>${totalPending}</strong> still pending.`;

  // 📈 Line 2
  document.getElementById("performanceLine").innerHTML =
    `<strong>${percent}%</strong> of cases have been successfully resolved.`;
}

// 🔥 Global state
let allReports = [];
let currentFilter = "all";
let graphRange = "7"; // default range

let total = 0;
let pending = 0;
let resolved = 0;
let dateFilter = "all";


window.filterByDate = function () {
  dateFilter = document.getElementById("dateFilter").value;

  applyAllFilters();
};


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
  applyAllFilters();

  // 🔢 Counters
  document.getElementById("totalReports").innerText = total;
  document.getElementById("pendingReports").innerText = pending;
  document.getElementById("resolvedReports").innerText = resolved;

  // 📊 GRAPH + INSIGHTS (ADD THIS HERE)
  if (allReports.length > 0) {
  const dailyData = getDailyReportData(allReports);
  renderReportsChart(dailyData);
  updateInsights(dailyData);
}
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
    ? formatDateTime(data.createdAt.toDate())
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

  // Remove active from all
  document.querySelectorAll(".filter-box button").forEach(button => {
    button.classList.remove("active");
  });

  // Add active to clicked button
  if (btn) btn.classList.add("active");

  // 🔥 IMPORTANT: Apply combined filters
  applyAllFilters();
};


function applyAllFilters() {
  let filtered = allReports;

  const now = new Date();

  // 🔹 DATE FILTER
  if (dateFilter !== "all") {
    filtered = filtered.filter(report => {
      if (!report.createdAt) return false;

      const date = report.createdAt.toDate();

      if (dateFilter === "today") {
        return date.toDateString() === now.toDateString();
      }

      if (dateFilter === "yesterday") {
        const y = new Date();
        y.setDate(now.getDate() - 1);
        return date.toDateString() === y.toDateString();
      }

      if (dateFilter === "month") {
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      }

      return true;
    });
  }

  // 🔹 STATUS FILTER
  if (currentFilter !== "all") {
    filtered = filtered.filter(report =>
      report.status?.toLowerCase() === currentFilter
    );
  }

  renderTable(filtered);
}


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
      createdDate = formatDateTime(report.createdAt.toDate()).toLowerCase();
    }

    if (report.resolvedAt) {
      resolvedDate = formatDateTime(report.resolvedAt.toDate()).toLowerCase();
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



const graphFilter = document.getElementById("graphFilter");

if (graphFilter) {
  graphFilter.addEventListener("change", (e) => {

    // ✅ update selected range
    graphRange = e.target.value;

    // ✅ re-render graph
    const dailyData = getDailyReportData(allReports);
    renderReportsChart(dailyData);
    updateInsights(dailyData);

  });
}


window.addEventListener("load", () => {
  if (allReports.length > 0) {
    const dailyData = getDailyReportData(allReports);
    renderReportsChart(dailyData);
    updateInsights(dailyData);
  }
});


