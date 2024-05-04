var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('EMRsharing', { title: 'Express' });
});

router.post('/getACL', (req, res) => {
  let key1 = req.body.key1;
  let key2 = req.body.key2;
  console.log(key1) ;
  console.log(key2) ;
  // ...do something with key1 and key2...
  res.json({ result: 'Success!' });
})

module.exports = router;