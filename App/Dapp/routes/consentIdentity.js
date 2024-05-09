var express = require('express');
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' }); // this will save the uploaded files in an 'uploads' directory
const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const { buildCCPOrg1, buildWallet } = require('../../../app-chain/app/AppUtil.js');
const walletPath = path.join(__dirname, 'wallet');
const walletPath2 = path.join(__dirname, 'wallet2');
const AccessControl = "access-control" ;
const ACL = "ACL" ;
const IdentityManagement = "identity-management" ; 
const IDM = "IDM" ;

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('consentIdentity', { title: 'Express' });
});

router.post('/doctor', upload.single('file1'), async function(req, res, next) {
  console.log(req.file); // log the file info to the console
  console.log(req.body); // log the text fields info to the console
  let info ;
  // You can access the DID field from the form like this:
  console.log(req.body.DID); // log the DID to the console
  const DID = req.body.DID ;
  const wallet = await buildWallet(Wallets, walletPath2) ;
  const org2ADMIN = 'org2ADMIN';
  try {
    let gateway = new Gateway() ;
    const ccp = buildCCPOrg1() ;
    try {
      await gateway.connect(ccp, {
        wallet : wallet,
        identity: org2ADMIN,
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
      });

      // Build a network instance based on the channel where the smart contract is deployed
      const network = await gateway.getNetwork(IdentityManagement);
      // Get the contract from the network.
      const contract = network.getContract(IDM);
      console.log("Access IdentityManagement channel......") ;
      info = await contract.submitTransaction("consent_doc_role", DID) ;
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

  // Send a response back to the client
  if (info)
    res.json({ result: info }) ;
  else
    res.json({ result: "Please create app-chain identity first!!"}) ;

});

router.post('/supervisor', upload.single('file2'), async function(req, res, next) {
  console.log(req.file); // log the file info to the console
  console.log(req.body); // log the text fields info to the console
  let info ;
  // You can access the DID field from the form like this:
  console.log(req.body.DID); // log the DID to the console
  const DID = req.body.DID ;
  const wallet = await buildWallet(Wallets, walletPath) ;
  const org1ADMIN = 'org1ADMIN';
  try {
    let gateway = new Gateway() ;
    const ccp = buildCCPOrg1() ;
    try {
      await gateway.connect(ccp, {
        wallet : wallet,
        identity: org1ADMIN,
        discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
      });

      // Build a network instance based on the channel where the smart contract is deployed
      const network = await gateway.getNetwork(IdentityManagement);
      // Get the contract from the network.
      const contract = network.getContract(IDM);
      console.log("Access IdentityManagement channel......") ;
      info = await contract.submitTransaction("consent_sup_role", DID, 2) ;
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

  // Send a response back to the client
  if (info)
    res.json({ result: info }) ;
  else
    res.json({ result: "Please create app-chain identity first!!"}) ;

});



module.exports = router;
