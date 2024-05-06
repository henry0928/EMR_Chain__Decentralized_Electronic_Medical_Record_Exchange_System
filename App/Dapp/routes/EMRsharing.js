var express = require('express');
var router = express.Router();
const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const { buildCCPOrg1, buildWallet } = require('../../../app-chain/app/AppUtil.js');
const walletPath = path.join(__dirname, 'wallet');
const AccessControl = "access-control" ;
const ACL = "ACL" ;

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('EMRsharing', { title: 'Express' });
});

router.post('/getACL', async (req, res) => {
  const userId = req.body.userId ;
  const wallet = await buildWallet(Wallets, walletPath) ;
  const identity = wallet.get(userId) ;
  let info ;
  if (!identity) {
    const script = `
    <script>
      const alertMessage = "Can't find you x509Identity, Please login first!!" ;
      alert(alertMessage) ;
      window.location.href = '/EMRsharing' ;
    </script>
    `;
    res.send(script);
  } // if
  try {
    let gateway = new Gateway() ;
    const ccp = buildCCPOrg1() ;
    try {
      await gateway.connect(ccp, {
        wallet : wallet,
        identity: userId,
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
      });

      // Build a network instance based on the channel where the smart contract is deployed
      const network = await gateway.getNetwork(AccessControl);
      // Get the contract from the network.
      const contract = network.getContract(ACL);
      console.log("Access access control channel......") ;
      info = await contract.submitTransaction("get", userId) ;
      if (info)
        info = JSON.parse(info.toString()) ;
    } // try 
    finally {
      // Disconnect from the gateway when the application is closing
      // This will close all connections to the network
      gateway.disconnect();
    } // finally
  } // try
  catch (error) {
    console.error(`******** FAILED to run the application: ${error}`);
  } // catch
  if (info)
    res.json({ result: info }) ;
  else
    res.json({ result: "Please create instance first!!"}) ;
})

router.post('/updateInstance', async (req, res) => {
  const userId = req.body.userId ;
  const hospitalId = req.body.hospitalId ;
  const pointer = req.body.pointer ;
  const hash = req.body.hash ;
  console.log("hos:") ;
  console.log(hospitalId) ;
  console.log("pointer:") ;
  console.log(pointer) ;
  console.log("hash") ;
  console.log(hash) ;
  const wallet = await buildWallet(Wallets, walletPath) ;
  const identity = wallet.get(userId) ;
  let info ;
  if (!identity) {
    const script = `
    <script>
      const alertMessage = "Can't find you x509Identity, Please login first!!" ;
      alert(alertMessage) ;
      window.location.href = '/EMRsharing' ;
    </script>
    `;
    res.send(script);
  } // if
  try {
    let gateway = new Gateway() ;
    const ccp = buildCCPOrg1() ;
    try {
      await gateway.connect(ccp, {
        wallet : wallet,
        identity: userId,
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
      });

      // Build a network instance based on the channel where the smart contract is deployed
      const network = await gateway.getNetwork(AccessControl);
      // Get the contract from the network.
      const contract = network.getContract(ACL);
      console.log("Access access control channel......") ;
      info = await contract.submitTransaction("update_instance", userId, hospitalId, pointer, hash) ;
      if (info)
        info = JSON.parse(info.toString()) ;
    } // try 
    finally {
      // Disconnect from the gateway when the application is closing
      // This will close all connections to the network
      gateway.disconnect();
    } // finally
  } // try
  catch (error) {
    console.error(`******** FAILED to run the application: ${error}`);
  } // catch
  if (info)
    res.json({ result: info }) ;
  else
    res.json({ result: "Please create instance first!!"}) ;
})


module.exports = router;