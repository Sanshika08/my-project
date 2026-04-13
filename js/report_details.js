import { db } from "./firebase_config.js";

import {
    doc,
    getDoc,
    onSnapshot,
    updateDoc,
    deleteDoc,
    collection,
    getDocs,
    serverTimestamp,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-storage.js";

const storage = getStorage();


// GET REPORT ID FROM URL
const params = new URLSearchParams(window.location.search);
const reportId = params.get("id");

console.log("Opened report ID:", reportId);

// GLOBAL
let reportLat = null;
let reportLng = null;
let reportData = null;


// LOAD REPORT
loadReport();

function loadReport() {

    if (!reportId) return;

    const reportRef = doc(db, "reports", reportId);

    onSnapshot(reportRef, (reportSnap) => {

        if (!reportSnap.exists()) {
            console.log("Report deleted");

            // 🔥 Prevent duplicate alerts
            if (!window._isDeleting) {
                alert("Report not found");
            }

            return;
        }

        const data = reportSnap.data();
        reportData = data; // ✅ GLOBAL STORE

        // ================= BASIC DATA =================
        document.getElementById("reportId").innerText = reportId;
        document.getElementById("animalType").innerText = data.animalType || "-";
        document.getElementById("caseType").innerText = data.caseType || "-";
        document.getElementById("location").innerText = data.location?.address || "-";
        document.getElementById("description").innerText = data.description || "-";

        // ================= LOCATION =================
        reportLat = data.location?.latitude || null;
        reportLng = data.location?.longitude || null;

        // ================= IMAGE =================
        const image = document.getElementById("animalImage");
        const loader = document.getElementById("imageLoader");

        image.src = data.imageUrl || "../image/no-image.png";

        image.onload = function () {
            loader.style.display = "none";
            image.style.display = "block";
            image.style.opacity = "1";
        };

        image.onerror = function () {
            loader.style.display = "none";
            image.src = "../image/no-image.png";
            image.style.display = "block";
        };

        // ================= STATUS =================
        const statusBadge = document.getElementById("statusBadge");

        statusBadge.innerText = data.status || "Pending";
        statusBadge.classList.remove("pending", "resolved", "assigned");

        if (data.status === "Pending") {
            statusBadge.classList.add("pending");
        } else if (data.status === "Assigned") {
            statusBadge.classList.add("assigned");
        } else if (data.status === "Resolved") {
            statusBadge.classList.add("resolved");
        }

        const resolutionContainer = document.getElementById("resolutionContainer");

        if (data.status === "Assigned") {
            resolutionContainer.style.display = "block";
        } else {
            resolutionContainer.style.display = "none";
        }

        // ================= VOLUNTEER =================
        const resolveBtn = document.getElementById("resolveBtn");
        const shareBtn = document.getElementById("shareBtn");
        const volunteerElement = document.getElementById("assignedVolunteer");
        const warning = document.getElementById("resolveWarning");

        const volunteer = data.assignedVolunteer?.name || "";

        volunteerElement.innerText = volunteer || "Not Assigned";

        // ================= BUTTON CONTROL =================
        if (!volunteer.trim()) {
            resolveBtn.disabled = true;
            if (shareBtn) shareBtn.disabled = true;
            warning.style.display = "block";
        }
        else if (data.status === "Resolved") {
            resolveBtn.disabled = true;
            if (shareBtn) shareBtn.disabled = false;
            warning.style.display = "none";
        }
        else {
            resolveBtn.disabled = false;
            if (shareBtn) shareBtn.disabled = false;
            warning.style.display = "none";
        }

        // ================= DATE =================
        let reportDate = null;

        if (data.createdAt?.toDate) {
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

        // ================= RESOLUTION DETAILS =================
        const resolvedDisplay = document.getElementById("resolvedDisplay");

        if (data.status === "Resolved") {

            resolvedDisplay.style.display = "block";

            // 📸 Image
            const resolvedImage = document.getElementById("resolvedImage");
            const loader = document.getElementById("resolvedImageLoader");

            // 🔄 show loader first
            resolvedImage.style.display = "none";
            loader.style.display = "flex";

            // set image
            resolvedImage.src = data.resolutionImage || "";

            // ✅ when image loads
            resolvedImage.onload = function () {
                loader.style.display = "none";
                resolvedImage.style.display = "block";
            };

            // ❌ if image fails
            resolvedImage.onerror = function () {
                loader.style.display = "none";
                resolvedImage.src = "../image/no-image.png";
                resolvedImage.style.display = "block";
            };

            // 📝 Note
            const resolvedNote = document.getElementById("resolvedNote");
            resolvedNote.innerText = data.resolutionNote || "No details provided.";

            // 🕒 Time
            const resolvedTime = document.getElementById("resolvedTime");

            if (data.resolvedAt?.toDate) {
                const dateObj = data.resolvedAt.toDate();

                const formatted = dateObj.toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true // 🔥 THIS ADDS AM/PM
                });

                resolvedTime.innerText = "Resolved on: " + formatted;
            }

        } else {
            resolvedDisplay.style.display = "none";
        }

    });
    document.getElementById("resolutionWarning").style.display = "none";
}



