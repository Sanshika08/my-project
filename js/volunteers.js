import { db } from "./firebase_config.js";

import {
    collection,
    onSnapshot,
    doc,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";




window.addEventListener("DOMContentLoaded", () => {

    const container = document.getElementById("volunteerTable");
    const loader = document.getElementById("loader");

    if (!container || !loader) {
        console.error("❌ Elements not found");
        return;
    }

    console.log("✅ Volunteers JS Loaded");

    // Get volunteer name from URL
    const params = new URLSearchParams(window.location.search);
    const selectedVolunteer = params.get("name");

    loader.style.display = "flex";

    onSnapshot(collection(db, "volunteers"), (snapshot) => {

    container.innerHTML = "";

    // ✅ DEFINE FIRST (VERY IMPORTANT)
    let total = 0;
    let active = 0;
    let inactive = 0;

    snapshot.forEach(docSnap => {

        const data = docSnap.data();
        const id = docSnap.id;

        // ✅ COUNT FIRST
        total++;

        if (data.status === "Inactive") {
            inactive++;
        } else {
            active++;
        }

        const firstLetter = data.name
            ? data.name.charAt(0).toUpperCase()
            : "?";

        const card = `
        <div class="vol-card">

            <div class="vol-actions">
                <i class="fas fa-edit edit-btn" onclick="editVolunteer('${id}')"></i>
                <i class="fas fa-trash delete-btn" onclick="deleteVolunteer('${id}')"></i>
            </div>

            <div class="avatar">${firstLetter}</div>

            <div class="vol-info">
                <div class="vol-name">${data.name}</div>
                <div class="vol-phone">📞 ${data.phone}</div>
                <div class="vol-role">${data.role}</div>
            </div>

            <div class="status-toggle">
                <label class="switch">
                    <input type="checkbox" 
                        ${data.status !== "Inactive" ? "checked" : ""} 
                        onchange="toggleStatus('${id}', this.checked)">
                    <span class="slider"></span>
                </label>
                <span class="status-text">
                    ${data.status || "Active"}
                </span>
            </div>

        </div>
        `;

        container.innerHTML += card;
    });

    // ✅ UPDATE STATS SAFELY
    const totalEl = document.getElementById("totalVol");
    const activeEl = document.getElementById("activeVol");
    const inactiveEl = document.getElementById("inactiveVol");

    if (totalEl) totalEl.innerText = total;
    if (activeEl) activeEl.innerText = active;
    if (inactiveEl) inactiveEl.innerText = inactive;

    loader.style.display = "none";
});

});


// ✏️ EDIT
window.editVolunteer = function (id) {
    window.location.href = `add_volunteer.html?id=${id}`;
};


// 🗑️ DELETE
window.deleteVolunteer = async function (id) {

    const confirmDelete = confirm("Delete this volunteer?");
    if (!confirmDelete) return;

    try {
        await deleteDoc(doc(db, "volunteers", id));
        alert("Deleted successfully");
    } catch (error) {
        console.error(error);
        alert("Error deleting");
    }
};


// 🔄 TOGGLE STATUS
window.toggleStatus = async function (id, isChecked) {

    const newStatus = isChecked ? "Active" : "Inactive";

    try {
        setTimeout(async () => {
            await updateDoc(doc(db, "volunteers", id), {
                status: newStatus
            });
        }, 150);

    } catch (error) {
        console.error(error);
        alert("Failed to update status");
    }
};



// 🔍 SEARCH
window.searchVolunteers = function () {
    const input = document.getElementById("volSearch").value.toLowerCase();

    const cards = document.querySelectorAll(".vol-card");

    cards.forEach(card => {
        const name = card.querySelector(".vol-name").innerText.toLowerCase();
        const phone = card.querySelector(".vol-phone").innerText.toLowerCase();

        if (name.includes(input) || phone.includes(input)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
};