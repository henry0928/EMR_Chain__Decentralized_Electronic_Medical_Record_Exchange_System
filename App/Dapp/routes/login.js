var express = require('express');
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('node:fs');
const { buildCAClient, registerAndEnrollUser, enrollAdmin} = require('../../../app-chain/app/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../app-chain/app/AppUtil.js');
var AES = require("crypto-js/aes") ;
var encUtf8 = require('crypto-js/enc-utf8');

const channelName = process.env.CHANNEL_NAME || 'my-channel1';
const chaincodeName = process.env.CHAINCODE_NAME || 'chaincode1';
const IdentityManagement = "identity-management" ; 
const IDM = "IDM" ;

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const adminID = "org1ADMIN" ;

var router = express.Router();

async function login(publicKey, signature, message) {
    let info ; 
    try {
      const ccp = buildCCPOrg1() ;
      const wallet = await buildWallet(Wallets, walletPath);
      let gateway = new Gateway() ;
      try {
        await gateway.connect(ccp, {
            wallet : wallet,
            identity: adminID,
            discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
        });

        // Build a network instance based on the channel where the smart contract is deployed
        const network = await gateway.getNetwork(IdentityManagement);
        // Get the contract from the network.
        const contract = network.getContract(IDM);
        console.log("Access IdentityManagement channel......") ;``
        info = await contract.submitTransaction("login", publicKey, signature, message) ;
      } // try 
      finally {
        gateway.disconnect();
      } // finally

    } // try 
    catch (error) {
      console.error(`******** FAILED to run the application: ${error}`);
    } // catch

    return JSON.parse(info.toString()) ;

} // login()

router.get('/', function(req, res, next) {
  res.render('login', { title: 'Express' });
});

router.post('/', async(req, res) => {
    const wallet = await buildWallet(Wallets, walletPath);
    const walletAddress = req.body.walletAddressInput ;
    const signature = req.body.signatureInput ;
    // const message = req.body.messageInput ;
    const encryptKey = req.body.encryptKeyInput ;
    const resultObject = await login(walletAddress, signature, "message") ;
    // const bytes = AES.decrypt(encryptKey, '1234');
    // const privateKeyPartial = bytes.toString(encUtf8);
    // resultObject["app-chain PrivateKey"] = privateKeyPartial ;
    // 解密user x509Identity
    var _bytes = AES.decrypt(resultObject["x509IdentityCipher"], encryptKey) ;
    const userX509Identity = JSON.parse(_bytes.toString(encUtf8)) ;
    console.log("x509Identity....") ;
    console.log(userX509Identity) ;
    await wallet.put(resultObject["AppId"], userX509Identity) ;
    const userId = resultObject["AppId"] ;
    const role = resultObject["Role"] ;
    const redirectUrl = `/EMRsharing?userId=${userId}&role=${role}`;
    res.redirect(redirectUrl);
    // res.render('EMRsharing', { userId: userId, role: role });
});

module.exports = router;