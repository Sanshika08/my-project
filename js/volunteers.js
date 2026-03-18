import { db } from "./firebase_config.js";

import {
collection,
onSnapshot
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";


const container = document.getElementById("volunteerTable");

// Get volunteer name from URL
const params = new URLSearchParams(window.location.search);
const selectedVolunteer = params.get("name");


onSnapshot(collection(db, "volunteers"), (snapshot) => {

container.innerHTML = "";

snapshot.forEach(doc => {

const data = doc.data();

const firstLetter = data.name ? data.name.charAt(0).toUpperCase() : "?";

// check if this is the selected volunteer
const isSelected = data.name === selectedVolunteer;

const card = `
<div class="vol-card ${isSelected ? "active-card" : ""}">

    <div class="vol-actions">
        <i class="fas fa-edit edit-btn" onclick="editVolunteer('${doc.id}')"></i>
        <i class="fas fa-trash delete-btn" onclick="deleteVolunteer('${doc.id}')"></i>
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

    <span class="status">Active</span>

</div>
`;

container.innerHTML += card;

});


// scroll to highlighted volunteer
if(selectedVolunteer){

setTimeout(()=>{

const selectedCard = document.querySelector(".active-card");

if(selectedCard){
selectedCard.scrollIntoView({
behavior:"smooth",
block:"center"
});
}

},200);

}

});

//EDIT FUNCTION
window.editVolunteer = function (id) {
    window.location.href = `add_volunteer.html?id=${id}`;
};

//DELETE FUNCTION
import { doc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

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