function approve(){
    const badge=document.getElementById("statusBadge");
    badge.innerText = badge.innerText==="Pending" ? "Approved" : "Pending";
    badge.style.background = badge.innerText==="Approved" ? "#2ecc71" : "#f39c12";
}

function deleteReport(){
    if(confirm("Delete this report?")){
        document.getElementById("spinner").style.display="block";
        setTimeout(()=>{
            alert("Deleted");
            document.getElementById("spinner").style.display="none";
        },1500);
    }
}

function goBack(){
    window.location.href="report.html";
}

function toggleMode(){
    document.body.classList.toggle("dark");
}

