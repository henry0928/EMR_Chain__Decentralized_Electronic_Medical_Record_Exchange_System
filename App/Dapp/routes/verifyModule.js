var express = require('express');
var router = express.Router();
const fetch = require('node-fetch');
const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const { buildCCPOrg1, buildWallet } = require('../../../app-chain/app/AppUtil.js');
const walletPath = path.join(__dirname, 'wallet');
const jwt = require('jsonwebtoken');
const TransactionRecord = "transaction-record" ; 
const TSR = "TSR" ;
const AccessControl = "access-control" ;
const ACL = "ACL" ;

/* GET home page. */
router.post('/', async function(req, res) {
  let patientId = req.body.patientId ;
  let token = req.body.token ;
  let address = req.body.address ;
  let hospitalDID = req.body.DID ;
  let requester = req.body.reqId ;
  console.log("verifyModule...") ;
  console.log(patientId) ;
  console.log(token) ;
  const wallet = await buildWallet(Wallets, walletPath) ;
  const ccp = buildCCPOrg1() ;
  let publicKey ;
  try {
    let gateway = new Gateway() ;
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
    const payloadData = jwt.verify(token, publicKey); 
    if ( payloadData["sub"] != hospitalDID )
      res.json({ message: `Verify Fail with hospitalDID`});
    if ( payloadData["iss"] != "EMRsharingSystem" )
      res.json({ message: `Verify Fail with token issuer`});
    var responseData ;
    const fhirServerAddress = address + "/Observation?subject=144&_pretty=true" ; // pretend that fhir server Knows the patient is is 144
    try {
      // const response = await fetch('https://hapi.fhir.tw/fhir/Observation?subject=144&_pretty=true');
      const response = await fetch(fhirServerAddress);
      responseData = await response.json();
      
    } // try
    catch {
      console.error(error) ;
    } // catch
    try { // success get the resource, so need to record the transaction on chain
      let gateway = new Gateway() ;
      try {
        await gateway.connect(ccp, {
          wallet : wallet,
          identity: "ntuh",
          discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
  
        const network = await gateway.getNetwork(TransactionRecord);
        const contract = network.getContract(TSR);
        console.log("Access transactionRecord channel......(verifyModule)") ;
        let _info = await contract.submitTransaction("record", patientId, requester, "ntuh",
                                                      "observation", "condition understanding", "approved") ;
        console.log(JSON.parse(_info.toString())) ;
      } // try 
      finally {
        gateway.disconnect();
      } // finally
    } // try
    catch (error) {
      console.error(`******** FAILED to run the application: ${error}`);
    } // catch
    const resultArray = responseData["entry"] ;
    res.json({ message: `Verify Success`, result: resultArray });
  } // try 
  catch (err) {
    console.log('Invalid token or token expired');
    res.json({ message: `Verify Fail`});
  } // catch
});



module.exports = router;