var express = require('express');
const readAbi = require("../public/javascripts/readcontractABI");
const privateKeyGen = require("../public/javascripts/16privateKeyGen");
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('node:fs');
const { buildCAClient, registerAndEnrollUser, enrollAdmin, registerAndEnrollUserV2} = require('../../../app-chain/app/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../app-chain/app/AppUtil.js');
const { ethers } = require('ethers');
const AES = require("crypto-js/aes") ;
const encUtf8 = require('crypto-js/enc-utf8');
var router = express.Router();

const channelName = process.env.CHANNEL_NAME || 'my-channel1';
const chaincodeName = process.env.CHAINCODE_NAME || 'chaincode1';
const IdentityManagement = "identity-management" ; 
const IDM = "IDM" ;

const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const adminID = "ADMIN" ;

async function verify(_DID, _messageHash, _signature) {
  // Connect to the Ethereum network
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545'); // Update with your network URL

  // Set up the signer (account) that will be used to send transactions
  const privateKey = '0x0cc0c2de7e8c30525b4ca3b9e0b9703fb29569060d403261055481df7014f7fa'; // Need to change to different account
  const wallet = new ethers.Wallet(privateKey, provider);

  // Set up the contract instance
  const contractAddress = '0xE6042703475D0dd1bC2eB564a55F1832c2527171'; 
  const IdentityManagerAbi = readAbi("IdentityManager") ;
  const contract = new ethers.Contract(contractAddress, IdentityManagerAbi, wallet);
  let result;
  // Call the contract function
  try {
    result = await contract.authentication(_DID, _messageHash, _signature);
  } // try 
  catch (error) {
    console.error("Error calling function:", error) ;
  } // catch

  return result ;

} // verify()

async function createIdentity(publicKey, did) {
  let info, key ;
  try {
    const app_id = Date.now().toString() ; // tine use for App-chain id
    const ccp = buildCCPOrg1();
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
		const wallet = await buildWallet(Wallets, walletPath);
		await enrollAdmin(caClient, wallet, mspOrg1);
		await registerAndEnrollUser(caClient, wallet, mspOrg1, adminID); // Enroll the ADMIN
    const x509Identity = await registerAndEnrollUserV2(caClient, wallet, mspOrg1, app_id); // Enroll the user
    console.log("x509...") ;
    console.log(x509Identity) ;
    // 加密
    key = privateKeyGen(x509Identity["credentials"]) ;
    console.log("key...") ;
    console.log(key) ;
    var x509Identity_ciphertext = AES.encrypt(JSON.stringify(x509Identity), key).toString() ;
    console.log("cipher...") ;
    console.log(x509Identity_ciphertext) ;
		let gateway = new Gateway();
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
			console.log("Access IdentityManagement channel......") ;
			info = await contract.submitTransaction("create_identity", publicKey, app_id, did, x509Identity_ciphertext) ;
      console.log("get....") ;
      var _info = await contract.submitTransaction("get", publicKey) ;
      _info = JSON.parse(_info.toString()) ;
      console.log(_info) ;
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

  // 解密
  // var bytes  = AES.decrypt(_info["x509IdentityCipher"], key) ;
  // var originalObj = JSON.parse(bytes.toString(encUtf8)) ;
  // console.log("originObj...") ;
  // console.log(originalObj) ;


  const result = JSON.parse(info.toString()) ;
  result["key"] = key ;
  return result ;
} // createIdentity()


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('createIdentity', { title: 'Express' });
});

router.post('/', async(req, res) => {
  const walletAddress = req.body.walletAddressInput ;
  const DID = req.body.DIDInput ;
  const messageHash = req.body.messageHashInput ;
  const signature = req.body.signatureInput ;
  const result = await verify(DID, messageHash, signature) ;
  console.log("still...") ;
  if (result) {
    const object = await createIdentity(walletAddress, DID) ;
    let Info ;
    if (object.hasOwnProperty('success'))
      Info = "Success " + object["success"] + "\\n" + "key: " + object["key"] ;
    else 
      Info = "Error " + object["error"] ;
    const script = `
    <script>
      const w_address = "${walletAddress}"; 
      const _Info = "${Info}";
      const message = "CreateIdentity " + _Info ;
      const alertMessage = " wallet_address: " + w_address + "\\n" + message;
      alert(alertMessage);
      window.location.href = '/EMRsharing';
    </script>
    `;
    res.send(script);
  } // if
  else {
    const script = `
    <script>
      const w_address = "${walletAddress}"; 
      const message = "verify FAIL!!" ;
      const alertMessage = " wallet_address: " + w_address + "\\n" + message;
      alert(alertMessage);
      window.location.href = '/EMRsharing';
    </script>
    `;
    res.send(script);
  } // else   
});

module.exports = router;
