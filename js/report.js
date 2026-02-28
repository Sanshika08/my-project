// Logout
function logout(){
    window.location.href = "login.html";
}

// Redirect to form page
function redirectToForm(){
    window.location.href = "add-report.html";
}

// Fetch Reports from Backend
async function fetchReports(){
    try{
        const response = await fetch("http://localhost:8080/api/reports");
        const data = await response.json();

        const tableBody = document.getElementById("tableBody");
        tableBody.innerHTML = "";

        data.forEach(report => {
            const row = `
                <tr>
                    <td>${report.id}</td>
                    <td>${report.animalType}</td>
                    <td>${report.location}</td>
                    <td>${report.date}</td>
                    <td>${report.status}</td>
                    <td>
                        <button class="action-btn view">View</button>
                        <button class="action-btn delete">Delete</button>
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });

    } catch(error){
        console.error("Error fetching reports:", error);
    }
}

// Search Function
function searchTable(){
    let input = document.getElementById("searchInput").value.toLowerCase();
    let rows = document.querySelectorAll("#tableBody tr");

    rows.forEach(row => {
        let location = row.cells[2].innerText.toLowerCase();
        row.style.display = location.includes(input) ? "" : "none";
    });
}

// Load data when page opens
window.onload = fetchReports;
