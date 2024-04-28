var express = require('express');
const readAbi = require("../public/javascripts/readcontractABI") ;
const { ethers } = require('ethers');
var router = express.Router();

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

} // verify


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
  const script = `
  <script>
    const w_address = "${walletAddress}";
    const _result = "${result}";
    const message = "verify() " + _result ;
    const alertMessage = " wallet_address: " + w_address + "\\n" + message;
    alert(alertMessage);
    window.location.href = '/EMRsharing';
  </script>
  `;
  res.send(script);
});

module.exports = router;
