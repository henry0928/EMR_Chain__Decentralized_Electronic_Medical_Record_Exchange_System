
const readline = require('readline-sync') ; 
const sigUtil = require('@metamask/eth-sig-util') ;
const p_key = readline.question("EncryptionPublicKey:") ;
const data = readline.question("Data:") ;

if (typeof data != "string") {
  data = JSON.stringify(data);
} // if 

const buf = Buffer.from(
  JSON.stringify(
    sigUtil.encrypt(
      { publicKey: p_key, data: data, version: 'x25519-xsalsa20-poly1305' },
    )
  ),
  'utf8'
).toString('hex') ;
// const encryptedValue = Buffer.from(JSON.stringify(buf), "utf8").toString("hex") ;
// const encryptedValue = '0x' + buf.toString('hex');
// const encryptedValue = buf.toString();

// console.log(`0x${Buffer.from(JSON.stringify(buf), 'utf8').toString('hex')}`);
// console.log(`0x${buf}`);
console.log(buf) ;
console.log(JSON.stringify(
  sigUtil.encrypt(
    { publicKey: p_key, data: data, version: 'x25519-xsalsa20-poly1305' },
  )
));