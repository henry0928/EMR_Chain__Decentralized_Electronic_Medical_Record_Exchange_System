var express = require('express');
const readAbi = require("../public/javascripts/readcontractABI");
const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin} = require('../../../app-chain/app/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../../app-chain/app/AppUtil.js');
const { ethers } = require('ethers');
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
  const x509 = "0000" ;
  const app_id = "1111" ;
  let info ;
  try {
    const ccp = buildCCPOrg1();
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
		const wallet = await buildWallet(Wallets, walletPath);
		await enrollAdmin(caClient, wallet, mspOrg1);
		await registerAndEnrollUser(caClient, wallet, mspOrg1, adminID); // Enroll the ADMIN
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
			info = await contract.submitTransaction("create_identity", publicKey, app_id, did, x509) ;
			console.log(info.toString()) ;
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

  return JSON.parse(info.toString());
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
  if (result) {
    const object = await createIdentity(walletAddress, DID) ;
    let Info ;
    if (object.hasOwnProperty('success'))
      Info = "Success " + object["success"] ;
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
