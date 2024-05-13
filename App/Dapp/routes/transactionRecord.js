var express = require('express');
var router = express.Router();
const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const { buildCCPOrg1, buildWallet } = require('../../../app-chain/app/AppUtil.js');
const walletPath = path.join(__dirname, 'wallet');
const TransactionRecord = "transaction-record" ; 
const TSR = "TSR" ;

router.get('/', function(req, res, next) {
  res.render('transactionRecord', { title: 'Express' });
});

router.post('/', async (req, res) => {
    const patientPublucKey = req.body.patientPublicKey ;
    const wallet = await buildWallet(Wallets, walletPath) ;
    let info ; 
    try {
      let gateway = new Gateway() ;
      const ccp = buildCCPOrg1() ;
      try {
        await gateway.connect(ccp, {
          wallet : wallet,
          identity: "admin",
          discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });
        const network = await gateway.getNetwork(TransactionRecord);
        const contract = network.getContract(TSR);
        console.log("Access access control channel......") ;
        info = await contract.submitTransaction("get_record", patientPublucKey) ;
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
      res.json({ result: "There in no Record on channel!!"}) ;
  }) ;
  

module.exports = router;