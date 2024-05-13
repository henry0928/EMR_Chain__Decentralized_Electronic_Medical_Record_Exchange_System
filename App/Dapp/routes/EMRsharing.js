var express = require('express');
const fetch = require('node-fetch');
var router = express.Router();
const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const { buildCCPOrg1, buildWallet } = require('../../../app-chain/app/AppUtil.js');
const walletPath = path.join(__dirname, 'wallet');
const AccessControl = "access-control" ;
const ACL = "ACL" ;

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('EMRsharing', { title: 'Express' });
  res.render('EMRsharing', req.query);
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
}) ;

router.post('/updateInstance', async (req, res) => {
  const userId = req.body.userId ;
  const hospitalId = req.body.hospitalId ;
  const pointer = req.body.pointer ;
  const hash = req.body.hash ;
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
      console.log("Access access control channel......(update_instance)") ;
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
}) ;

router.post('/updateHash', async (req, res) => {
  const userId = req.body.userId ;
  const hospitalId = req.body.hospitalId ;
  const hash = req.body.hash ;
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
      console.log("Access access control channel......(update_hash)") ;
      info = await contract.submitTransaction("update_hash", userId, hospitalId, hash) ;
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
}) ;

router.post('/consent', async (req, res) => {
  const userId = req.body.userId ;
  const hospitalId = req.body.hospitalId ;
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

      const network = await gateway.getNetwork(AccessControl);
      const contract = network.getContract(ACL);
      console.log("Access access control channel......(update_hash)") ;
      info = await contract.submitTransaction("consent_access", userId, hospitalId) ;
      if (info)
        info = JSON.parse(info.toString()) ;
    } // try 
    finally {
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
}) ;

router.post('/revoke', async (req, res) => {
  const userId = req.body.userId ;
  const hospitalId = req.body.hospitalId ;
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

      const network = await gateway.getNetwork(AccessControl);
      const contract = network.getContract(ACL);
      console.log("Access access control channel......(update_hash)") ;
      info = await contract.submitTransaction("revoke_access", userId, hospitalId) ;
      if (info)
        info = JSON.parse(info.toString()) ;
    } // try 
    finally {
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
}) ;

router.post('/authorization', async (req, res) => {
  const patientId = req.body.patientId ;
  const patientPublicKey = req.body.patientPublicKey ;
  const patientSignature = req.body.patientSignature ;
  const doctorPublicKey = req.body.doctorPublicKey ;
  const doctorSignature = req.body.doctorSignature ;
  const requestId = req.body.requestId ;
  const requestObj = { 
    [requestId] : "none" 
  } ;
  const wallet = await buildWallet(Wallets, walletPath) ;
  let info ;
  const cgmh = "cgmh" ;
  try {
    let gateway = new Gateway() ;
    const ccp = buildCCPOrg1() ;
    try {
      await gateway.connect(ccp, {
        wallet : wallet,
        identity: cgmh,
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
      });

      const network = await gateway.getNetwork(AccessControl);
      const contract = network.getContract(ACL);
      console.log("Access access control channel......(authorization)") ;
      info = await contract.submitTransaction("authorization", patientId, patientPublicKey, doctorPublicKey, patientSignature, doctorSignature, 1, JSON.stringify(requestObj));
      if (info)
        info = JSON.parse(info.toString()) ;
    } // try 
    finally {
      gateway.disconnect();
    } // finally
  } // try
  catch (error) {
    console.error(`******** FAILED to run the application: ${error}`);
  } // catch
  if (info) {
    const returnInfo = {
      result: info["result"],
      PublicKeyRecord: info["recordInfo"],
      PublicKey: info["publicKey"]
    } ;
    // res.json({ result: returnInfo }) ;
    if (info[requestId]) { // which means authorization successs!!!
      console.log(info[requestId]) ;
      console.log(info["token"]) ;
      let payload = {
        patientId: patientId,
        token: info["token"],
        address: info[requestId]
      };
      
      let response = await fetch('http://140.113.207.45:9999/verifyModule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      let data = await response.json();
      // res.json(data) ;
      const _resource = data["result"][0]["resource"];
      
      const resData = {
        resourceType: JSON.stringify(_resource["resourceType"]),
        meta: JSON.stringify(_resource["meta"]),
        status: JSON.stringify(_resource["status"]),
        code: JSON.stringify(_resource["code"]),
        effectiveDateTime: JSON.stringify(_resource["effectiveDateTime"]),
        valueQuantity: JSON.stringify(_resource["valueQuantity"])
      };
    
      res.json(resData) ;

    } // if 
  } // if   
  else
    res.json({ result: "Please create instance first!!"}) ;
}) ;


module.exports = router;