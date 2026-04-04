import { db } from "./firebase_config.js";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";


// 🔍 Get ID from URL (for edit mode)
const params = new URLSearchParams(window.location.search);
const volunteerId = params.get("id");


// ✅ LOAD EXISTING DATA (EDIT MODE)
if (volunteerId) {
    loadVolunteer(volunteerId);
}

async function loadVolunteer(id) {
    try {
        const snap = await getDoc(doc(db, "volunteers", id));

        if (snap.exists()) {
            const data = snap.data();

            document.getElementById("volName").value = data.name;
            document.getElementById("volPhone").value = data.phone;
            document.getElementById("volRole").value = data.role;
        }

    } catch (error) {
        console.error(error);
        alert("Error loading volunteer data");
    }
}


// 🚀 MAIN FUNCTION (ADD + UPDATE)
window.addVolunteer = async function () {

    const name = document.getElementById("volName").value.trim();
    let phone = document.getElementById("volPhone").value.trim();
    const role = document.getElementById("volRole").value.trim();

    // ✅ validation
    if (!name || !phone || !role) {
        alert("Please fill all fields");
        return;
    }

    // ✅ normalize phone
    phone = phone.replace(/\s+/g, "");

    if (!phone.startsWith("+")) {
        alert("Phone must include country code (e.g. +91...)");
        return;
    }

    try {

        // ✏️ UPDATE MODE
        if (volunteerId) {

            await updateDoc(doc(db, "volunteers", volunteerId), {
                name: name,
                phone: phone,
                role: role
            });

            alert("Volunteer updated successfully");

        } 
        // ➕ ADD MODE
        else {

            await addDoc(collection(db, "volunteers"), {
                name: name,
                phone: phone,
                role: role,
                status: "Active"
            });

            alert("Volunteer added successfully");
        }

        // clear fields
        document.getElementById("volName").value = "";
        document.getElementById("volPhone").value = "";
        document.getElementById("volRole").value = "";

        // 🔁 redirect back to list
        window.location.href = "volunteers.html";

    } catch (error) {

        console.error(error);
        alert("Failed to add volunteer");

    }
};


// 🔄 LIVE PREVIEW
const nameInput = document.getElementById("volName");
const roleInput = document.getElementById("volRole");

nameInput.addEventListener("input", () => {
    const name = nameInput.value || "Volunteer Name";
    document.getElementById("previewName").innerText = name;
    document.getElementById("avatarPreview").innerText =
        name.charAt(0).toUpperCase();
});

roleInput.addEventListener("change", () => {
    document.getElementById("previewRole").innerText =
        roleInput.value || "Role";
});