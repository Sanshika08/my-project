import { db } from "./firebase_config.js";
import { collection, addDoc } from 
"https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

window.addVolunteer = async function(){

const name = document.getElementById("volName").value;
const phone = document.getElementById("volPhone").value;
const role = document.getElementById("volRole").value;

if(!name || !phone){
alert("Please fill all fields");
return;
}

try{

await addDoc(collection(db,"volunteers"),{
name:name,
phone:phone,
role:role,
status:"Active"
});

alert("Volunteer added successfully");

document.getElementById("volName").value="";
document.getElementById("volPhone").value="";
document.getElementById("volRole").value="";

}catch(error){

console.error(error);
alert("Failed to add volunteer");

}

};