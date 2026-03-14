import { db } from "./firebase_config.js";

import {
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";


// GET REPORT ID FROM URL
const params = new URLSearchParams(window.location.search);
const reportId = params.get("id");


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
        document.getElementById("location").innerText = data.location?.address || "-";
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
        if (data.assignedVolunteer) {

            document.getElementById("assignedVolunteer").innerText =
                data.assignedVolunteer;

        }

        // DATE
        const reportDate = data.createdAt.toDate();

        document.getElementById("reportDate").innerText =
            reportDate.toLocaleString();


        // TIME AGO
        document.getElementById("reportTimeAgo").innerText =
            getTimeAgo(reportDate);

    } catch (error) {

        console.error("Error loading report:", error);
        alert("Failed to load report.");

    }

}

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

        const currentStatus = snap.data().status;

        const newStatus = currentStatus === "Pending"
            ? "Resolved"
            : "Pending";

        await updateDoc(reportRef, {
            status: newStatus
        });


        // UPDATE UI WITHOUT RELOAD
        const badge = document.getElementById("statusBadge");

        badge.innerText = newStatus;

        badge.classList.remove("pending", "resolved");

        if (newStatus === "Resolved") {
            badge.classList.add("resolved");
        } else {
            badge.classList.add("pending");
        }

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

        alert("Volunteer Assigned Successfully");

    } catch (error) {

        console.error("Assignment failed:", error);
        alert("Failed to assign volunteer");

    }

};

window.viewVolunteer = function(){

const name = document.getElementById("assignedVolunteer").innerText;

if(name === "Not Assigned"){
alert("No volunteer assigned");
return;
}

// redirect to volunteer profile page
window.viewVolunteer = function(){

const volunteer = document.getElementById("assignedVolunteer").innerText;

if(volunteer === "Not Assigned"){
alert("No volunteer assigned yet.");
return;
}

window.location.href = `volunteers.html?name=${encodeURIComponent(volunteer)}`;

};

};