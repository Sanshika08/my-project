import { auth, db } from "./firebase_config.js";

import { onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

import { doc, getDoc, collection, query, orderBy, onSnapshot, getDocs }
    from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import { updateDoc, where } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";


// ================= USER PROFILE =================
function setupUserProfile() {
    onAuthStateChanged(auth, async (user) => {

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            let name = "Admin";

            if (userSnap.exists()) {
                name = userSnap.data().name || "Admin";
            }

            const email = user.email;

            // ✅ Navbar already loaded → no need for delay
            const nameEl = document.querySelector(".profile-top h3");
            const emailEl = document.querySelector(".profile-top p");
            const avatarEl = document.querySelector(".avatar");

            if (nameEl) nameEl.innerText = name;
            if (emailEl) emailEl.innerText = email;

            if (avatarEl && email) {
                avatarEl.innerText = email.charAt(0).toUpperCase();
            }

        } catch (error) {
            console.error("User fetch error:", error);
        }
    });
}


// ================= 🔔 NOTIFICATIONS =================
function setupNotifications() {
    const list = document.getElementById("notificationList");
    const badge = document.getElementById("notificationBadge");

    if (!list) return;

    const q = query(
        collection(db, "notifications"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, (snapshot) => {

        list.innerHTML = "";

        let unreadCount = 0;

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();

            // ✅ Count only unread
            if (data.isRead !== true) unreadCount++;

            const li = document.createElement("li");
            li.classList.add("notification-card");

            if (data.isRead !== true) {
                li.classList.add("unread");
            }

            const icon = getNotificationIcon(data.body);

            li.innerHTML = `
             <div class="notif-avatar">${icon}</div>

                <div class="notif-body">
                        <div class="notif-title">${data.title || "Animal Alert"}</div>
                        <div class="notif-message">${data.body || "New update"}</div>

                        <div class="notif-footer">
                            <span class="notif-time">${formatTime(data.createdAt)}</span>
                        </div>
                </div>
                `;
            li.addEventListener("click", async () => {

                // ✅ mark ONLY this notification as read
                if (data.isRead !== true) {
                    await updateDoc(doc(db, "notifications", docSnap.id), {
                        isRead: true
                    });
                }

                // 👉 navigate
                if (data.reportId) {
                    window.location.href = `report_details.html?id=${data.reportId}`;
                }
            });

            list.appendChild(li);
        });

        // 🔴 Update badge
        if (badge) {
            badge.innerText = unreadCount;

            if (unreadCount === 0) {
                badge.style.display = "none";
            } else {
                badge.style.display = "inline-block";
            }
        }
    });
}


// ================= NOTIFICATION ICONS =================
function getNotificationIcon(text) {
    if (!text) return "🔔";

    if (text.includes("Dead")) return "💀";
    if (text.includes("Injured")) return "🩺";
    if (text.includes("Stray")) return "🐕";

    return "🐾";
}


// ================= UTILS =================
function formatTime(timestamp) {
    if (!timestamp) return "";

    const now = new Date();
    const time = timestamp.toDate();

    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

    return time.toLocaleDateString();
}

// ================= LOAD NAVBAR =================
window.loadNavbar = async function () {
    const res = await fetch("../html/navbar.html");
    const data = await res.text();

    document.getElementById("navbarContainer").innerHTML = data;

    setActiveNav();

    // 🔥 ORDER MATTERS
    setupUserProfile();
    setupNotifications();   // ✅ VERY IMPORTANT
};


// ================= 🔔 SIDEBAR =================

let hasOpenedOnce = false; // 🔥 global flag

window.openSidebar = async function () {
    const sidebar = document.getElementById("notificationSidebar");
    if (sidebar) sidebar.style.transform = "translateX(0)";

    // ✅ ONLY mark read AFTER first open
    if (hasOpenedOnce) {
        try {
            const q = query(
                collection(db, "notifications"),
                where("isRead", "==", false)
            );

            const snapshot = await getDocs(q);

            const updates = [];

            snapshot.forEach((docSnap) => {
                updates.push(
                    updateDoc(doc(db, "notifications", docSnap.id), {
                        isRead: true
                    })
                );
            });

            await Promise.all(updates);

        } catch (error) {
            console.error("Mark read failed:", error);
        }
    }

    hasOpenedOnce = true;
};


window.closeSidebar = function () {
    const sidebar = document.getElementById("notificationSidebar");
    if (sidebar) sidebar.style.transform = "translateX(100%)";
};


// ================= 👤 PROFILE =================
window.toggleProfileMenu = function () {
    const menu = document.getElementById("profileMenu");
    if (menu) {
        menu.style.display = menu.style.display === "block" ? "none" : "block";
    }
};


// Close outside click
document.addEventListener("click", function (e) {
    const profile = document.querySelector(".profile");
    const menu = document.getElementById("profileMenu");

    if (profile && menu && !profile.contains(e.target)) {
        menu.style.display = "none";
    }
});


// ================= 🔐 LOGOUT =================
window.openLogoutModal = function () {
    document.getElementById("confirmLogoutModal").style.display = "flex";
};

window.closeLogoutModal = function () {
    document.getElementById("confirmLogoutModal").style.display = "none";
};

window.confirmLogout = function () {
    const loader = document.getElementById("logoutLoader");

    document.getElementById("confirmLogoutModal").style.display = "none";

    if (loader) loader.classList.add("active");

    document.body.classList.add("fade-out");

    localStorage.clear();

    setTimeout(() => {
        window.location.href = "login.html";
    }, 800);
};


// ================= 🚀 NAVIGATION =================
window.navigatePage = function (page) {
    const container = document.getElementById("pageContainer");

    if (container) {
        container.classList.add("slide-out");

        setTimeout(() => {
            window.location.href = page;
        }, 300);
    } else {
        window.location.href = page;
    }
};


// ================= ACTIVE NAV =================
function setActiveNav() {
    const links = document.querySelectorAll(".nav-link");
    const currentPage = window.location.pathname.split("/").pop();

    links.forEach(link => {
        const onclick = link.getAttribute("onclick");

        if (!onclick) return;

        const match = onclick.match(/'(.*?)'/);

        if (match && match[1] === currentPage) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
}