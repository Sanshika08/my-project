function togglePassword(){
  var pass = document.getElementById("password");
  if(pass.type === "password"){
    pass.type = "text";
  } else {
    pass.type = "password";
  }
}
function goToReport() {
  window.location.href="../html/report.html";
}

