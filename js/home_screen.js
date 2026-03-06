import { db } from "./firebase_config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const tableBody = document.getElementById("tableBody");

// 🔥 Listen to Firestore reports collection
onSnapshot(collection(db, "reports"), (snapshot) => {

  tableBody.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();

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