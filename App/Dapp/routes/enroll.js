var express = require('express');
const readAbi = require("../public/javascripts/readcontractABI") ;
const { ethers } = require('ethers');
var crypto = require("crypto");
var router = express.Router();
const walletAddress = "0xc0d8F541Ab8B71F20c10261818F2F401e8194049" ;

async function adduser(_hashId) {
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
    await contract.addUser(_hashId); // Update with your function name and arguments if applicable    
  } // try 
  catch (error) {
    console.error("Error calling function:", error) ;
  } // catch
} // adduser()

router.get('/', function(req, res, next) {
  res.render('enroll', { title: 'Express' });
});

router.post('/', function(req, res, next) {
  const name = req.body.name;
  const email = req.body.email;
  const nationalid = req.body.nationalid ;
  console.log(name);
  console.log(email);
  console.log(nationalid); 
  hashId = crypto.createHash("sha256").update(nationalid).digest("hex") ; // To make the DID
  console.log(hashId);
  adduser(hashId) ;
  // Show pop-up with hashId and redirect to root page
  const script = `
    <script>
      const hashId = "${hashId}";
      const message = "adduser() success";
      const alertMessage = "hashId: " + hashId + "\\n" + message;
      alert(alertMessage);
      window.location.href = '/';
    </script>
  `;
  res.send(script);
});

module.exports = router;