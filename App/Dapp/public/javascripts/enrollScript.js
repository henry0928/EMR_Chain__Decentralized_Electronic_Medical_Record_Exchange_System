function enroll() {
    var form = document.getElementById("enroll-form");
    var name = form.name.value;
    var email = form.email.value;
    var password = form.password.value;
  
    // You can perform additional validation or data processing here
  
    // Example: Log the entered data to the console
    alert("Name: " + name);
    alert("Email: " + email);
    alert("Password: " + password);
    
  
    // Add your backend API call or data submission logic here
    // You can use AJAX, fetch, or any other method to send the data to the server
    // For simplicity, this example logs the data to the console instead
  }