import { db } from "./firebase_config.js";

import {
    collection,
    onSnapshot,
    doc,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";


const container = document.getElementById("volunteerTable");

// Get volunteer name from URL
const params = new URLSearchParams(window.location.search);
const selectedVolunteer = params.get("name");
const loader = document.getElementById("loader");

// ✅ show loader ONCE before loading
loader.style.display = "flex";

onSnapshot(collection(db, "volunteers"), (snapshot) => {

   
    container.innerHTML = "";

    snapshot.forEach(docSnap => {

        const data = docSnap.data();
        const id = docSnap.id;

        const firstLetter = data.name ? data.name.charAt(0).toUpperCase() : "?";

        const isSelected = data.name === selectedVolunteer;

        const card = `
        <div class="vol-card ${isSelected ? "active-card" : ""}">

            <div class="vol-actions">
                <i class="fas fa-edit edit-btn" onclick="editVolunteer('${id}')"></i>
                <i class="fas fa-trash delete-btn" onclick="deleteVolunteer('${id}')"></i>
            </div>

            <div class="avatar">
                ${firstLetter}
            </div>

            <div class="vol-info">

                <div class="vol-name">
                    ${data.name}
                </div>

                <div class="vol-phone">
                    📞 ${data.phone}
                </div>

                <div class="vol-role">
                    ${data.role}
                </div>

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

    loader.style.display = "none"; // hide loader

    // scroll to selected
    if (selectedVolunteer) {
        setTimeout(() => {
            const selectedCard = document.querySelector(".active-card");

            if (selectedCard) {
                selectedCard.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }
        }, 200);
    }

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

    // 🟢 Let UI animate first
    try {

        // small delay to allow animation
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