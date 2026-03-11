import { db } from "./firebase_config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const tableBody = document.getElementById("tableBody");

// 🔥 Listen to Firestore reports collection
let total = 0;
let pending = 0;
let resolved = 0;

onSnapshot(collection(db, "reports"), (snapshot) => {

  tableBody.innerHTML = "";

  total = 0;
  pending = 0;
  resolved = 0;

  snapshot.forEach(doc => {

    const data = doc.data();
    total++;

    if(data.status === "Pending") pending++;
    if(data.status === "Resolved") resolved++;

    const row = `
    <tr>
      <td>${doc.id.substring(0,6)}</td>

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
        <span class="status-badge ${data.status.toLowerCase()}">
        ${data.status}
        </span>
      </td>

      <td>${data.location?.address || ""}</td>

      <td>
        <button class="view-btn" onclick="viewReport('${doc.id}')">
        View
        </button>
      </td>
    </tr>
    `;

    tableBody.innerHTML += row;
  });

  document.getElementById("totalReports").innerText = total;
  document.getElementById("pendingReports").innerText = pending;
  document.getElementById("resolvedReports").innerText = resolved;

});

// 🔍 View report
window.viewReport = function(id){
  window.location.href = `report_details.html?id=${id}`;
};

// Search Function
window.searchTable = function(){
  let input = document.getElementById("searchInput").value.toLowerCase();
  let rows = document.querySelectorAll("#tableBody tr");

  rows.forEach(row => {
    let location = row.cells[4].innerText.toLowerCase();
    row.style.display = location.includes(input) ? "" : "none";
  });
};

//Drawer Menu
window.openDrawer = function(){
  document.getElementById("drawer").style.left = "0";
  document.getElementById("drawerOverlay").style.display = "block";
}

window.closeDrawer = function(){
  document.getElementById("drawer").style.left = "-260px";
  document.getElementById("drawerOverlay").style.display = "none";
}

function logout(){
  window.location.href = "login.html";
}

// Notification Sidebar
window.openSidebar = function(){
  const sidebar = document.getElementById("notificationSidebar");
  sidebar.style.transform = "translateX(0)";
  document.getElementById("overlay").style.display = "block";
}

window.closeSidebar = function(){
  const sidebar = document.getElementById("notificationSidebar");
  sidebar.style.transform = "translateX(100%)";
  document.getElementById("overlay").style.display = "none";
}