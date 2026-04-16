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
let selectedFiles = [];


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

        // ================= IMAGES (MULTIPLE SUPPORT) =================
        const container = document.getElementById("animalImageContainer");


        let images = [];

        // ✅ HANDLE BOTH OLD + NEW DATA
        if (data.imageUrls && Array.isArray(data.imageUrls)) {
            images = data.imageUrls;
        } else if (data.imageUrl) {
            images = Array.isArray(data.imageUrl)
                ? data.imageUrl
                : [data.imageUrl];
        }

        // ✅ PREVENT RE-RENDER (IMPORTANT)
        const prevImages = container.dataset.images;

        if (prevImages === JSON.stringify(images)) {
            return; // 🔥 STOP if same images
        }

        // ✅ SAVE CURRENT STATE
        container.dataset.images = JSON.stringify(images);

        // NOW SAFE TO CLEAR
        container.innerHTML = "";

        // ❌ NO IMAGE
        if (images.length === 0) {
            container.innerHTML = `
        <img src="../image/no-image.png"
        style="width:100%; height:100%; object-fit:cover;">
    `;
        }
        else {
            images.forEach((url) => {

                const wrapper = document.createElement("div");
                wrapper.style.position = "relative";
                wrapper.style.flex = "0 0 320px";
                wrapper.style.height = "280px";
                wrapper.style.borderRadius = "14px";
                wrapper.style.overflow = "hidden";
                wrapper.style.background = "#eee";
                wrapper.style.marginRight = "12px";

                // 🔄 PER IMAGE LOADER
                const loader = document.createElement("div");
                loader.style.position = "absolute";
                loader.style.top = "50%";
                loader.style.left = "50%";
                loader.style.transform = "translate(-50%, -50%)";
                loader.style.width = "35px";
                loader.style.height = "35px";
                loader.style.border = "4px solid #ddd";
                loader.style.borderTop = "4px solid #4CAF50";
                loader.style.borderRadius = "50%";
                loader.style.animation = "spin 1s linear infinite";

                const img = document.createElement("img");
                img.src = url;
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "cover";
                img.style.display = "none"; // hide until loaded

                // ✅ SUCCESS
                img.onload = () => {
                    loader.remove();
                    img.style.display = "block";
                };

                // ❌ ERROR
                img.onerror = () => {
                    loader.remove();
                    img.src = "../image/no-image.png";
                    img.style.display = "block";
                };

                // 🔍 CLICK TO VIEW (ADD THIS)
                img.style.cursor = "pointer";
                img.onclick = () => {
                    window._imageModal.style.display = "block";
                    window._modalImg.src = url;
                };

                wrapper.appendChild(loader);
                wrapper.appendChild(img);
                container.appendChild(wrapper);
            });
        }

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
            const container = document.getElementById("resolvedImageContainer");
            const loader = document.getElementById("resolvedImageLoader");

            // show loader first

            container.innerHTML = "";

            const images = data.resolutionImages || [];

            if (images.length === 0) {
                loader.style.display = "none";
                container.innerHTML = "<p>No images uploaded</p>";
            } else {



                images.forEach((url) => {

                    // 📦 WRAPPER
                    const wrapper = document.createElement("div");
                    wrapper.style.position = "relative";
                    wrapper.style.width = "120px";
                    wrapper.style.height = "120px";
                    wrapper.style.borderRadius = "10px";
                    wrapper.style.overflow = "hidden";
                    wrapper.style.marginRight = "10px";
                    wrapper.style.background = "#f5f5f5";

                    // 🔄 LOADER (centered)
                    const loader = document.createElement("div");
                    loader.style.position = "absolute";
                    loader.style.top = "50%";
                    loader.style.left = "50%";
                    loader.style.transform = "translate(-50%, -50%)";
                    loader.style.width = "28px";
                    loader.style.height = "28px";
                    loader.style.border = "3px solid #ddd";
                    loader.style.borderTop = "3px solid #4CAF50";
                    loader.style.borderRadius = "50%";
                    loader.style.animation = "spin 1s linear infinite";

                    // 🖼 IMAGE
                    const img = document.createElement("img");
                    img.src = url;

                    img.style.width = "100%";
                    img.style.height = "100%";
                    img.style.objectFit = "cover";
                    img.style.display = "none"; // hide until loaded

                    // ✅ LOAD SUCCESS
                    img.onload = () => {
                        loader.style.display = "none";
                        img.style.display = "block";
                    };

                    // ❌ LOAD FAIL
                    img.onerror = () => {
                        loader.style.display = "none";
                        img.style.display = "block";
                    };

                    // 🔍 CLICK TO VIEW
                    img.style.cursor = "pointer";
                    img.onclick = () => {
                        window._imageModal.style.display = "block";
                        window._modalImg.src = url;
                    };

                    // 📌 APPEND
                    wrapper.appendChild(loader);
                    wrapper.appendChild(img);
                    container.appendChild(wrapper);
                });
            }

            // 📝 Note
            const resolvedNote = document.getElementById("resolvedNote");
            resolvedNote.innerText = data.resolutionNote || "No resolution note added.";

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
    const warning = document.getElementById("resolutionWarning");
    if (warning) warning.style.display = "none";
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

    // ✅ Normalize images
    let images = [];
    if (Array.isArray(reportData.imageUrls)) {
        images = reportData.imageUrls;
    } else if (typeof reportData.imageUrls === "string") {
        images = reportData.imageUrls.split(",");
    } else if (reportData.imageUrl) {
        images = Array.isArray(reportData.imageUrl)
            ? reportData.imageUrl
            : [reportData.imageUrl];
    }

    const firstImage = images.length > 0 ? images[0] : null;

    // ✅ Extra images — no leading \n
    let extraImagesText = "";
    if (images.length > 1) {
        const remaining = images.slice(1, 3);
        extraImagesText = remaining.map((url, i) =>
            `📷 Photo ${i + 2}: ${url}`
        ).join("\n");

        if (images.length > 3) {
            extraImagesText += `\n+${images.length - 3} more photos`;
        }
    }

    // ✅ Format date
    let reportedOn = "-";
    if (reportData.createdAt?.toDate) {
        reportedOn = reportData.createdAt.toDate().toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        });
    }

    const volunteer = reportData.assignedVolunteer?.name || "Volunteer";

    // ✅ Build lines array — filter out empty strings cleanly
    const lines = [
        `🚨 *SARRS Rescue Alert*`,
        ``,
        `Hi ${volunteer},`,
        `A new rescue case has been assigned to you.`,
        ``,
        `📌 *Location:*`,
        `${mapLink}`,
        ``,
        `🔢 *Report ID:* ${reportId}`,
        ``,
        `🐕 *Animal:* ${reportData.animalType || "-"}`,
        `⚠️ *Case:* ${reportData.caseType || "-"}`,   // ✅ fixed emoji
        `🕒 *Reported:* ${reportedOn}`,
        ``,
        `📝 *Details:*`,
        `${reportData.description || "No description provided."}`,
        ``,
        firstImage ? `📸 *Photo 1:*\n${firstImage}` : `📷 No image provided`,
    ];

    // ✅ Add extra images only if they exist — no double blank lines
    if (extraImagesText) {
        lines.push(``);
        lines.push(extraImagesText);
    }

    lines.push(``);
    lines.push(`➡️ Please take action as soon as possible.`);
    lines.push(``);
    lines.push(`— *SARRS Team*`);

    return encodeURIComponent(lines.join("\n"));
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

        const warning = document.getElementById("resolutionWarning");

        const files = selectedFiles;

        if (files.length === 0) {
            warning.style.display = "block";
            return;
        }

        warning.style.display = "none";

        // 🔥 upload all images
        const imageUrls = [];

        for (const file of files) {

            const storageRef = ref(
                storage,
                `resolution_images/${reportId}_${Date.now()}_${file.name}`
            );

            const snapshot = await uploadBytes(storageRef, file);
            const url = await getDownloadURL(snapshot.ref);

            imageUrls.push(url);
        }




        const updateData = {
            status: newStatus,
            updatedAt: serverTimestamp(),
            resolvedAt: serverTimestamp(),

            // 🔥 NEW FIELDS
            resolutionImages: imageUrls,
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
const previewContainer = document.getElementById("previewContainer");

if (imageInput) {
    imageInput.addEventListener("change", function () {

        const newFiles = Array.from(this.files);

        // ✅ ADD instead of replace
        selectedFiles = [...selectedFiles, ...newFiles];

        renderPreviews();

        // 🔥 reset input
        imageInput.value = "";

        // hide warning
        const warning = document.getElementById("resolutionWarning");
        if (warning) warning.style.display = "none";
    });
}


function renderPreviews() {

    previewContainer.innerHTML = "";

    selectedFiles.forEach((file, index) => {

        const reader = new FileReader();

        reader.onload = function (e) {

            // 📦 WRAPPER (FIXED CARD)
            const wrapper = document.createElement("div");
            wrapper.style.position = "relative";
            wrapper.style.width = "120px";
            wrapper.style.height = "120px";
            wrapper.style.borderRadius = "10px";
            wrapper.style.overflow = "hidden"; // 🔥 VERY IMPORTANT
            wrapper.style.boxShadow = "0 2px 6px rgba(0,0,0,0.15)";

            // 🖼 IMAGE
            const img = document.createElement("img");
            img.src = e.target.result;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            img.style.display = "block";

            // ❌ REMOVE BUTTON
            const removeBtn = document.createElement("button");
            removeBtn.innerText = "×";

            removeBtn.style.position = "absolute";
            removeBtn.style.top = "6px";
            removeBtn.style.right = "6px";
            removeBtn.style.background = "rgba(255,0,0,0.9)";
            removeBtn.style.color = "white";
            removeBtn.style.border = "none";
            removeBtn.style.borderRadius = "50%";
            removeBtn.style.width = "22px";
            removeBtn.style.height = "22px";
            removeBtn.style.fontSize = "14px";
            removeBtn.style.cursor = "pointer";
            removeBtn.style.display = "flex";
            removeBtn.style.alignItems = "center";
            removeBtn.style.justifyContent = "center";

            // 🔥 REMOVE LOGIC
            removeBtn.onclick = () => {
                selectedFiles.splice(index, 1);
                renderPreviews();
            };

            wrapper.appendChild(img);
            wrapper.appendChild(removeBtn);
            previewContainer.appendChild(wrapper);
        };

        reader.readAsDataURL(file);
    });
}


document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    const closeBtn = document.getElementById("closeModal");

    closeBtn.onclick = () => {
        modal.style.display = "none";
    };

    window.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    };

    // 🔥 MAKE GLOBAL (IMPORTANT)
    window._imageModal = modal;
    window._modalImg = modalImg;
});