async function getVolunteerPhone(name) {

    const cleanName = name.trim(); // 🔥 FIX

    const q = query(collection(db, "volunteers"), where("name", "==", cleanName));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        return snapshot.docs[0].data().phone;
    }

    return null;
}


function generateWhatsAppMessage() {

    if (!reportData) return null;

    const mapLink = reportLat && reportLng
        ? `https://www.google.com/maps?q=${reportLat},${reportLng}`
        : "Location not available";

    return encodeURIComponent(`
🚨 *SARRS Rescue Alert*

🆔 Report ID: ${reportId}

🐾 Animal: ${reportData.animalType || "-"}
⚠️ Case: ${reportData.caseType || "-"}

📝 Description:
${reportData.description || "-"}

📍 Location:
${mapLink}

🖼 Image:
${reportData.imageUrl || "No image"}

👉 Please take action.
`);
}

window.shareWithVolunteer = async function () {

    if (!reportData) {
        alert("Report still loading. Please try again.");
        return;
    }

    const volunteer =
        document.getElementById("assignedVolunteer").innerText.trim();

    if (!volunteer || volunteer === "Not Assigned") {
        alert("Assign volunteer first!");
        return;
    }

    try {

        let allowSend = true;

        // 🔥 CHECK: already shared
        if (reportData.sharedWith === volunteer) {

            const confirmResend = confirm(
                "⚠️ Already sent to this volunteer.\n\nDo you want to resend?"
            );

            if (!confirmResend) {
                allowSend = false;
            }
        }

        if (!allowSend) return;

        const phone = await getVolunteerPhone(volunteer);

        if (!phone) {
            alert("Volunteer phone not found!");
            return;
        }

        const cleanPhone = phone.replace(/\D/g, "");

        let finalPhone = cleanPhone;

        if (cleanPhone.length === 10) {
            finalPhone = "91" + cleanPhone;
        }

        const message = generateWhatsAppMessage();

        const url = `https://wa.me/${finalPhone}?text=${message}`;

        // ✅ SAVE / UPDATE SHARE STATUS
        await updateDoc(doc(db, "reports", reportId), {
            sharedWith: volunteer,
            sharedAt: serverTimestamp()
        });

        // 🔥 update local state
        reportData.sharedWith = volunteer;

        // 🔥 open WhatsApp
        window.location.href = url;

    } catch (error) {

        console.error("WhatsApp share failed:", error);
        alert("Failed to share report");

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

            // 🔥 FILTER ONLY ACTIVE
            if (data.status !== "Active") return;

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

        // 🔥 GET FILE + NOTE
        const imageInput = document.getElementById("resolutionImageInput");
        const note = document.getElementById("resolutionNote").value || "";

        const file = imageInput.files[0];

        const warning = document.getElementById("resolutionWarning");

        if (!file) {
            warning.style.display = "block";
            return;
        }

        // ✅ hide when valid
        warning.style.display = "none";

        // 🔥 CREATE STORAGE PATH
        const storageRef = ref(storage, `resolution_images/${reportId}_${Date.now()}`);

        // 🔥 UPLOAD FILE
        const snapshot = await uploadBytes(storageRef, file);

        // 🔥 GET DOWNLOAD URL
        const imageUrl = await getDownloadURL(snapshot.ref);

        const updateData = {
            status: newStatus,
            updatedAt: serverTimestamp(),
            resolvedAt: serverTimestamp(),

            // 🔥 NEW FIELDS
            resolutionImage: imageUrl,
            resolutionNote: note
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
        alert(error.message);

    }

};



// DELETE REPORT
window.deleteReport = async function () {

    const confirmDelete = confirm("Are you sure you want to delete this report?");
    if (!confirmDelete) return;

    try {

        window._isDeleting = true; // 🔥 FLAG

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

async function getVolunteerDetails(name) {
    const q = query(collection(db, "volunteers"), where("name", "==", name));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        return snapshot.docs[0].data(); // {name, phone}
    }

    return null;
}

// ASSIGN VOLUNTEER
window.assignVolunteer = async function () {

    const select = document.getElementById("volunteerSelect");
    const volunteerName = select.value;

    if (!volunteerName) {
        alert("Please select a volunteer");
        return;
    }

    try {

        // 🔥 GET FULL VOLUNTEER DATA
        const q = query(
            collection(db, "volunteers"),
            where("name", "==", volunteerName)
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            alert("Volunteer not found");
            return;
        }

        const volunteerData = snapshot.docs[0].data();

        // ✅ SAFE ACCESS
        const name = volunteerData['name'] || "";
        const phone = volunteerData['phone'] || "";

        const reportRef = doc(db, "reports", reportId);

        // 🔥 UPDATE REPORT WITH FULL OBJECT
        await updateDoc(reportRef, {
            status: "Assigned",
            assignedVolunteer: {
                name: name,
                phone: phone
            },
            assignedAt: serverTimestamp(),

            sharedWith: null,
            sharedAt: null
        });

        // ✅ Update UI
        document.getElementById("assignedVolunteer").innerText = name;

        // 🔥 Update local state
        reportData.assignedVolunteer = {
            name: name,
            phone: phone
        };

        reportData.status = "Assigned";

        // ✅ Enable buttons
        document.getElementById("resolveBtn").disabled = false;
        document.getElementById("resolveWarning").style.display = "none";

        const shareBtn = document.getElementById("shareBtn");
        if (shareBtn) shareBtn.disabled = false;

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



const imageInput = document.getElementById("resolutionImageInput");
const preview = document.getElementById("resolutionPreview");
const removeBtn = document.getElementById("removeImageBtn");

if (imageInput) {
    imageInput.addEventListener("change", function () {

        const file = this.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = function (e) {
                preview.src = e.target.result;
                preview.style.display = "block";
                removeBtn.style.display = "block";

                // 🔥 ALWAYS hide warning after selecting image
                const warning = document.getElementById("resolutionWarning");
                if (warning) warning.style.display = "none";
            };

            reader.readAsDataURL(file);
        }
    });
}

// ❌ REMOVE IMAGE LOGIC
if (removeBtn) {
    removeBtn.addEventListener("click", () => {

        imageInput.value = "";              // clear file input
        preview.src = "";
        preview.style.display = "none";
        removeBtn.style.display = "none";

        // 🔥 hide warning if previously shown
        const warning = document.getElementById("resolutionWarning");
        if (warning) warning.style.display = "none";
    });
}