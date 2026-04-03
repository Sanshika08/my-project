import { auth, db } from "./firebase_config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

async function setupUserProfile() {
    onAuthStateChanged(auth, async (user) => {

        if (!user) {
            window.location.href = "login.html";
            return;
        }

        const uid = user.uid;

        try {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);

            let name = "Admin";

            if (userSnap.exists()) {
                const data = userSnap.data();
                name = data.name || "Admin";
            }

            const email = user.email;

            // 🔥 WAIT for navbar to load
            setTimeout(() => {
                const nameEl = document.querySelector(".profile-top h3");
                const emailEl = document.querySelector(".profile-top p");
                const avatarEl = document.querySelector(".avatar");

                if (nameEl) nameEl.innerText = name;
                if (emailEl) emailEl.innerText = email;

                if (avatarEl && email) {
                    avatarEl.innerText = email.charAt(0).toUpperCase();
                }
            }, 100);

        } catch (error) {
            console.error("User fetch error:", error);
        }

    });
}

// 🔄 Load navbar
window.loadNavbar = async function () {
    const res = await fetch("../html/navbar.html");
    const data = await res.text();

    document.getElementById("navbarContainer").innerHTML = data;

    // ✅ Set active page
    setActiveNav();

    // ✅ Setup user profile (VERY IMPORTANT)
    setupUserProfile();
};

// 🔔 Sidebar
window.openSidebar = function () {
    document.getElementById("notificationSidebar").style.transform = "translateX(0)";
};

window.closeSidebar = function () {
    document.getElementById("notificationSidebar").style.transform = "translateX(100%)";
};

// 👤 Profile
window.toggleProfileMenu = function () {
    const menu = document.getElementById("profileMenu");
    menu.style.display = menu.style.display === "block" ? "none" : "block";
};

// Close outside
document.addEventListener("click", function (e) {
    const profile = document.querySelector(".profile");
    const menu = document.getElementById("profileMenu");

    if (profile && !profile.contains(e.target)) {
        menu.style.display = "none";
    }
});

// 🔐 Logout
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

// 🚀 Navigation
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


function setActiveNav() {
    const links = document.querySelectorAll(".nav-link");

    const currentPage = window.location.pathname.split("/").pop();

    links.forEach(link => {
        const onclick = link.getAttribute("onclick");

        if (!onclick) return;

        // extract page name from onclick
        const match = onclick.match(/'(.*?)'/);

        if (match && match[1] === currentPage) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
}