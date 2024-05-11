var express = require('express');
var router = express.Router();
const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const { buildCCPOrg1, buildWallet } = require('../../../app-chain/app/AppUtil.js');
const walletPath = path.join(__dirname, 'wallet');
const jwt = require('jsonwebtoken');
const AccessControl = "access-control" ;
const ACL = "ACL" ;

/* GET home page. */
router.post('/', async function(req, res) {
  let patientId = req.body.patientId ;
  let token = req.body.token ;
  console.log("verifyModule...") ;
  console.log(patientId) ;
  console.log(token) ;
  const wallet = await buildWallet(Wallets, walletPath) ;
  let publicKey ;
  try {
    let gateway = new Gateway() ;
    const ccp = buildCCPOrg1() ;
    try {
      await gateway.connect(ccp, {
        wallet : wallet,
        identity: "admin",
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
      });

      const network = await gateway.getNetwork(AccessControl);
      const contract = network.getContract(ACL);
      console.log("Access access contril channel......(verifyModule)") ;
      const requestStr = patientId + "public" ;
      console.log("test...") ;
    //   console.log(requestStr) ;
      publicKey = await contract.submitTransaction("get_public", requestStr) ;
      publicKey = publicKey.toString() ;
      console.log(publicKey) ;
    } // try 
    finally {
      gateway.disconnect();
    } // finally
  } // try
  catch (error) {
    console.error(`******** FAILED to run the application: ${error}`);
  } // catch
  try {
    const userData = jwt.verify(token, publicKey);
    console.log(userData);
    res.json({ message: `Verify Success`, data: userData });
  } // try 
  catch (err) {
    console.log('Invalid token or token expired');
    res.json({ message: `Verify Fail`});
  } // catch
});



module.exports = router;