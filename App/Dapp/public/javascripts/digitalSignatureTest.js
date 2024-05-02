const crypto = require('crypto');

// Generate an ECDSA key pair synchronously
const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'secp256k1' // also commonly used with ECDSA
});

// Create some sample data that we want to sign
const data = 'This is some data to sign';

// Create a signature
const sign = crypto.createSign('SHA256');
sign.update(data);
sign.end();
const signature = sign.sign(privateKey);

// Output the signature in base64 format
console.log('Signature:', signature.toString('base64'));

// Verify the signature
const verify = crypto.createVerify('SHA256');
verify.update(data);
verify.end();
console.log('Signature is valid:', verify.verify(publicKey, signature));