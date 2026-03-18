import { db } from "./firebase_config.js";

import {
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";


// GET REPORT ID FROM URL
const params = new URLSearchParams(window.location.search);
const reportId = params.get("id");

// GLOBAL
let reportLat = null;
let reportLng = null;



// LOAD REPORT
loadReport();

async function loadReport() {

    if (!reportId) return;

    try {

        const reportRef = doc(db, "reports", reportId);
        const reportSnap = await getDoc(reportRef);

        if (!reportSnap.exists()) {
            alert("Report not found");
            return;
        }

        const data = reportSnap.data();


        // BASIC DATA
        document.getElementById("reportId").innerText = reportId;
        document.getElementById("animalType").innerText = data.animalType || "-";
        document.getElementById("caseType").innerText = data.caseType || "-";
        // DISPLAY address
        document.getElementById("location").innerText = data.location?.address || "-";

        // STORE coordinates (IMPORTANT)
        reportLat = data.location?.latitude || null;
        reportLng = data.location?.longitude || null;
        document.getElementById("description").innerText = data.description || "-";


        // IMAGE
        // IMAGE
        const image = document.getElementById("animalImage");
        const loader = document.getElementById("imageLoader");

        // choose image source
        if (data.imageUrl) {
            image.src = data.imageUrl;
        } else {
            image.src = "../image/no-image.png";
        }

        // when image finishes loading
        image.onload = function () {
            loader.style.display = "none";
            image.style.display = "block";
            image.style.opacity = "1";
        };

        // if image fails
        image.onerror = function () {
            loader.style.display = "none";
            image.src = "../image/no-image.png";
            image.style.display = "block";
        };


        // STATUS
        const statusBadge = document.getElementById("statusBadge");

        statusBadge.innerText = data.status;

        statusBadge.classList.remove("pending", "resolved");

        if (data.status === "Resolved") {
            statusBadge.classList.add("resolved");
        } else {
            statusBadge.classList.add("pending");
        }

        // SHOW ASSIGNED VOLUNTEER
        // SHOW ASSIGNED VOLUNTEER
        const resolveBtn = document.getElementById("resolveBtn");
        const volunteerElement = document.getElementById("assignedVolunteer");

        const warning = document.getElementById("resolveWarning");

        // show volunteer
        if (data.assignedVolunteer) {
            volunteerElement.innerText = data.assignedVolunteer;
        } else {
            volunteerElement.innerText = "Not Assigned";
        }

        // control resolve button + warning
        const volunteer = data.assignedVolunteer;
        const status = data.status;

        // 🚨 CASE 1: No volunteer
        if (!volunteer || volunteer.trim() === "") {
            resolveBtn.disabled = true;
            warning.style.display = "block";
        }

        // ✅ CASE 2: Already resolved
        else if (status === "Resolved") {
            resolveBtn.disabled = true;
            warning.style.display = "none"; // 🔥 FIX
        }

        // ✅ CASE 3: Ready to resolve
        else {
            resolveBtn.disabled = false;
            warning.style.display = "none";
        }

        
        // DATE & TIME AGO
        let reportDate = null;

        if (data.createdAt && data.createdAt.toDate) {
            reportDate = data.createdAt.toDate();
        }

        if (reportDate) {

            document.getElementById("reportDate").innerText =
                reportDate.toLocaleString();

            document.getElementById("reportTimeAgo").innerText =
                getTimeAgo(reportDate);

        } else {

            document.getElementById("reportDate").innerText = "-";
            document.getElementById("reportTimeAgo").innerText = "-";

        }

    } catch (error) {

        console.error("Error loading report:", error);
        alert("Failed to load report.");

    }

};

function getMapLink() {
    if (reportLat === null || reportLng === null) {
        alert("Location not available");
        return null;
    }
    return `https://www.google.com/maps?q=${reportLat},${reportLng}`;
}

window.openMaps = function () {
    const link = getMapLink();
    if (link) window.open(link, "_blank");
};

window.shareLocation = function () {
    const link = getMapLink();
    if (!link) return;

    const msg = `🚨 Animal Report Location:\n${link}`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;

    window.open(url, "_blank");
};

window.copyLocation = function () {
    const link = getMapLink();
    if (!link) return;

    navigator.clipboard.writeText(link);
    alert("Location copied!");
};

// LOAD VOLUNTEERS INTO DROPDOWN
async function loadVolunteers() {

    const select = document.getElementById("volunteerSelect");

    try {

        const snapshot = await getDocs(collection(db, "volunteers"));

        snapshot.forEach(doc => {

            const data = doc.data();

            const option = document.createElement("option");

            option.value = data.name;
            option.textContent = `${data.name} • ${data.role}`;

            select.appendChild(option);

        });

    } catch (error) {

        console.error("Failed to load volunteers:", error);

    }

}

loadVolunteers();

// TIME AGO FUNCTION
function getTimeAgo(time) {

    const now = new Date();

    const seconds = Math.floor((now - time) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(seconds / 86400);

    if (days > 0) return days + " day(s) ago";
    if (hours > 0) return hours + " hour(s) ago";
    if (minutes > 0) return minutes + " minute(s) ago";

    return "Just now";

}


// TOGGLE STATUS
window.toggleStatus = async function () {

    try {

        const reportRef = doc(db, "reports", reportId);
        const snap = await getDoc(reportRef);
        const data = snap.data();

        const currentStatus = data.status;

        // 🔥 GET VOLUNTEER FROM UI (REAL-TIME)
        const volunteerUI =
            document.getElementById("assignedVolunteer").innerText;

        // ALSO KEEP DB VALUE (fallback)
        const volunteerDB = data.assignedVolunteer;

        const volunteer = volunteerUI || volunteerDB;

        // 🚨 VALIDATION
        if (!volunteer || volunteer === "Not Assigned") {
            alert("Please assign a volunteer before resolving this report.");
            return;
        }

        if (currentStatus === "Resolved") {
            alert("This report is already resolved.");
            return;
        }

        const newStatus = "Resolved";

        const updateData = {
            status: newStatus,
            updatedAt: serverTimestamp(),
            resolvedAt: serverTimestamp()
        };

        await updateDoc(reportRef, updateData);

        // ✅ UPDATE UI
        const badge = document.getElementById("statusBadge");

        badge.innerText = newStatus;
        badge.classList.remove("pending", "resolved");
        badge.classList.add("resolved");

        document.getElementById("resolveBtn").disabled = true;

    } catch (error) {

        console.error("Status update failed:", error);
        alert("Failed to update status.");

    }

};



// DELETE REPORT
window.deleteReport = async function () {

    const confirmDelete = confirm("Are you sure you want to delete this report?");

    if (!confirmDelete) return;

    try {

        await deleteDoc(doc(db, "reports", reportId));

        alert("Report deleted successfully");

        window.location.href = "home_screen.html";

    } catch (error) {

        console.error("Delete failed:", error);
        alert("Failed to delete report.");

    }

};

// BACK BUTTON
window.goBack = function () {
    window.history.back();
};

// ASSIGN VOLUNTEER
window.assignVolunteer = async function () {

    const select = document.getElementById("volunteerSelect");
    const volunteer = select.value;

    if (!volunteer) {
        alert("Please select a volunteer");
        return;
    }

    try {

        const reportRef = doc(db, "reports", reportId);

        await updateDoc(reportRef, {
            assignedVolunteer: volunteer
        });

        document.getElementById("assignedVolunteer").innerText = volunteer;

        // enable resolve button after assignment
        document.getElementById("resolveBtn").disabled = false;
        document.getElementById("resolveWarning").style.display = "none";

        alert("Volunteer Assigned Successfully");

    } catch (error) {

        console.error("Assignment failed:", error);
        alert("Failed to assign volunteer");

    }

};

window.viewVolunteer = function () {

    const volunteer = document.getElementById("assignedVolunteer").innerText;

    if (volunteer === "Not Assigned") {
        alert("No volunteer assigned yet.");
        return;
    }

    window.location.href =
        `volunteers.html?name=${encodeURIComponent(volunteer)}`;
};