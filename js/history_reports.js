import { db } from "./firebase_config.js";

import {
    collection,
    query,
    where,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";



// LOAD HISTORY REPORTS
async function loadHistoryReports() {


    const table = document.getElementById("historyTable");
    const loader = document.getElementById("loader");

    loader.style.display = "flex";
    table.innerHTML = "";

    try {

        const q = query(
            collection(db, "reports"),
            where("status", "==", "Resolved"),
            orderBy("resolvedAt", "desc")
        );

        const snapshot = await getDocs(q);
        loader.style.display = "none";

        if (snapshot.empty) {

            table.innerHTML = `
            <tr>
                <td colspan="9" style="text-align:center">
                    No resolved reports found
                </td>
            </tr>`;

            return;
        }

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            table.innerHTML += `

<tr>

<td class="report-id">${docSnap.id.substring(0, 6)}</td>

<td>
  <div class="image-wrapper">
    <div class="img-loader"></div>
    <img 
      src="${data.imageUrl || '../image/no-image.png'}"
      class="history-image"
      onload="this.previousElementSibling.style.display='none'"
    >
  </div>
</td>

<td class="animal-info">
<strong>${data.animalType || "-"}</strong>
<br>
<span class="case-type">${data.caseType || "-"}</span>
</td>

<td>${data.location?.address || "-"}</td>

<td>${formatDate(data.createdAt)}</td>

<td>${formatDate(data.resolvedAt)}</td>

<td>
  ${data.assignedVolunteer?.name
                    ? `<span class="vol-link"
          onclick="openVolunteer('${data.assignedVolunteer.name}')">
          ${data.assignedVolunteer.name}
        </span>`
                    : "Not Assigned"
                }
</td>

<td>
<button class="view-btn"
onclick="viewReport('${docSnap.id}')">
View
</button>
</td>

</tr>

`;

        });
    } catch (error) {

        console.error("Failed to load reports:", error);

    }
}


// FORMAT DATE
function formatDate(timestamp) {

    if (!timestamp) return "-";

    const date = timestamp.toDate();

    return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",   // Apr instead of 04
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    });
}


// VIEW REPORT DETAILS
window.viewReport = function (id) {

    window.location.href =
        "report_details.html?id=" + id;

};

// OPEN VOLUNTEER DETAILS
window.openVolunteer = function (name) {
    window.location.href = `volunteers.html?name=${encodeURIComponent(name)}`;
};

// SEARCH FUNCTION
window.searchReports = function () {

    const input =
        document.getElementById("searchInput").value.toLowerCase();

    const rows =
        document.querySelectorAll("#historyTable tr");

    rows.forEach(row => {

        const text = row.innerText.toLowerCase();

        row.style.display = text.includes(input) ? "" : "none";

    });

};


// CALL FUNCTION ON PAGE LOAD
loadHistoryReports();



function highlightVolunteer() {

    const selectedName = localStorage.getItem("selectedVolunteer");

    if (!selectedName) return;

    const cards = document.querySelectorAll(".vol-card");

    cards.forEach(card => {

        const name = card.querySelector(".vol-name")?.innerText;

        if (name === selectedName) {

            card.style.border = "2px solid #3b82f6";
            card.style.boxShadow = "0 0 15px rgba(59,130,246,0.4)";

            card.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    });

    // 🔥 Clear after use
    localStorage.removeItem("selectedVolunteer");
}