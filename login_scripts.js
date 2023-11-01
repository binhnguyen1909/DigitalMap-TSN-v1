document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();

  // Replace this with your actual authentication logic
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;

  // Check if the credentials are correct
  if (username === "admin" && password === "admin") {
    alert("Login successful");

    // Redirect to your main page
    window.location.href = "index.html";
  } else {
    alert("Login failed. Please check your credentials.");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  const logoutButton = document.getElementById("guest-mode-btn");

  logoutButton.addEventListener("click", function () {
    // Make an AJAX request to Google Apps Script for logging out
    window.location.href = "index.html";
  });
});
