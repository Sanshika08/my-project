import { db } from "./firebase_config.js";
import { collection, addDoc } from
    "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

window.addVolunteer = async function () {

    const name = document.getElementById("volName").value.trim();
    let phone = document.getElementById("volPhone").value.trim();
    const role = document.getElementById("volRole").value.trim();

    // ✅ validation
    if (!name || !phone || !role) {
        alert("Please fill all fields");
        return;
    }

    // ✅ normalize phone (VERY IMPORTANT for WhatsApp)
    phone = phone.replace(/\s+/g, ""); // remove spaces

    if (!phone.startsWith("+")) {
        alert("Phone must include country code (e.g. +91...)");
        return;
    }

    try {

        await addDoc(collection(db, "volunteers"), {
            name: name,
            phone: phone,
            role: role,
            status: "Active"
        });

        alert("Volunteer added successfully");

        // clear fields
        document.getElementById("volName").value = "";
        document.getElementById("volPhone").value = "";
        document.getElementById("volRole").value = "";

    } catch (error) {

        console.error(error);
        alert("Failed to add volunteer");

    }

};