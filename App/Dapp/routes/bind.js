var express = require('express');
const readAbi = require("../public/javascripts/readcontractABI") ;
const { ethers } = require('ethers');
var router = express.Router();

async function bindwallet(_DID, _address, _usertype) {
  // Connect to the Ethereum network
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545'); // Update with your network URL

  // Set up the signer (account) that will be used to send transactions
  const privateKey = '0x0cc0c2de7e8c30525b4ca3b9e0b9703fb29569060d403261055481df7014f7fa'; // Update with your private key
  const wallet = new ethers.Wallet(privateKey, provider);

  // Set up the contract instance
  const contractAddress = '0xE6042703475D0dd1bC2eB564a55F1832c2527171'; // Update with your contract address
  const IdentityManagerAbi = readAbi("IdentityManager") ;
  const contract = new ethers.Contract(contractAddress, IdentityManagerAbi, wallet);
  // Call the contract function
  try {
    await contract.bindWallet(_DID, _address, _usertype); // Update with your function name and arguments if applicable    
  } // try 
  catch (error) {
    console.error("Error calling function:", error) ;
  } // catch
} // bindwallet()

router.get('/', function(req, res, next) {
  res.render('bind', { title: 'Express' });
});

router.post('/', (req, res) => {
  const DID = req.body.didInput ;
  const walletAddress = req.body.walletAddressInput ;
  const userType = req.body.userTypeInput ;
  let typeNum  ;
  if ( userType === "personal" )
    typeNum = 0 ;
  else 
    typeNum = 1 ;
  bindwallet(DID, walletAddress, typeNum) ; 
  // Show pop-up with hashId and redirect to root page
  const script = `
  <script>
    const address = "${walletAddress}";
    const message = "bindwallet() success";
    const alertMessage = wallet_address: " + address + "\\n" + message;
    alert(alertMessage);
    window.location.href = '/';
  </script>
  `;
  res.send(script);
});

module.exports = router;