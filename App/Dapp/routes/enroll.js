var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('enroll', { title: 'Express' });
});

router.post('/', function(req, res, next) {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const nationalid = req.body.nationalid ;
  console.log(name) ;
  console.log(email) ;
  console.log(password) ; 
  console.log(nationalid) ; 
});

module.exports = router;