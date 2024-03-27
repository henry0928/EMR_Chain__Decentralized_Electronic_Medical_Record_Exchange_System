import $ from 'jquery';
function login() {
  // Add your login logic here
  alert("Login button clicked!");
}
  
function enroll() {
  // Add your redirect logic here
  alert("Enroll button clicked! Redirecting to the enrollment page...");
  // Uncomment the line below to redirect to the enrollment page
  // $.ajax({
  //   url: '/enroll',
  //   method: 'GET',
  //   success: function(response) {
  //     alert("success!") ;
  //     $('html').html(response);
  //   },
  //   error: function(xhr, status, error) {
  //     alert("fail!") ;
  //     console.log('AJAX request error:', error);
  //   }
  // });
}